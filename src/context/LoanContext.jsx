import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { useBooks } from "./BooksContext.jsx";
import {
  borrowBook as apiBorrowBook,
  returnBook as apiReturnBook,
  renewLoan as apiRenewLoan,
  getActiveLoans as apiGetActiveLoans,
  getLoanHistory as apiGetLoanHistory
} from "../services/loan.service.js";
import { mapLoanToUI, mapLoansToUI } from "../mappers/loan.mapper.js";
import { normalizeError } from "../utils/error.js";

const LoanContext = createContext(undefined);

export const LoanProvider = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const { getCachedBook, optimisticEdit } = useBooks();

  const [activeLoans, setActiveLoans] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active loans from backend
  const refreshActiveLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetActiveLoans();
      setActiveLoans(mapLoansToUI(data));
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch loan history from backend
  const refreshLoanHistory = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetLoanHistory({ page, limit });
      // Backend returns pagination and loans inside data
      setLoanHistory(mapLoansToUI(data.loans));
      if (data.pagination) {
        setHistoryPagination({
          page: data.pagination.page || page,
          limit: data.pagination.limit || limit,
          totalItems: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 1,
        });
      }
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Borrow action: calls service and updates states optimistically
  const borrowBook = useCallback(async (bookCopyId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiBorrowBook(bookCopyId);
      const normalized = mapLoanToUI(data);
      if (normalized) {
        // Optimistic UI updates
        setActiveLoans((prev) => [normalized, ...prev]);

        // Decrement corresponding book's stock in BooksContext
        if (normalized.bookId) {
          const cachedBook = getCachedBook(normalized.bookId);
          if (cachedBook) {
            optimisticEdit(normalized.bookId, {
              stockQuantity: Math.max(0, cachedBook.stockQuantity - 1),
            });
          }
        }
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedBook, optimisticEdit]);

  // Return action: calls service and updates states optimistically
  const returnBook = useCallback(async (loanId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiReturnBook(loanId);
      const normalized = mapLoanToUI(data);
      if (normalized) {
        // Optimistic UI updates: Remove from activeLoans, prepend to loanHistory
        setActiveLoans((prev) => prev.filter((l) => l.id !== loanId));
        setLoanHistory((prev) => [normalized, ...prev]);

        // Increment corresponding book's stock in BooksContext
        if (normalized.bookId) {
          const cachedBook = getCachedBook(normalized.bookId);
          if (cachedBook) {
            optimisticEdit(normalized.bookId, {
              stockQuantity: cachedBook.stockQuantity + 1,
            });
          }
        }
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedBook, optimisticEdit]);

  // Renew action: calls service and updates active loan optimistically
  const renewLoan = useCallback(async (loanId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRenewLoan(loanId);
      const normalized = mapLoanToUI(data);
      if (normalized) {
        // Optimistic UI update: Replace the loan in activeLoans list
        setActiveLoans((prev) =>
          prev.map((l) => (l.id === loanId ? normalized : l))
        );
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user loans automatically when authenticated session is ready
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      refreshActiveLoans();
      refreshLoanHistory();
    } else if (!isAuthenticated && !isInitializing) {
      setActiveLoans([]);
      setLoanHistory([]);
    }
  }, [isAuthenticated, isInitializing, refreshActiveLoans, refreshLoanHistory]);

  return (
    <LoanContext.Provider
      value={{
        activeLoans,
        loanHistory,
        historyPagination,
        isLoading,
        error,
        refreshActiveLoans,
        refreshLoanHistory,
        borrowBook,
        returnBook,
        renewLoan,
      }}
    >
      {children}
    </LoanContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error("useLoans must be used within a LoanProvider");
  }
  return context;
};
