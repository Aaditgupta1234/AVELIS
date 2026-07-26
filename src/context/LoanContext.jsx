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

  // Fetch active loans from backend & local synthetic bundle loans
  const refreshActiveLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetActiveLoans();
      const apiMapped = mapLoansToUI(data);

      const savedSynthetic = (() => {
        try {
          const s = localStorage.getItem("avelis_synthetic_loans");
          return s ? JSON.parse(s) : [];
        } catch { return []; }
      })();

      const combined = [...apiMapped];
      savedSynthetic.forEach((synth) => {
        if (!combined.some((l) => String(l.bookId) === String(synth.bookId) || (l.title && synth.title && l.title.toLowerCase() === synth.title.toLowerCase()))) {
          combined.push(synth);
        }
      });

      setActiveLoans(combined);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refreshActiveLoans();
    };
    window.addEventListener("avelis_loans_updated", handleUpdate);
    return () => window.removeEventListener("avelis_loans_updated", handleUpdate);
  }, [refreshActiveLoans]);

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

  // Return action: calls service and updates states optimistically
  const returnBook = useCallback(async (loanId) => {
    setIsLoading(true);
    setError(null);
    try {
      let normalized = null;
      try {
        const data = await apiReturnBook(loanId);
        normalized = mapLoanToUI(data);
      } catch (_) {}

      // Optimistic UI updates: Remove from activeLoans, prepend to loanHistory
      setActiveLoans((prev) => {
        const target = prev.find((l) => l.id === loanId);
        const next = prev.filter((l) => l.id !== loanId);
        if (target) {
          const returnedItem = normalized || {
            ...target,
            status: "RETURNED",
            returnedAt: new Date().toISOString()
          };
          setLoanHistory((hPrev) => [returnedItem, ...hPrev.filter((h) => h.id !== returnedItem.id)]);
        }
        return next;
      });

      // Cleanup localStorage synthetic records & bundle mappings
      try {
        const s = localStorage.getItem("avelis_synthetic_loans");
        if (s) {
          const synth = JSON.parse(s).filter((item) => item.id !== loanId && item.bookId !== loanId);
          localStorage.setItem("avelis_synthetic_loans", JSON.stringify(synth));
        }
        const b = localStorage.getItem("avelis_loan_bundles");
        if (b) {
          const map = JSON.parse(b);
          delete map[loanId];
          localStorage.setItem("avelis_loan_bundles", JSON.stringify(map));
        }
      } catch (_) {}

      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Renew action: calls service and updates active loan optimistically
  const renewLoan = useCallback(async (loanId) => {
    setIsLoading(true);
    setError(null);
    try {
      let normalized = null;
      try {
        const data = await apiRenewLoan(loanId);
        normalized = mapLoanToUI(data);
      } catch (_) {}

      setActiveLoans((prev) =>
        prev.map((l) => {
          if (l.id === loanId || l.bookId === loanId) {
            const nextCount = (normalized ? Number(normalized.renewCount || 0) : Number(l.renewCount || 0) + 1);
            const currentDueDate = new Date(l.dueDate || Date.now());
            currentDueDate.setDate(currentDueDate.getDate() + 14);
            const nextDueDate = normalized?.dueDate || currentDueDate.toISOString();

            return {
              ...l,
              ...(normalized || {}),
              renewCount: nextCount > 0 ? nextCount : (Number(l.renewCount || 0) + 1),
              dueDate: nextDueDate
            };
          }
          return l;
        })
      );

      // Save synthetic loan updates to localStorage if applicable
      try {
        const s = localStorage.getItem("avelis_synthetic_loans");
        if (s) {
          const synth = JSON.parse(s).map((item) => {
            if (item.id === loanId || item.bookId === loanId) {
              const currentDueDate = new Date(item.dueDate || Date.now());
              currentDueDate.setDate(currentDueDate.getDate() + 14);
              return {
                ...item,
                renewCount: Number(item.renewCount || 0) + 1,
                dueDate: currentDueDate.toISOString()
              };
            }
            return item;
          });
          localStorage.setItem("avelis_synthetic_loans", JSON.stringify(synth));
        }
      } catch (_) {}

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
