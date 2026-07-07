import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { UserRole, CopyStatus, ReservationStatus, LoanStatus, CopyCondition } from '@prisma/client';

export const MAX_ACTIVE_RESERVATIONS_LIMIT = 3;
export const RESERVATION_PICKUP_WINDOW_HOURS = 48;

/**
 * Standardized Reservation API Response Selection Object.
 * Exposes only properties allowed in the public API contract.
 */
export const RESERVATION_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  fulfilledAt: true,
  cancelledAt: true,
  expiresAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true
    }
  },
  book: {
    select: {
      id: true,
      title: true,
      isbn: true
    }
  },
  bookCopy: {
    select: {
      id: true,
      barcode: true,
      shelfLocation: true,
      condition: true,
      status: true
    }
  }
};

/**
 * Reusable internal query definition for ownership-protected operations.
 * Appends the internal database userId field to RESERVATION_SELECT.
 */
const RESERVATION_SELECT_WITH_OWNER = {
  ...RESERVATION_SELECT,
  userId: true
};

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
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // 2. Only admins can reserve for other users; members only for themselves
  if (currentUser.role !== UserRole.ADMIN && userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied. You can only create reservations for yourself.');
  }

  // 3. Only members can reserve books
  if (user.role !== UserRole.MEMBER) {
    throw new ApiError(400, 'Only members can reserve books.');
  }

  // 4. Verify book exists and is eligible for reservations
  const book = await prisma.book.findUnique({
    where: { id: bookId }
  });
  if (!book) {
    throw new ApiError(404, 'Book not found.');
  }
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
      // Allocate copy immediately
      const now = new Date();
      const expiresAt = new Date(now.getTime() + RESERVATION_PICKUP_WINDOW_HOURS * 60 * 60 * 1000);

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

      // Update BookCopy status to RESERVED
      await tx.bookCopy.update({
        where: { id: availableCopy.id },
        data: { status: CopyStatus.RESERVED }
      });

      return reservation;
    } else {
      // No available copies, put in PENDING queue
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
    }
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
