import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { PaymentStatus, OrderStatus } from '@prisma/client';

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

  // Calculate total amount
  let totalAmount = 0;
  for (const item of items) {
    const price = Number(item.unitPrice || item.price || 24.99);
    const qty = Number(item.quantity || 1);
    totalAmount += price * qty;
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PLACED,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        items: {
          create: items.map((item) => ({
            bookId: item.bookId,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || item.price || 24.99)
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

    return order;
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
