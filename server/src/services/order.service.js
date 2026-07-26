import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { PaymentStatus, OrderStatus, CopyStatus, CancellationReason, InventoryAction, UserRole } from '@prisma/client';

export const createOrder = async ({ userId, items, shippingAddress }) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required.');
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Order items are required.');
  }
  if (!shippingAddress) {
    throw new ApiError(400, 'Shipping address is required.');
  }

  // Deduplicate and merge items by bookId, ensuring quantity > 0
  const mergedItemsMap = new Map();
  for (const item of items) {
    if (!item.bookId) {
      throw new ApiError(400, 'Each item must specify a bookId.');
    }
    const qty = Math.floor(Number(item.quantity || 1));
    if (isNaN(qty) || qty <= 0) {
      throw new ApiError(400, 'Item quantity must be a positive integer.');
    }
    const unitPrice = Number(item.unitPrice || item.price || 24.99);

    if (mergedItemsMap.has(item.bookId)) {
      const existing = mergedItemsMap.get(item.bookId);
      existing.quantity += qty;
    } else {
      mergedItemsMap.set(item.bookId, {
        bookId: item.bookId,
        quantity: qty,
        unitPrice
      });
    }
  }

  const mergedItems = Array.from(mergedItemsMap.values());

  // Calculate total amount
  let totalAmount = 0;
  for (const item of mergedItems) {
    totalAmount += item.unitPrice * item.quantity;
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return await prisma.$transaction(async (tx) => {
    const itemReservations = [];

    // Step 1: Validate stock & reserve physical copies
    for (const item of mergedItems) {
      const book = await tx.book.findUnique({
        where: { id: item.bookId },
        include: {
          copies: {
            where: { status: CopyStatus.AVAILABLE },
            orderBy: { createdAt: 'asc' },
            take: item.quantity
          }
        }
      });

      if (!book || book.isDeleted) {
        throw new ApiError(404, `Book with ID "${item.bookId}" is unavailable.`);
      }

      if (!book.isForSale) {
        throw new ApiError(400, `Book "${book.title}" is not available for purchase.`);
      }

      if (book.stockQuantity < item.quantity) {
        throw new ApiError(400, `Insufficient stock for "${book.title}". Available: ${book.stockQuantity}`);
      }

      if (book.copies.length < item.quantity) {
        throw new ApiError(400, `Insufficient physical copies available for "${book.title}". Available copies: ${book.copies.length}`);
      }

      const reservedCopies = book.copies;
      const reservedCopyIds = reservedCopies.map((c) => c.id);

      // Decrement stockQuantity atomically
      await tx.book.update({
        where: { id: item.bookId },
        data: {
          stockQuantity: book.stockQuantity - item.quantity
        }
      });

      itemReservations.push({
        item,
        book,
        previousStock: book.stockQuantity,
        newStock: book.stockQuantity - item.quantity,
        reservedCopyIds
      });
    }

    // Step 2: Create Order and OrderItems
    const order = await tx.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PLACED,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        items: {
          create: mergedItems.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                coverImage: true
              }
            }
          }
        }
      }
    });

    // Step 3: Link reserved BookCopy records to created OrderItems and write InventoryAudit
    for (const res of itemReservations) {
      const createdOrderItem = order.items.find((oi) => oi.bookId === res.item.bookId);
      if (createdOrderItem && res.reservedCopyIds.length > 0) {
        await tx.bookCopy.updateMany({
          where: { id: { in: res.reservedCopyIds } },
          data: {
            status: CopyStatus.RESERVED,
            orderItemId: createdOrderItem.id
          }
        });
      }

      // Record Audit
      await tx.inventoryAudit.create({
        data: {
          bookId: res.item.bookId,
          orderId: order.id,
          userId,
          action: InventoryAction.STOCK_RESERVED,
          quantityChanged: -res.item.quantity,
          previousStock: res.previousStock,
          newStock: res.newStock,
          affectedCopyIds: res.reservedCopyIds
        }
      });
    }

    return order;
  });
};

export const cancelOrder = async ({ orderId, userId, userRole, reason }) => {
  if (!orderId) {
    throw new ApiError(400, 'Order ID is required.');
  }

  // Step 1: Retrieve order to check existence and authorization
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          copies: true,
          book: true
        }
      }
    }
  });

  if (!existingOrder) {
    throw new ApiError(404, 'Order not found.');
  }

  // Authorization check: User must own the order or be an ADMIN
  if (userRole !== UserRole.ADMIN && existingOrder.userId !== userId) {
    throw new ApiError(403, 'You are not authorized to cancel this order.');
  }

  if (existingOrder.orderStatus === OrderStatus.CANCELLED) {
    throw new ApiError(409, 'Order is already cancelled.');
  }

  if (existingOrder.orderStatus === OrderStatus.DELIVERED) {
    throw new ApiError(409, 'Cannot cancel order after delivery.');
  }

  if (![OrderStatus.PLACED, OrderStatus.PROCESSING].includes(existingOrder.orderStatus)) {
    throw new ApiError(409, `Order cannot be cancelled in status ${existingOrder.orderStatus}.`);
  }

  // Determine dynamic payment status transition
  const targetPaymentStatus = existingOrder.paymentStatus === PaymentStatus.PAID
    ? PaymentStatus.REFUNDED
    : PaymentStatus.FAILED;

  const validReason = reason && Object.values(CancellationReason).includes(reason)
    ? reason
    : (userRole === UserRole.ADMIN ? CancellationReason.ADMIN_CANCELLED : CancellationReason.USER_REQUEST);

  return await prisma.$transaction(async (tx) => {
    // Step 2: Optimistic Concurrency Update
    const updateResult = await tx.order.updateMany({
      where: {
        id: orderId,
        orderStatus: { in: [OrderStatus.PLACED, OrderStatus.PROCESSING] }
      },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: targetPaymentStatus,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: validReason
      }
    });

    if (updateResult.count === 0) {
      const recheckedOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (!recheckedOrder) throw new ApiError(404, 'Order not found.');
      if (recheckedOrder.orderStatus === OrderStatus.CANCELLED) {
        throw new ApiError(409, 'Order is already cancelled.');
      }
      throw new ApiError(409, `Order cannot be cancelled in status ${recheckedOrder.orderStatus}.`);
    }

    // Step 3: Restore Stock, Release BookCopies, and Create InventoryAudit
    for (const item of existingOrder.items) {
      const qty = item.quantity;
      const bookId = item.bookId;

      // Find reserved copies for this order item
      let copyIds = item.copies ? item.copies.map((c) => c.id) : [];

      if (copyIds.length > 0) {
        await tx.bookCopy.updateMany({
          where: { id: { in: copyIds } },
          data: {
            status: CopyStatus.AVAILABLE,
            orderItemId: null
          }
        });
      } else {
        // Fallback: release any RESERVED copies for this book if not explicitly linked
        const fallbackCopies = await tx.bookCopy.findMany({
          where: { bookId, status: CopyStatus.RESERVED },
          take: qty,
          select: { id: true }
        });
        if (fallbackCopies.length > 0) {
          copyIds = fallbackCopies.map((c) => c.id);
          await tx.bookCopy.updateMany({
            where: { id: { in: copyIds } },
            data: {
              status: CopyStatus.AVAILABLE,
              orderItemId: null
            }
          });
        }
      }

      // Increment Book.stockQuantity
      const updatedBook = await tx.book.update({
        where: { id: bookId },
        data: {
          stockQuantity: { increment: qty }
        }
      });

      // Record Audit
      await tx.inventoryAudit.create({
        data: {
          bookId,
          orderId,
          userId,
          action: InventoryAction.STOCK_RELEASED,
          quantityChanged: qty,
          previousStock: updatedBook.stockQuantity - qty,
          newStock: updatedBook.stockQuantity,
          affectedCopyIds: copyIds
        }
      });
    }

    // Step 4: Return full updated Order
    return await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                coverImage: true
              }
            }
          }
        }
      }
    });
  });
};

export const getMyOrders = async ({ userId }) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required.');
  }

  return await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true
            }
          }
        }
      }
    }
  });
};

export const getAllOrders = async ({ status, search } = {}) => {
  const where = {};
  if (status) {
    where.orderStatus = status;
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { shippingAddress: { contains: search, mode: 'insensitive' } }
    ];
  }

  return await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      },
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true
            }
          }
        }
      }
    }
  });
};
