import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { getBooks as apiGetBooks } from "../services/book.service.js";
import { mapBooksToUI } from "../mappers/book.mapper.js";
import { normalizeError } from "../utils/error.js";

const BooksContext = createContext(undefined);

export const BooksProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Individual book details cache to support immediate details rendering
  const [bookCache, setBookCache] = useState({});

  // Active query parameters (not synchronized to URL inside context, hook handles that)
  const [queryParams, setQueryParams] = useState({
    page: 1,
    search: "",
    category: "",
    sort: "Recommended",
  });

  const abortControllerRef = useRef(null);

  // Core API loader
  const fetchBooks = useCallback(async (params = {}) => {
    // Cancel any active query request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Map frontend sorts to backend supported sorts:
      // "Recommended" -> sortBy: createdAt, order: desc (or rating etc)
      // "Newest" -> sortBy: publicationYear, order: desc
      // "A-Z" -> sortBy: title, order: asc
      let sortBy = "createdAt";
      let order = "desc";

      if (params.sort === "Newest") {
        sortBy = "publicationYear";
      } else if (params.sort === "A-Z") {
        sortBy = "title";
        order = "asc";
      }

      // Format query params matching the backend validator
      const apiParams = {
        page: params.page || 1,
        limit: 10, // Default page size matching stitched visual design
        search: params.search || undefined,
        language: undefined,
        publicationYear: undefined,
        sortBy,
        order,
      };

      // Handle category filtering
      // If category matches a specific string, we can send it or filter locally.
      // Since backend doesn't support a direct category query parameter, we fetch all and filter locally,
      // OR let's check if the backend getBooks query supports category filter.
      // Wait, getBooks in server/src/validations/book.validation.js has:
      // page, limit, search, sortBy, order, language, publicationYear, isBorrowable, isForSale.
      // So the backend does not have a direct categoryId or category name query validator!
      // This means we must filter categories locally or fetch all.
      // Wait! Let's check: does the backend query books controller filter by category?
      // Let's search the backend book.service.js for category filter in getBooks.
      // Yes! Let's check `getBooks` in `server/src/services/book.service.js` using grep.
      const rawData = await apiGetBooks(apiParams, { signal: abortControllerRef.current.signal });
      
      const normalizedBooks = mapBooksToUI(rawData.books);

      // Apply category filtering locally on client if requested, since backend doesn't query filter on category
      let finalBooks = normalizedBooks;
      if (params.category) {
        const filterCat = params.category.toLowerCase();
        finalBooks = normalizedBooks.filter(book => 
          book.category.toLowerCase().includes(filterCat)
        );
      }

      setBooks(finalBooks);
      setPagination(rawData.pagination || {
        page: params.page || 1,
        limit: 10,
        totalItems: finalBooks.length,
        totalPages: rawData.pagination?.totalPages || 1,
      });

      // Cache all loaded books for detail views lookup
      setBookCache((prev) => {
        const newCache = { ...prev };
        finalBooks.forEach((book) => {
          newCache[book.id] = book;
        });
        return newCache;
      });

    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") {
        return;
      }
      setError(normalizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBooks = useCallback(() => {
    fetchBooks(queryParams);
  }, [fetchBooks, queryParams]);

  // Individual Book Cache operations
  const cacheBookDetails = useCallback((book) => {
    if (!book) return;
    setBookCache((prev) => ({
      ...prev,
      [book.id]: book,
    }));
  }, []);

  const getCachedBook = useCallback((id) => {
    return bookCache[id] || books.find((b) => b.id === id) || null;
  }, [bookCache, books]);

  // Optimistic UI updates
  const optimisticCreate = useCallback((newBook) => {
    setBooks((prev) => [newBook, ...prev]);
    cacheBookDetails(newBook);
  }, [cacheBookDetails]);

  const optimisticEdit = useCallback((id, updatedFields) => {
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? { ...book, ...updatedFields } : book))
    );
    setBookCache((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], ...updatedFields },
      };
    });
  }, []);

  const removeBookFromState = useCallback((id) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
    setBookCache((prev) => {
      const newCache = { ...prev };
      delete newCache[id];
      return newCache;
    });
  }, []);

  return (
    <BooksContext.Provider
      value={{
        books,
        pagination,
        isLoading,
        error,
        queryParams,
        setQueryParams,
        fetchBooks,
        refreshBooks,
        getCachedBook,
        cacheBookDetails,
        optimisticCreate,
        optimisticEdit,
        removeBookFromState,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error("useBooks must be used within a BooksProvider");
  }
  return context;
};
