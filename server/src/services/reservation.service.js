import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { UserRole, CopyStatus, ReservationStatus, LoanStatus, CopyCondition } from '@prisma/client';
import { getUserOrThrow, getBookOrThrow } from '../helpers/resource.helper.js';

import { config } from '../config/env.js';

export const MAX_ACTIVE_RESERVATIONS_LIMIT = config.maxActiveReservations;
export const RESERVATION_PICKUP_WINDOW_HOURS = config.reservationPickupWindowHours;

import { RESERVATION_SELECT, RESERVATION_SELECT_WITH_OWNER } from '../shared/selects/reservation.select.js';

/**
 * Service to create a book reservation.
 *
 * @param {Object} reservationData - Input data containing userId, bookId, and currentUser
 * @returns {Promise<Object>} The created reservation record
 * @throws {ApiError} 404 if user or book not found
 * @throws {ApiError} 403 if member attempts to reserve for another user
 * @throws {ApiError} 400 if validation or business rules fail
 */
export const createReservation = async ({ userId, bookId, currentUser }) => {
  // 1. Verify target user exists
  const user = await getUserOrThrow(userId, prisma, { id: true, role: true });

  // 2. Only admins can reserve for other users; members only for themselves
  if (currentUser.role !== UserRole.ADMIN && userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied. You can only create reservations for yourself.');
  }

  // 3. Only members can reserve books
  if (user.role !== UserRole.MEMBER) {
    throw new ApiError(400, 'Only members can reserve books.');
  }

  // 4. Verify book exists and is eligible for reservations
  const book = await getBookOrThrow(bookId, prisma, { id: true, isDeleted: true, isBorrowable: true });
  if (book.isDeleted) {
    throw new ApiError(400, 'Book is soft deleted and cannot be reserved.');
  }
  if (!book.isBorrowable) {
    throw new ApiError(400, 'Book is not borrowable.');
  }

  // 5. Verify physical inventory: book must have at least one copy in the system
  const copyCount = await prisma.bookCopy.count({
    where: { bookId }
  });
  if (copyCount === 0) {
    throw new ApiError(400, 'This book cannot be reserved because no physical copies exist.');
  }

  // 6. Check for active overdue loans
  const overdueLoanCount = await prisma.loan.count({
    where: {
      userId,
      status: LoanStatus.OVERDUE
    }
  });
  if (overdueLoanCount > 0) {
    throw new ApiError(400, 'Cannot create reservation. User has active overdue loans.');
  }

  // 7. Check active reservations count
  const activeReservationCount = await prisma.reservation.count({
    where: {
      userId,
      status: {
        in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP]
      }
    }
  });
  if (activeReservationCount >= MAX_ACTIVE_RESERVATIONS_LIMIT) {
    throw new ApiError(400, 'Cannot create reservation. Active reservation limit reached.');
  }

  // 8. Check for duplicate active reservation for the same book
  const existingActiveReservation = await prisma.reservation.findFirst({
    where: {
      userId,
      bookId,
      status: {
        in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP]
      }
    }
  });
  if (existingActiveReservation) {
    throw new ApiError(400, 'You already have an active reservation for this book.');
  }

  // 9. Execute copy allocation and reservation creation within a transaction
  return await prisma.$transaction(async (tx) => {
    // Search for a copy that is AVAILABLE and not DAMAGED
    const availableCopy = await tx.bookCopy.findFirst({
      where: {
        bookId,
        status: CopyStatus.AVAILABLE,
        condition: {
          not: CopyCondition.DAMAGED
        }
      }
    });

    if (availableCopy) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + RESERVATION_PICKUP_WINDOW_HOURS * 60 * 60 * 1000);

      // Update BookCopy status to RESERVED only if it is still AVAILABLE (OCC check)
      const updateResult = await tx.bookCopy.updateMany({
        where: { id: availableCopy.id, status: CopyStatus.AVAILABLE },
        data: { status: CopyStatus.RESERVED }
      });

      if (updateResult.count > 0) {
        // Create Reservation
        const reservation = await tx.reservation.create({
          data: {
            userId,
            bookId,
            copyId: availableCopy.id,
            status: ReservationStatus.READY_FOR_PICKUP,
            fulfilledAt: now,
            expiresAt
          },
          select: RESERVATION_SELECT
        });

        return reservation;
      }
    }

    // No available copies (or concurrently reserved), put in PENDING queue
    const reservation = await tx.reservation.create({
      data: {
        userId,
        bookId,
        copyId: null,
        status: ReservationStatus.PENDING
      },
      select: RESERVATION_SELECT
    });

    return reservation;
  });
};

/**
 * Service to retrieve a single reservation by ID.
 *
 * @param {Object} queryData - Input data containing reservationId and currentUser
 * @returns {Promise<Object>} The reservation record
 * @throws {ApiError} 404 if reservation not found
 * @throws {ApiError} 403 if member attempts to retrieve another user's reservation
 */
export const getReservationById = async ({ reservationId, currentUser }) => {
  // Step 1: Fetch minimal ownership metadata for authorization checks
  const reservationData = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: RESERVATION_SELECT_WITH_OWNER
  });

  // Step 2: Validate existence
  if (!reservationData) {
    throw new ApiError(404, 'Reservation not found.');
  }

  // Step 3: Validate ownership/role authorization
  if (currentUser.role === UserRole.MEMBER && reservationData.userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied. You can only retrieve your own reservations.');
  }

  // Step 4: Destructure to extract the public API payload
  const { userId, ...reservation } = reservationData;
  return reservation;
};

/**
 * Service to retrieve a paginated, sorted, and filtered list of all reservations.
 *
 * @param {Object} queryParams - Validated query parameters
 * @returns {Promise<Object>} Object containing reservations array and pagination metadata
 */
export const getReservations = async ({ page, limit, sortBy, sortOrder, status, userId, bookId }) => {
  // Stage 1: Build Prisma where clause
  const where = {
    book: {
      isDeleted: false
    }
  };
  if (status) {
    where.status = status;
  }
  if (userId) {
    where.userId = userId;
  }
  if (bookId) {
    where.bookId = bookId;
  }

  // Stage 2: Build Prisma orderBy clause
  const orderBy = [{ [sortBy]: sortOrder }];
  if (sortBy !== 'id') {
    orderBy.push({ id: 'asc' });
  }

  // Stage 3: Build pagination values
  const skip = (page - 1) * limit;
  const take = limit;

  // Stage 4: Execute Prisma queries concurrently
  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy,
      select: RESERVATION_SELECT
    }),
    prisma.reservation.count({ where })
  ]);

  // Stage 5: Calculate pagination metadata
  const totalPages = Math.ceil(total / limit) || 0;

  // Stage 6: Return standardized response object
  return {
    reservations,
    pagination: {
      page,
      limit,
      totalResults: total,
      totalPages
    }
  };
};

/**
 * Service to retrieve a paginated, sorted, and filtered list of the current authenticated user's reservations.
 *
 * @param {Object} queryParams - Validated query parameters plus currentUser
 * @returns {Promise<Object>} Object containing reservations array and pagination metadata
 */
export const getCurrentUserReservations = async ({ page, limit, sortBy, sortOrder, status, bookId, currentUser }) => {
  // Stage 1: Build mandatory member scope
  const where = {
    userId: currentUser.id,
    book: {
      isDeleted: false
    }
  };

  // Stage 2: Append optional filters
  if (status) {
    where.status = status;
  }
  if (bookId) {
    where.bookId = bookId;
  }

  // Stage 3: Build orderBy
  const orderBy = [{ [sortBy]: sortOrder }];
  if (sortBy !== 'id') {
    orderBy.push({ id: 'asc' });
  }

  // Stage 4: Build pagination
  const skip = (page - 1) * limit;
  const take = limit;

  // Stage 5: Execute Prisma queries
  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy,
      select: RESERVATION_SELECT
    }),
    prisma.reservation.count({ where })
  ]);

  // Stage 6: Calculate pagination metadata
  const totalPages = Math.ceil(total / limit) || 0;

  // Stage 7: Return standardized response
  return {
    reservations,
    pagination: {
      page,
      limit,
      totalResults: total,
      totalPages
    }
  };
};

/**
 * Service to cancel a reservation.
 *
 * @param {Object} data - Input containing reservationId and currentUser
 * @returns {Promise<Object>} The cancelled reservation object
 * @throws {ApiError} 404 if not found
 * @throws {ApiError} 403 if unauthorized
 * @throws {ApiError} 400 if validation or business rules fail
 */
export const cancelReservation = async ({ reservationId, currentUser }) => {
  // Stage 1 — Retrieve Reservation
  const reservationData = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      userId: true,
      status: true,
      copyId: true,
      bookId: true
    }
  });

  if (!reservationData) {
    throw new ApiError(404, 'Reservation not found.');
  }

  // Stage 2 — Authorization
  if (currentUser.role === UserRole.MEMBER && reservationData.userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied. You can only cancel your own reservations.');
  }

  // Stage 3 — Business Rule Validation
  const allowedStatuses = [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP];
  if (!allowedStatuses.includes(reservationData.status)) {
    throw new ApiError(400, 'Reservation cannot be cancelled in its current state.');
  }

  // Stage 4 — Execute Transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Update Reservation status to CANCELLED and set cancelledAt only if in allowed statuses (OCC check)
    const updateResult = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: { in: allowedStatuses }
      },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date()
      }
    });

    if (updateResult.count === 0) {
      throw new ApiError(400, 'Reservation cannot be cancelled in its current state.');
    }

    // 2. If reservation currently holds a physical copy, validate copy status and release it
    if (reservationData.copyId) {
      const copy = await tx.bookCopy.findUnique({
        where: { id: reservationData.copyId }
      });

      if (!copy || copy.status !== CopyStatus.RESERVED) {
        throw new ApiError(400, 'Cannot release copy. Book copy is not in RESERVED status.');
      }

      await tx.bookCopy.update({
        where: { id: reservationData.copyId },
        data: {
          status: CopyStatus.AVAILABLE
        }
      });

      // 3. Try to fulfill the next pending reservation for this book
      await fulfillNextReservationForBook(reservationData.bookId, tx);
    }

    const updatedReservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      select: RESERVATION_SELECT
    });

    return updatedReservation;
  });
};

/**
 * Service to execute the reservation expiration workflow within a transaction.
 *
 * @returns {Promise<Object>} Operational summary counts
 */
export const handleExpiredReservations = async () => {
  const now = new Date();

  // Stage 1 — Locate Expired Reservations outside the transaction
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.READY_FOR_PICKUP,
      expiresAt: {
        lte: now
      }
    },
    orderBy: [
      { expiresAt: 'asc' },
      { id: 'asc' }
    ]
  });

  if (expiredReservations.length === 0) {
    return {
      processedReservations: 0,
      releasedCopies: 0,
      fulfilledReservations: 0
    };
  }

  return await prisma.$transaction(async (tx) => {
    return await processExpiredReservations(tx, expiredReservations);
  });
};

// ============================================================================
// INTERNAL PRIVATE HELPER FUNCTIONS
// ============================================================================

/**
 * Private helper to fulfill the next pending reservation for a book using an existing transaction client.
 *
 * @param {string} bookId - Book ID
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @returns {Promise<Object|null>} The fulfilled reservation, or null if no fulfillment occurred
 */
const fulfillNextReservationForBook = async (bookId, tx) => {
  // Stage 1 — Locate Available Copy
  const availableCopy = await tx.bookCopy.findFirst({
    where: {
      bookId,
      status: CopyStatus.AVAILABLE
    },
    orderBy: {
      id: 'asc'
    }
  });

  if (!availableCopy) {
    return null;
  }

  // Stage 2 — Locate Next Reservation
  const nextReservation = await tx.reservation.findFirst({
    where: {
      bookId,
      status: ReservationStatus.PENDING
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' }
    ]
  });

  if (!nextReservation) {
    return null;
  }

  // Stage 3 — Transactional Fulfillment
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_PICKUP_WINDOW_HOURS * 60 * 60 * 1000);

  // Update BookCopy status to RESERVED only if it remains AVAILABLE (OCC check)
  const copyUpdateResult = await tx.bookCopy.updateMany({
    where: { id: availableCopy.id, status: CopyStatus.AVAILABLE },
    data: { status: CopyStatus.RESERVED }
  });

  if (copyUpdateResult.count === 0) {
    return null; // Copy concurrently allocated
  }

  // Update Reservation status to READY_FOR_PICKUP only if it remains PENDING (OCC check)
  const reservationUpdateResult = await tx.reservation.updateMany({
    where: { id: nextReservation.id, status: ReservationStatus.PENDING },
    data: {
      status: ReservationStatus.READY_FOR_PICKUP,
      copyId: availableCopy.id,
      fulfilledAt: now,
      expiresAt
    }
  });

  if (reservationUpdateResult.count === 0) {
    throw new Error('Reservation was concurrently modified.'); // Rollback
  }

  const fulfilledReservation = await tx.reservation.findUnique({
    where: { id: nextReservation.id },
    select: RESERVATION_SELECT
  });

  return fulfilledReservation;
};

/**
 * Private helper to locate expired reservations and release their copies, triggering queue fulfillment.
 * Uses a provided Prisma transaction client.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Array<Object>} expiredReservations - Pre-fetched list of expired reservations
 * @returns {Promise<Object>} Operational summary counts
 */
const processExpiredReservations = async (tx, expiredReservations) => {
  let processedReservations = 0;
  let releasedCopies = 0;
  let fulfilledReservations = 0;

  // Stage 2 — Process Expired Reservations
  for (const reservation of expiredReservations) {
    if (!reservation.copyId) {
      continue;
    }

    // Stage 3 — Transactional Expiration
    // 1. Update Reservation status to EXPIRED only if it remains READY_FOR_PICKUP (OCC check)
    const updateResult = await tx.reservation.updateMany({
      where: { id: reservation.id, status: ReservationStatus.READY_FOR_PICKUP },
      data: { status: ReservationStatus.EXPIRED }
    });
    if (updateResult.count === 0) {
      continue; // Concurrently modified, skip
    }
    processedReservations++;

    // 2. Update BookCopy status to AVAILABLE only if it remains RESERVED (OCC check)
    const copyUpdateResult = await tx.bookCopy.updateMany({
      where: { id: reservation.copyId, status: CopyStatus.RESERVED },
      data: { status: CopyStatus.AVAILABLE }
    });
    if (copyUpdateResult.count > 0) {
      releasedCopies++;
    }

    // 3. Trigger FIFO queue fulfillment
    const fulfilled = await fulfillNextReservationForBook(reservation.bookId, tx);
    if (fulfilled) {
      fulfilledReservations++;
    }
  }

  // Stage 4 — Return Summary
  return {
    processedReservations,
    releasedCopies,
    fulfilledReservations
  };
};
