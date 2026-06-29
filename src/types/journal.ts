export interface Reflection {
  id: string;
  title: string;
  content: string;
  bookTitle?: string;
  bookAuthor?: string;
  coverImage?: string;
  visibility: "private" | "public";
  readingTime?: string;
  date: string;
  appreciations?: number;
  saves?: number;
}
