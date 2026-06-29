import { useState, useMemo } from "react";
import { booksData } from "../data/books";

export const useLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]); // Empty by default to show all books
  const [selectedSort, setSelectedSort] = useState("Recommended");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters((prev) => [...prev, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const filteredBooks = useMemo(() => {
    let result = [...booksData];

    // 1. Apply Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.category.toLowerCase().includes(query) ||
          (book.description && book.description.toLowerCase().includes(query))
      );
    }

    // 2. Apply Active Filters (OR logic for multiple categories, or match category/format)
    if (activeFilters.length > 0) {
      result = result.filter((book) => {
        return activeFilters.some((filter) => {
          const filterLower = filter.toLowerCase();
          // Match category (e.g. "Mystery", "Philosophy")
          const categoryMatch = book.category.toLowerCase().includes(filterLower);
          // Match custom tags if applicable, or fallback to author/title search
          return categoryMatch || book.title.toLowerCase().includes(filterLower);
        });
      });
    }

    // 3. Apply Sorting
    if (selectedSort === "Recommended") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "Newest") {
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (selectedSort === "A-Z") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [searchQuery, activeFilters, selectedSort]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    selectedSort,
    setSelectedSort,
    viewMode,
    setViewMode,
    filteredBooks,
  };
};
