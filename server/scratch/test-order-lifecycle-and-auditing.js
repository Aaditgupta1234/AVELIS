import { prisma } from '../src/lib/prisma.js';
import * as orderService from '../src/services/order.service.js';
import { CopyStatus, OrderStatus, InventoryAction } from '@prisma/client';

async function runVerification() {
  console.log('--- STARTING ORDER LIFECYCLE & INVENTORY AUDIT VERIFICATION ---');

  try {
    // 1. Get or create test user
    let user = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
    if (!user) {
      user = await prisma.user.findFirst();
    }
    if (!user) {
      console.error('No test user found in DB');
      process.exit(1);
    }
    console.log(`Using test user: ${user.username} (${user.id})`);

    // 2. Find a book with available copies
    const book = await prisma.book.findFirst({
      where: {
        isDeleted: false,
        isForSale: true,
        stockQuantity: { gte: 1 },
        copies: {
          some: { status: CopyStatus.AVAILABLE }
        }
      },
      include: {
        copies: { where: { status: CopyStatus.AVAILABLE } }
      }
    });

    if (!book) {
      console.error('No suitable test book found with AVAILABLE copies.');
      process.exit(1);
    }

    const initialStock = book.stockQuantity;
    const initialAvailableCopiesCount = book.copies.length;
    console.log(`\nTesting with Book "${book.title}" (ID: ${book.id})`);
    console.log(`Initial Stock: ${initialStock}, Available Copies: ${initialAvailableCopiesCount}`);

    // 3. Test Order Creation
    console.log('\n--- Step 1: Creating Order ---');
    const orderPayload = {
      userId: user.id,
      items: [
        {
          bookId: book.id,
          quantity: 1,
          unitPrice: Number(book.sellingPrice || 24.99)
        }
      ],
      shippingAddress: '123 Test St, Test City'
    };

    const createdOrder = await orderService.createOrder(orderPayload);
    console.log(`Order created successfully: ${createdOrder.orderNumber} (ID: ${createdOrder.id})`);
    console.log(`Order Status: ${createdOrder.orderStatus}, Payment Status: ${createdOrder.paymentStatus}`);

    // Verify stock decremented
    const bookAfterOrder = await prisma.book.findUnique({
      where: { id: book.id },
      include: { copies: true }
    });
    console.log(`Stock after order: ${bookAfterOrder.stockQuantity} (Expected: ${initialStock - 1})`);
    if (bookAfterOrder.stockQuantity !== initialStock - 1) {
      throw new Error(`Stock decrement failed! Current: ${bookAfterOrder.stockQuantity}, Expected: ${initialStock - 1}`);
    }

    // Verify copy reservation status & link
    const reservedCopies = bookAfterOrder.copies.filter((c) => c.status === CopyStatus.RESERVED);
    console.log(`Reserved copies count: ${reservedCopies.length}`);
    if (reservedCopies.length === 0) {
      throw new Error('No physical copies were updated to RESERVED status!');
    }

    // Verify InventoryAudit created for STOCK_RESERVED
    const reservedAudit = await prisma.inventoryAudit.findFirst({
      where: { orderId: createdOrder.id, action: InventoryAction.STOCK_RESERVED },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Audit Record (STOCK_RESERVED):`, reservedAudit ? `ID: ${reservedAudit.id}, diff: ${reservedAudit.quantityChanged}` : 'MISSING!');
    if (!reservedAudit || reservedAudit.quantityChanged !== -1) {
      throw new Error('InventoryAudit for STOCK_RESERVED was not properly recorded!');
    }

    // 4. Test Order Cancellation
    console.log('\n--- Step 2: Cancelling Order ---');
    const cancelledOrder = await orderService.cancelOrder({
      orderId: createdOrder.id,
      userId: user.id,
      userRole: user.role,
      reason: 'USER_REQUEST'
    });

    console.log(`Order cancelled successfully! Status: ${cancelledOrder.orderStatus}, PaymentStatus: ${cancelledOrder.paymentStatus}`);
    if (cancelledOrder.orderStatus !== OrderStatus.CANCELLED) {
      throw new Error(`Order status mismatch! Got: ${cancelledOrder.orderStatus}, Expected: CANCELLED`);
    }

    // Verify stock restored
    const bookAfterCancel = await prisma.book.findUnique({
      where: { id: book.id },
      include: { copies: true }
    });
    console.log(`Stock after cancellation: ${bookAfterCancel.stockQuantity} (Expected: ${initialStock})`);
    if (bookAfterCancel.stockQuantity !== initialStock) {
      throw new Error(`Stock restoration failed! Current: ${bookAfterCancel.stockQuantity}, Expected: ${initialStock}`);
    }

    // Verify copy status restored to AVAILABLE
    const restoredCopy = await prisma.bookCopy.findUnique({ where: { id: reservedAudit.affectedCopyIds[0] } });
    console.log(`Restored copy status: ${restoredCopy?.status} (Expected: AVAILABLE)`);
    if (restoredCopy?.status !== CopyStatus.AVAILABLE) {
      throw new Error(`BookCopy status restoration failed! Status: ${restoredCopy?.status}`);
    }

    // Verify InventoryAudit created for STOCK_RELEASED
    const releasedAudit = await prisma.inventoryAudit.findFirst({
      where: { orderId: createdOrder.id, action: InventoryAction.STOCK_RELEASED },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Audit Record (STOCK_RELEASED):`, releasedAudit ? `ID: ${releasedAudit.id}, diff: ${releasedAudit.quantityChanged}` : 'MISSING!');
    if (!releasedAudit || releasedAudit.quantityChanged !== 1) {
      throw new Error('InventoryAudit for STOCK_RELEASED was not properly recorded!');
    }

    // 5. Test Double Cancellation Protection (Idempotency / Conflict)
    console.log('\n--- Step 3: Testing Double Cancellation Protection ---');
    try {
      await orderService.cancelOrder({
        orderId: createdOrder.id,
        userId: user.id,
        userRole: user.role
      });
      throw new Error('Double cancellation should have failed but succeeded!');
    } catch (err) {
      console.log(`Double cancellation correctly rejected with message: "${err.message}" (Status Code: ${err.statusCode})`);
      if (err.statusCode !== 409) {
        throw new Error(`Expected 409 status code for double cancellation, got ${err.statusCode}`);
      }
    }

    console.log('\n======================================================');
    console.log('SUCCESS: ALL ORDER LIFECYCLE & AUDITING TESTS PASSED!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\nVERIFICATION FAILED:', error);
    process.exit(1);
  }
}

runVerification();
