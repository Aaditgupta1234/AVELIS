import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { useBooks } from "./BooksContext.jsx";
import {
  getBookReviews as apiGetBookReviews,
  getBookRating as apiGetBookRating,
  createReview as apiCreateReview,
  deleteReview as apiDeleteReview,
  getUserReviews as apiGetUserReviews
} from "../services/review.service.js";
import { mapReviewToUI, mapReviewsToUI } from "../mappers/review.mapper.js";
import { normalizeError } from "../utils/error.js";

const ReviewContext = createContext(undefined);

export const ReviewProvider = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const { optimisticEdit } = useBooks();

  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({
    averageRating: null,
    totalReviews: 0,
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  });
  const [userReviews, setUserReviews] = useState([]);

  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviewsError, setReviewsError] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [error, setError] = useState(null);

  // Fetch authenticated user's own reviews
  const refreshUserReviews = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiGetUserReviews();
      setUserReviews(mapReviewsToUI(data));
    } catch (err) {
      console.error("Failed to load user reviews:", err);
    }
  }, [isAuthenticated]);

  // Extracted handlers for improved code readability and stale closure prevention
  const handleStatsResult = useCallback((result) => {
    if (result.status === 'fulfilled' && result.value) {
      setRatingStats(result.value);
    } else if (result.status === 'rejected') {
      setStatsError(normalizeError(result.reason));
    }
    setIsLoadingStats(false);
  }, []);

  const handleReviewsResult = useCallback((result, isAuth) => {
    if (!isAuth) {
      setReviews([]);
    } else if (result.status === 'fulfilled' && result.value) {
      setReviews(mapReviewsToUI(result.value));
    } else if (result.status === 'rejected') {
      setReviewsError(normalizeError(result.reason));
    }
    setIsLoadingReviews(false);
  }, []);

  // Main loader for book reviews & rating stats
  const fetchBookReviews = useCallback(async (bookId, signal) => {
    setIsLoadingReviews(true);
    setIsLoadingStats(true);
    setReviewsError(null);
    setStatsError(null);

    const options = signal ? { signal } : {};

    const requests = isAuthenticated
      ? [apiGetBookReviews(bookId, options), apiGetBookRating(bookId, options)]
      : [Promise.resolve(null),             apiGetBookRating(bookId, options)];

    const [reviewsResult, statsResult] = await Promise.allSettled(requests);

    handleStatsResult(statsResult);
    handleReviewsResult(reviewsResult, isAuthenticated);
  }, [isAuthenticated, handleStatsResult, handleReviewsResult]);

  // Create review action
  const createReview = useCallback(async (reviewData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiCreateReview(reviewData);
      const normalized = mapReviewToUI(data);

      if (normalized) {
        // Prepend to current book reviews list
        setReviews((prev) => [normalized, ...prev]);
        // Prepend to user's own reviews list
        setUserReviews((prev) => [normalized, ...prev]);

        // Re-fetch latest public rating stats to match backend rules
        const newStats = await apiGetBookRating(reviewData.bookId);
        setRatingStats(newStats);

        // Update book cache in BooksContext scoped strictly to the rating field
        optimisticEdit(reviewData.bookId, {
          rating: newStats.averageRating
        });
      }
      return normalized;
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsSubmitting(false);
    }
  }, [optimisticEdit]);

  // Delete review action
  const deleteReview = useCallback(async (reviewId, bookId) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiDeleteReview(reviewId);

      // Remove from current book reviews list
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      // Remove from user's own reviews list
      setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));

      // Re-fetch latest public rating stats
      const newStats = await apiGetBookRating(bookId);
      setRatingStats(newStats);

      // Update book cache in BooksContext scoped strictly to the rating field
      optimisticEdit(bookId, {
        rating: newStats.averageRating
      });
    } catch (err) {
      const normErr = normalizeError(err);
      setError(normErr);
      throw normErr;
    } finally {
      setIsSubmitting(false);
    }
  }, [optimisticEdit]);

  // Derived helper to check if a user has reviewed a specific book
  const hasUserReviewed = useCallback((bookId) => {
    return userReviews.some((r) => r.bookId === bookId);
  }, [userReviews]);

  // Manage user reviews cache on auth lifecycle changes
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      refreshUserReviews();
    } else if (!isAuthenticated && !isInitializing) {
      setReviews([]);
      setRatingStats({
        averageRating: null,
        totalReviews: 0,
        ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
      });
      setUserReviews([]);
      setReviewsError(null);
      setStatsError(null);
      setError(null);
    }
  }, [isAuthenticated, isInitializing, refreshUserReviews]);

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        ratingStats,
        userReviews,
        isLoadingReviews,
        isLoadingStats,
        isSubmitting,
        reviewsError,
        statsError,
        error,
        fetchBookReviews,
        createReview,
        deleteReview,
        hasUserReviewed,
        refreshUserReviews
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviews must be used within a ReviewProvider");
  }
  return context;
};
