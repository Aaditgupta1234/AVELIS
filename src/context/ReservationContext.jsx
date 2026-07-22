import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth.js";
import {
  getMyReservations as apiGetMyReservations,
  createReservation as apiCreateReservation,
  cancelReservation as apiCancelReservation,
} from "../services/reservation.service.js";
import { mapReservationToUI, mapReservationsToUI } from "../mappers/reservation.mapper.js";
import { normalizeError } from "../utils/error.js";

const ReservationContext = createContext(undefined);

export const ReservationProvider = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current user's reservations from backend
  const refreshReservations = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetMyReservations({ page, limit });
      // Backend returns { reservations: [...], pagination: {...} }
      setReservations(mapReservationsToUI(data.reservations));
      if (data.pagination) {
        setPagination({
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

  // Create reservation action
  const createReservation = useCallback(async (bookId) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiCreateReservation(bookId);
      const normalized = mapReservationToUI(data);
      if (normalized) {
        // Optimistic UI update: prepend to current reservations
        setReservations((prev) => [normalized, ...prev.filter((r) => r.id !== normalized.id)]);
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Cancel reservation action
  const cancelReservation = useCallback(async (reservationId) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiCancelReservation(reservationId);
      const normalized = mapReservationToUI(data);
      if (normalized) {
        // Optimistic UI update: remove or update cancelled reservation status
        setReservations((prev) =>
          prev.map((r) => (r.id === reservationId ? normalized : r))
        );
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Helper check if user has an active hold for a given book
  const hasActiveReservation = useCallback(
    (bookId) => {
      if (!bookId) return false;
      return reservations.some(
        (r) =>
          r.bookId === bookId &&
          (r.status === "PENDING" || r.status === "READY_FOR_PICKUP")
      );
    },
    [reservations]
  );

  // Auto-fetch reservations when authenticated session is ready
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      refreshReservations();
    } else if (!isAuthenticated && !isInitializing) {
      setReservations([]);
    }
  }, [isAuthenticated, isInitializing, refreshReservations]);

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        pagination,
        isLoading,
        isSubmitting,
        error,
        refreshReservations,
        createReservation,
        cancelReservation,
        hasActiveReservation,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservations must be used within a ReservationProvider");
  }
  return context;
};
