export const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
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
  }
};
