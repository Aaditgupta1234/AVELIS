import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useBooks } from "../../context/BooksContext.jsx";
import { useLoans } from "../../context/LoanContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { getBookById } from "../../services/book.service.js";
import { mapBookToUI } from "../../mappers/book.mapper.js";
import { normalizeError } from "../../utils/error.js";
import { Navbar } from "../../components/layout/Navbar.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import { BackgroundShader } from "../../components/ui/BackgroundShader.jsx";
import { ProgressBar } from "../../components/ui/ProgressBar.jsx";
import { ArrowLeft, Star, Bookmark, ShieldAlert, Sparkles } from "lucide-react";
import { revealVariants } from "../../utils/motion.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BookDetailsPage = () => {
  const id = useParams().id;
  const navigate = useNavigate();
  const { getCachedBook, cacheBookDetails, books } = useBooks();
  const { borrowBook } = useLoans();
  const { isAuthenticated } = useAuth();

  const isValidUuid = UUID_REGEX.test(id || "");

  const [book, setBook] = useState(() => (isValidUuid ? getCachedBook(id) : null));
  const [isLoading, setIsLoading] = useState(!book && isValidUuid);
  const [error, setError] = useState(null);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [borrowError, setBorrowError] = useState("");

  const availableCopy = book?.copies?.find((copy) => copy.status === "AVAILABLE");
  const availableCopyId = availableCopy?.id;
  const hasAvailableCopy = !!availableCopyId;

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

    return () => {
      controller.abort();
    };
  }, [id, isValidUuid, cacheBookDetails]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/book/${id}` } });
      return;
    }
    if (!availableCopyId) return;

    setIsBorrowing(true);
    setBorrowError("");
    try {
      await borrowBook(availableCopyId);
      setBorrowSuccess(true);
      setTimeout(() => setBorrowSuccess(false), 3000);
    } catch (err) {
      setBorrowError(err.message || "Borrow request failed.");
      setTimeout(() => setBorrowError(""), 4000);
    } finally {
      setIsBorrowing(false);
    }
  };

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

  // 4. Successful details display (Either rendered immediately via cache or updated via API)
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F7F5EE] relative flex flex-col justify-between">
      <div className="paper-grain opacity-5 pointer-events-none"/>
      <ProgressBar />
      <BackgroundShader />
      <Navbar />

      <main className="pt-32 pb-24 relative z-10 flex-grow">
        <div className="max-w-container-max mx-auto px-6 sm:px-12">
          {/* Back Navigation Link */}
          <Link to="/library" className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-display text-[10px] tracking-[0.15em] uppercase mb-12">
            <ArrowLeft className="w-3.5 h-3.5"/>
            <span>Back to Catalog</span>
          </Link>

          {/* Details Panel layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Cover aspect */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative w-full max-w-[280px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[#C9A227]/25 bg-surface-container-lowest">
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover"/>
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
                  <div className="flex items-center gap-1.5 text-[#C9A227]">
                    <Star className="w-4 h-4 fill-[#C9A227]"/>
                    <span className="font-display text-sm font-bold">{book.rating}</span>
                  </div>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl text-[#F7F5EE] tracking-wide leading-tight">
                  {book.title}
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
                  <span className={`font-body text-xs font-semibold ${book.stockQuantity > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {book.stockQuantity > 0 ? `${book.stockQuantity} volumes in stock` : "Checked Out"}
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
                  disabled={!hasAvailableCopy || isBorrowing || borrowSuccess}
                  className={`flex items-center justify-center gap-2 px-8 py-4 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                    borrowSuccess
                      ? "bg-emerald-500 text-[#07111F] shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : borrowError
                      ? "bg-rose-500 text-[#07111F] shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : !hasAvailableCopy
                      ? "border border-white/10 text-white/30 cursor-not-allowed"
                      : "bg-[#C9A227] text-[#07111F] hover:bg-[#E5C16B] shadow-[0_10px_20px_rgba(201,162,39,0.15)] hover:shadow-[0_10px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5"
                  }`}
                >
                  {isBorrowing ? (
                    <span>Allocating...</span>
                  ) : borrowSuccess ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin"/>
                      <span>Allocated Successfully</span>
                    </>
                  ) : borrowError ? (
                    <span>{borrowError}</span>
                  ) : !hasAvailableCopy ? (
                    <span>Currently Checked Out</span>
                  ) : (
                    <span>Request Volume</span>
                  )}
                </button>
                
                <button className="flex items-center gap-2 border border-[#C9A227]/20 hover:border-[#C9A227]/60 text-[#C9A227] px-6 py-4 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-colors bg-white/3 focus:outline-none">
                  <Bookmark className="w-3.5 h-3.5"/>
                  <span>Add to Shelf</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
export default BookDetailsPage;
