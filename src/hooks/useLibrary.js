import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBooks } from "../context/BooksContext.jsx";

/**
 * Hook to manage library catalogs state with URL synchronization.
 */
export const useLibrary = () => {
  const {
    books,
    pagination,
    isLoading,
    error,
    fetchBooks,
    setQueryParams,
  } = useBooks();

  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid"); // Local UI state only

  // Extract variables from URL query parameters (Single source of truth)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const search = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const activeFilters = categoryParam ? categoryParam.split(",") : [];
  const selectedSort = searchParams.get("sort") || "Recommended";

  // Synchronize URL changes with context and trigger background API fetch
  useEffect(() => {
    const nextParams = {
      page,
      search,
      category: categoryParam,
      sort: selectedSort,
    };
    
    setQueryParams(nextParams);
    fetchBooks(nextParams);
  }, [page, search, categoryParam, selectedSort, fetchBooks, setQueryParams]);

  // Helper to serialize parameters to search URL
  const updateParams = (newParams) => {
    const current = {};
    if (newParams.page && newParams.page > 1) {
      current.page = String(newParams.page);
    }
    if (newParams.search) {
      current.search = newParams.search;
    }
    if (newParams.category) {
      current.category = newParams.category;
    }
    if (newParams.sort && newParams.sort !== "Recommended") {
      current.sort = newParams.sort;
    }
    setSearchParams(current);
  };

  const setSearchQuery = (q) => {
    updateParams({ page: 1, search: q, category: categoryParam, sort: selectedSort });
  };

  const addFilter = (filter) => {
    const updated = activeFilters.includes(filter)
      ? activeFilters
      : [...activeFilters, filter];
    updateParams({ page: 1, search, category: updated.join(","), sort: selectedSort });
  };

  const removeFilter = (filter) => {
    const updated = activeFilters.filter((f) => f !== filter);
    updateParams({ page: 1, search, category: updated.join(","), sort: selectedSort });
  };

  const clearAllFilters = () => {
    updateParams({ page: 1, search, category: "", sort: selectedSort });
  };

  const setSelectedSort = (sort) => {
    updateParams({ page: 1, search, category: categoryParam, sort });
  };

  const setPage = (newPage) => {
    updateParams({ page: newPage, search, category: categoryParam, sort: selectedSort });
  };

  return {
    searchQuery: search,
    setSearchQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    selectedSort,
    setSelectedSort,
    viewMode,
    setViewMode,
    filteredBooks: books,
    pagination,
    isLoading,
    error,
    setPage,
  };
};
