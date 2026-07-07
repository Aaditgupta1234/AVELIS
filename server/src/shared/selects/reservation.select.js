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

export const RESERVATION_SELECT_WITH_OWNER = {
  id: true,
  userId: true,
  bookId: true,
  copyId: true,
  status: true
};
