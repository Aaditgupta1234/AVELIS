export const BOOK_SELECT = {
  id: true,
  title: true,
  isbn: true,
  publisher: true,
  publicationYear: true,
  language: true,
  description: true,
  coverImage: true,
  sellingPrice: true,
  stockQuantity: true,
  isBorrowable: true,
  isForSale: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
};

export const BOOK_PUBLIC_INCLUDE = {
  authors: {
    select: {
      author: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  },
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
};
