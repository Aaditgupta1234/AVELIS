export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  year?: number;
  available?: boolean;
  description?: string;
}

export interface ContinueReadingItem {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  progress: number;
  pagesLeft: number;
}

export interface Category {
  id: string;
  title: string;
  volumesCount: number;
  image: string;
}

export interface Author {
  id: string;
  name: string;
  category: string;
  avatar: string;
}
