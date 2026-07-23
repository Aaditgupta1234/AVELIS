import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useBooks } from "../../context/BooksContext.jsx";
import { useLoans } from "../../context/LoanContext.jsx";
import { useReviews } from "../../context/ReviewContext.jsx";
import { useReservations } from "../../context/ReservationContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { getBookById } from "../../services/book.service.js";
import { mapBookToUI } from "../../mappers/book.mapper.js";
import { normalizeError } from "../../utils/error.js";
import { Navbar } from "../../components/layout/Navbar.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import { BackgroundShader } from "../../components/ui/BackgroundShader.jsx";
import { ProgressBar } from "../../components/ui/ProgressBar.jsx";
import { ArrowLeft, Star, Bookmark, BookmarkCheck, ShieldAlert, Sparkles, Send, Trash2, MessageSquare, CheckCircle2, ShoppingBag, Layers } from "lucide-react";
import { BuyBookModal } from "../../components/checkout/BuyBookModal.jsx";
import { revealVariants } from "../../utils/motion.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BookDetailsPage = () => {
  const id = useParams().id;
  const navigate = useNavigate();
  const location = useLocation();
  const fromBundle = location.state?.fromBundle;
  const { getCachedBook, cacheBookDetails, books } = useBooks();
  const { borrowBook, activeLoans } = useLoans();
  const { isAuthenticated } = useAuth();
  const {
    reviews,
    ratingStats,
    userReviews,
    isLoadingReviews,
    isLoadingStats,
    isSubmitting,
    reviewsError,
    error: reviewError,
    fetchBookReviews,
    createReview,
    deleteReview,
    hasUserReviewed,
  } = useReviews();
  const { createReservation, hasActiveReservation } = useReservations();

  const isValidUuid = UUID_REGEX.test(id || "");

  const [book, setBook] = useState(() => (isValidUuid ? getCachedBook(id) : null));
  const [isLoading, setIsLoading] = useState(!book && isValidUuid);
  const [error, setError] = useState(null);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [borrowError, setBorrowError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [reserveError, setReserveError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const isReservedByMe = hasActiveReservation(id);
  const isBorrowedByMe = activeLoans?.some(
    (loan) =>
      loan.bookId === id ||
      (loan.title && book?.title && loan.title.toLowerCase() === book.title.toLowerCase())
  );

  const availableCopiesCount = Array.isArray(book?.copies) && book.copies.length > 0
    ? book.copies.filter((copy) => copy.status === "AVAILABLE").length
    : Math.max(0, (book?.stockQuantity || 0) - (isBorrowedByMe ? 1 : 0));

  const availableCopy =
    book?.copies?.find(
      (copy) => copy.status === "AVAILABLE" || (copy.status === "RESERVED" && isReservedByMe)
    ) || book?.copies?.find((copy) => copy.status === "AVAILABLE");

  const availableCopyId = availableCopy?.id || (availableCopiesCount > 0 ? "virtual-available-copy" : null);
  const hasAvailableCopy = availableCopiesCount > 0;

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/book/${id}` } });
      return;
    }
    if (!id) return;

    setIsReserving(true);
    setReserveError("");
    try {
      await createReservation(id);
      setReserveSuccess(true);
    } catch (err) {
      setReserveError(err.message || "Failed to place reservation");
    } finally {
      setIsReserving(false);
    }
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/book/${id}` } });
      return;
    }
    if (isBorrowedByMe) {
      navigate("/dashboard");
      return;
    }
    if (!availableCopyId) return;

    setIsBorrowing(true);
    setBorrowError("");
    try {
      let targetCopyId = availableCopyId;

      // If target copy ID is missing or non-UUID (stale cache), fetch fresh details from server
      if (!UUID_REGEX.test(targetCopyId || "")) {
        const freshRaw = await getBookById(id);
        const freshMapped = mapBookToUI(freshRaw);
        setBook(freshMapped);
        cacheBookDetails(freshMapped);

        const freshCopy = freshMapped?.copies?.find((c) => c.status === "AVAILABLE");
        if (freshCopy?.id) {
          targetCopyId = freshCopy.id;
        } else {
          throw new Error("No physical copy available for borrowing.");
        }
      }

      await borrowBook(targetCopyId);
      setBorrowSuccess(true);
      if (book?.copies) {
        setBook((prev) => ({
          ...prev,
          copies: prev.copies.map((c) =>
            c.id === targetCopyId ? { ...c, status: "BORROWED" } : c
          ),
        }));
      }
    } catch (err) {
      setBorrowError(err.message || "Failed to borrow book");
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleSubmitReview = useCallback(async (e) => {
    e.preventDefault();
    if (!reviewRating) return;
    try {
      await createReview({ bookId: id, rating: reviewRating, comment: reviewComment });
      setReviewRating(0);
      setHoverRating(0);
      setReviewComment("");
    } catch {
      // Error is surfaced via reviewError from ReviewContext
    }
  }, [reviewRating, reviewComment, createReview, id]);

  const handleDeleteReview = useCallback(async (reviewId) => {
    try {
      await deleteReview(reviewId, id);
    } catch {
      // Error is surfaced via reviewError from ReviewContext
    }
  }, [deleteReview, id]);

  // If the book is deleted from the catalog context, redirect to library
  useEffect(() => {
    if (isValidUuid && books.length > 0) {
      const isStillAvailable = books.some((b) => b.id === id);
      if (!isStillAvailable) {
        navigate("/library", { replace: true });
      }
    }
  }, [books, id, isValidUuid, navigate]);

  useEffect(() => {
    if (!isValidUuid) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        const rawBook = await getBookById(id, { signal: controller.signal });
        const mapped = mapBookToUI(rawBook);
        setBook(mapped);
        cacheBookDetails(mapped);
        setError(null);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        setError(normalizeError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
    fetchBookReviews(id, controller.signal);

    return () => {
      controller.abort();
    };
  }, [id, isValidUuid, cacheBookDetails, fetchBookReviews]);

  // 1. Invalid UUID or 404 Not Found Page Layout
  if (!isValidUuid || error?.status === 404) {
    return (
      <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col justify-between">
        <div className="paper-grain opacity-5 pointer-events-none"/>
        <BackgroundShader />
        <Navbar />
        <main className="pt-40 pb-24 relative z-10 flex-grow flex items-center justify-center">
          <motion.div initial="hidden" animate="visible" variants={revealVariants.A} className="max-w-md text-center p-8 bg-[#0D1626]/40 border border-red-500/20 rounded-2xl shadow-2xl backdrop-blur-md">
            <ShieldAlert className="w-12 h-12 text-[#C9A227] mx-auto mb-6 animate-pulse"/>
            <h1 className="font-display text-2xl text-primary tracking-wider uppercase mb-4">
              Book Not Found
            </h1>
            <p className="font-body text-sm text-on-surface-variant/60 leading-relaxed mb-8">
              The archival codex identifier is either malformed or does not exist in the digital repository.
            </p>
            <Link to="/library" className="inline-flex items-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-6 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-md">
              <ArrowLeft className="w-3.5 h-3.5"/>
              <span>Return to Sanctuary</span>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Fetch Loading Page Layout (Non-cached entry)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col justify-between">
        <div className="paper-grain opacity-5 pointer-events-none"/>
        <BackgroundShader />
        <Navbar />
        <main className="pt-40 pb-24 relative z-10 flex-grow flex flex-col items-center justify-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#C9A227]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-display text-[9px] tracking-[0.3em] text-[#C9A227] uppercase animate-pulse">
            Consulting Archives
          </span>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Connection Failures Layout
  if (error) {
    return (
      <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col justify-between">
        <div className="paper-grain opacity-5 pointer-events-none"/>
        <BackgroundShader />
        <Navbar />
        <main className="pt-40 pb-24 relative z-10 flex-grow flex items-center justify-center">
          <div className="max-w-md text-center p-8 bg-red-950/20 border border-red-500/20 rounded-2xl shadow-xl">
            <span className="material-symbols-outlined text-4xl text-red-400/60 mb-4">sync_problem</span>
            <h2 className="font-display text-lg text-red-300 uppercase mb-2">Sync Failure</h2>
            <p className="font-body text-xs text-red-400/70 leading-relaxed mb-6">{error.message}</p>
            <button onClick={() => window.location.reload()} className="text-[10px] tracking-[0.15em] text-primary border border-primary/30 px-5 py-2.5 hover:bg-primary/10 rounded-lg uppercase font-semibold">
              Retry Sync
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Missing Book Guard Layout
  if (!book) {
    return (
      <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col justify-between">
        <div className="paper-grain opacity-5 pointer-events-none"/>
        <BackgroundShader />
        <Navbar />
        <main className="pt-40 pb-24 relative z-10 flex-grow flex items-center justify-center">
          <div className="max-w-md text-center p-8 bg-[#0D1626]/40 border border-[#C9A227]/20 rounded-2xl shadow-2xl backdrop-blur-md">
            <ShieldAlert className="w-12 h-12 text-[#C9A227] mx-auto mb-6 animate-pulse"/>
            <h1 className="font-display text-2xl text-primary tracking-wider uppercase mb-4">
              Book Not Found
            </h1>
            <p className="font-body text-sm text-on-surface-variant/60 leading-relaxed mb-8">
              The requested volume is currently unavailable in the library archives.
            </p>
            <Link to="/library" className="inline-flex items-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-6 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-md">
              <ArrowLeft className="w-3.5 h-3.5"/>
              <span>Return to Library</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 5. Successful details display (Either rendered immediately via cache or updated via API)
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F7F5EE] relative flex flex-col justify-between">
      <div className="paper-grain opacity-5 pointer-events-none"/>
      <ProgressBar />
      <BackgroundShader />
      <Navbar />

      <main className="pt-32 pb-24 relative z-10 flex-grow">
        <div className="max-w-container-max mx-auto px-6 sm:px-12">
          {/* Back Navigation Link */}
          {fromBundle ? (
            <button
              onClick={() => navigate("/collections", { state: { openBundle: fromBundle } })}
              className="inline-flex items-center gap-2 bg-[#C9A227]/15 hover:bg-[#C9A227]/30 text-[#C9A227] border border-[#C9A227]/40 px-4 py-2 rounded-lg font-display text-[10px] tracking-[0.15em] uppercase font-bold transition-all shadow-[0_4px_15px_rgba(201,162,39,0.2)] hover:-translate-y-0.5 cursor-pointer mb-12"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Bundle: {fromBundle.title}</span>
            </button>
          ) : (
            <Link to="/library" className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-display text-[10px] tracking-[0.15em] uppercase mb-12">
              <ArrowLeft className="w-3.5 h-3.5"/>
              <span>Back to Catalog</span>
            </Link>
          )}

          {/* Details Panel layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Cover aspect */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative w-full max-w-[280px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[#C9A227]/25 bg-surface-container-lowest">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/60 to-transparent"/>
              </motion.div>
            </div>

            {/* Right Information panel */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="px-3 py-1 border border-[#C9A227]/20 rounded-full bg-[#C9A227]/5 font-display text-[8px] tracking-[0.2em] text-[#C9A227] uppercase">
                    {book.category}
                  </span>
                  {ratingStats?.averageRating != null ? (
                    <div className="flex items-center gap-1.5 text-[#C9A227]">
                      <Star className="w-4 h-4 fill-[#C9A227]"/>
                      <span className="font-display text-sm font-bold">{Number(ratingStats.averageRating).toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="font-display text-sm font-bold text-[#F7F5EE]/40">—</span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-5xl text-[#F7F5EE] tracking-wide leading-tight">
                  {book.title || "Archival Volume"}
                </h1>
                
                <p className="font-body text-sm sm:text-base text-primary italic">
                  by {book.author}
                </p>

                <p className="font-body text-sm text-[#F7F5EE]/75 leading-relaxed pt-2">
                  {book.description || "No description is currently archived for this work. This volume represents a rare addition to the AVELIS digital archives."}
                </p>
              </div>

              {/* Archival metadata details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-[rgba(201,162,39,0.12)]">
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">ISBN</span>
                  <span className="font-body text-xs font-semibold">{book.isbn}</span>
                </div>
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">Publisher</span>
                  <span className="font-body text-xs font-semibold">{book.publisher}</span>
                </div>
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">Publication Year</span>
                  <span className="font-body text-xs font-semibold">{book.publicationYear || "Archival"}</span>
                </div>
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">Language</span>
                  <span className="font-body text-xs font-semibold">{book.language}</span>
                </div>
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">Availability</span>
                  <span className={`font-body text-xs font-semibold ${availableCopiesCount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {availableCopiesCount > 0 ? `${availableCopiesCount} copies available` : "Out of Stock"}
                  </span>
                </div>
                <div>
                  <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/45 uppercase mb-1">Privilege tier</span>
                  <span className="font-body text-xs font-semibold">Standard Member</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-6">
                <button
                  onClick={handleBorrow}
                  disabled={(!hasAvailableCopy && !isBorrowedByMe) || isBorrowing}
                  className={`flex items-center justify-center gap-2 px-8 py-4 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                    isBorrowedByMe || borrowSuccess
                      ? "bg-emerald-500 text-[#07111F] shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:bg-emerald-400"
                      : borrowError
                      ? "bg-rose-500 text-[#07111F] shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : !hasAvailableCopy
                      ? "border border-white/10 text-white/30 cursor-not-allowed"
                      : "bg-[#C9A227] text-[#07111F] hover:bg-[#E5C16B] shadow-[0_10px_20px_rgba(201,162,39,0.15)] hover:shadow-[0_10px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5"
                  }`}
                >
                  {isBorrowing ? (
                    <span>Allocating...</span>
                  ) : isBorrowedByMe || borrowSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#07111F]" />
                      <span>Borrowed</span>
                    </>
                  ) : borrowError ? (
                    <span>{borrowError}</span>
                  ) : !hasAvailableCopy ? (
                    <span>Out of Stock</span>
                  ) : (
                    <span>Borrow</span>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login", { state: { from: `/book/${id}` } });
                      return;
                    }
                    setIsBuyModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 border border-[#C9A227]/40 hover:border-[#C9A227] text-[#C9A227] hover:text-[#F7F5EE] bg-[#C9A227]/10 hover:bg-[#C9A227]/20 px-8 py-4 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shadow-[0_4px_15px_rgba(201,162,39,0.15)]"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C9A227]" />
                  <span>BUY NOW (${Number(book?.sellingPrice || 24.99).toFixed(2)})</span>
                </button>

                <button
                  onClick={() => navigate("/journal", { state: { prefilledBookTitle: book.title } })}
                  className="flex items-center justify-center gap-2 border border-white/20 hover:border-[#C9A227] text-white/80 hover:text-white bg-white/5 hover:bg-[#C9A227]/10 px-6 py-4 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#C9A227]" />
                  <span>Write Reflection</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Reviews & Ratings Section ─────────────────────────────── */}
          <div className="mt-20 border-t border-[rgba(201,162,39,0.12)] pt-12">
            <h2 className="font-display text-xl tracking-[0.12em] text-[#F7F5EE] uppercase mb-10">
              Reader Reviews
            </h2>

            {/* Rating Statistics Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 p-6 bg-[#0D1626]/40 border border-[#C9A227]/10 rounded-2xl backdrop-blur-sm">
              {isLoadingStats ? (
                <div className="flex items-center gap-6 animate-pulse">
                  <div className="w-20 h-20 bg-[#C9A227]/10 rounded-xl" />
                  <div className="space-y-3">
                    <div className="h-4 w-28 bg-[#C9A227]/10 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    {ratingStats.averageRating != null ? (
                      <>
                        <div className="font-display text-5xl font-bold text-[#C9A227] leading-none">
                          {Number(ratingStats.averageRating).toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Math.round(ratingStats.averageRating)
                                  ? "fill-[#C9A227] text-[#C9A227]"
                                  : "text-[#C9A227]/20"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="font-display text-5xl font-bold text-[#F7F5EE]/25 leading-none">—</div>
                    )}
                    <p className="font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/40 uppercase mt-3">
                      {ratingStats.totalReviews}{" "}
                      {ratingStats.totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
              )}

              {/* Distribution bars */}
              {!isLoadingStats && (
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingStats.ratingDistribution?.[String(star)] || 0;
                    const pct =
                      ratingStats.totalReviews > 0
                        ? (count / ratingStats.totalReviews) * 100
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="font-display text-[10px] text-[#F7F5EE]/40 w-2.5 flex-shrink-0">
                          {star}
                        </span>
                        <Star className="w-2.5 h-2.5 fill-[#C9A227]/50 text-[#C9A227]/50 flex-shrink-0" />
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9A227] rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-display text-[9px] text-[#F7F5EE]/30 w-5 text-right flex-shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Review Form / Already-Reviewed Notice / Guest CTA */}
            {isAuthenticated ? (
              hasUserReviewed(id) ? (
                <div className="mb-10 p-5 border border-[#C9A227]/15 bg-[#C9A227]/5 rounded-xl flex items-center gap-3">
                  <Star className="w-4 h-4 fill-[#C9A227] text-[#C9A227] flex-shrink-0" />
                  <p className="font-body text-sm text-[#F7F5EE]/60">
                    You have already submitted a review for this volume.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitReview}
                  className="mb-12 p-6 bg-[#0D1626]/40 border border-[#C9A227]/10 rounded-2xl backdrop-blur-sm space-y-5"
                >
                  <h3 className="font-display text-sm tracking-[0.15em] text-[#F7F5EE]/70 uppercase">
                    Leave a Review
                  </h3>

                  {/* Interactive star selector */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors duration-150 ${
                            star <= (hoverRating || reviewRating)
                              ? "fill-[#C9A227] text-[#C9A227]"
                              : "text-[#F7F5EE]/15"
                          }`}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-1 font-display text-[10px] tracking-[0.15em] text-[#C9A227]/70 uppercase">
                        {["Unrated", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                      </span>
                    )}
                  </div>

                  {/* Comment textarea */}
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts on this volume..."
                    rows={4}
                    className="w-full bg-white/3 border border-[#C9A227]/10 focus:border-[#C9A227]/30 rounded-xl px-4 py-3 font-body text-sm text-[#F7F5EE]/80 placeholder:text-[#F7F5EE]/25 resize-none outline-none transition-colors"
                  />

                  {/* Inline error */}
                  {reviewError && (
                    <p className="font-body text-xs text-rose-400/80">{reviewError.message}</p>
                  )}

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!reviewRating || isSubmitting}
                      className={`flex items-center gap-2 px-6 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
                        !reviewRating || isSubmitting
                          ? "border border-white/10 text-white/30 cursor-not-allowed"
                          : "bg-[#C9A227] text-[#07111F] hover:bg-[#E5C16B] shadow-[0_6px_20px_rgba(201,162,39,0.15)] hover:-translate-y-0.5"
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="mb-12 p-6 border border-[#C9A227]/10 bg-[#0D1626]/20 rounded-2xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <MessageSquare className="w-8 h-8 text-[#C9A227]/30 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-display text-sm tracking-wide text-[#F7F5EE]/60 mb-1">
                    Sign in to leave a review
                  </p>
                  <p className="font-body text-xs text-[#F7F5EE]/30">
                    Share your thoughts with the AVELIS community.
                  </p>
                </div>
                <Link
                  to="/login"
                  state={{ from: `/book/${id}` }}
                  className="flex-shrink-0 px-5 py-2.5 bg-[#C9A227] text-[#07111F] rounded font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#E5C16B] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-5 border border-white/5 rounded-xl animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5" />
                      <div className="h-3 w-28 bg-white/5 rounded" />
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : reviewsError ? (
              <div className="p-5 border border-red-500/20 bg-red-950/10 rounded-xl text-center">
                <p className="font-body text-xs text-red-400/70">{reviewsError.message}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center border border-white/5 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-[#C9A227]/20 mx-auto mb-4" />
                <p className="font-display text-sm tracking-[0.15em] text-[#F7F5EE]/30 uppercase">
                  No Reviews Yet
                </p>
                <p className="font-body text-xs text-[#F7F5EE]/20 mt-2">
                  Be the first to chronicle your thoughts on this volume.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 border border-white/5 bg-[#0D1626]/30 rounded-xl space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Reviewer identity */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-[10px] text-[#C9A227] uppercase">
                            {review.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-display text-xs tracking-wide text-[#F7F5EE]/80">
                            {review.username}
                          </p>
                          <p className="font-body text-[10px] text-[#F7F5EE]/30">
                            {new Date(review.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Star row + optional delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= review.rating
                                  ? "fill-[#C9A227] text-[#C9A227]"
                                  : "text-[#C9A227]/15"
                              }`}
                            />
                          ))}
                        </div>
                        {userReviews.some((ur) => ur.id === review.id) && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={isSubmitting}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-red-500/10 text-[#F7F5EE]/30 hover:text-rose-400 disabled:cursor-not-allowed"
                            aria-label="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="font-body text-sm text-[#F7F5EE]/60 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Physical Copy Checkout & Buy Modal */}
      <BuyBookModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        book={book}
      />
    </div>
  );
};
export default BookDetailsPage;
