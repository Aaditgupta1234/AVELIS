import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useLoans } from "../context/LoanContext.jsx";
import { useReservations } from "../context/ReservationContext.jsx";
import { useBooks } from "../context/BooksContext.jsx";
import { useReviews } from "../context/ReviewContext.jsx";
import { BookCard } from "../components/ui/BookCard.jsx";
import {
  BookMarked,
  FileText,
  Clock,
  Compass,
  LogOut,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  CornerDownLeft,
  BookOpen,
  Quote,
  Bookmark,
  XCircle
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar.jsx";
import { ProfileView } from "../components/dashboard/ProfileView.jsx";
import { SettingsView } from "../components/dashboard/SettingsView.jsx";
import { CatalogManager } from "../components/dashboard/CatalogManager.jsx";
import { BookReaderModal } from "../components/reader/BookReaderModal.jsx";
import { motion, AnimatePresence } from "framer-motion";

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { hash, pathname } = useLocation();
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("checkouts");
  const [actionLoading, setActionLoading] = useState({});
  const [readerBook, setReaderBook] = useState(null);

  const {
    activeLoans,
    loanHistory,
    isLoading: loansLoading,
    renewLoan,
    returnBook
  } = useLoans();

  const {
    reservations,
    isLoading: reservationsLoading,
    cancelReservation
  } = useReservations();

  const { books } = useBooks();
  const { userReviews } = useReviews();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Helper formats
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getDaysRemaining = (dueDateStr) => {
    const diffTime = new Date(dueDateStr) - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    return `${diffDays} days remaining`;
  };

  const calculateTimeProgress = (loan) => {
    const start = new Date(loan.borrowedAt).getTime();
    const end = new Date(loan.dueDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  // Action handlers
  const handleReturn = async (loanId) => {
    setActionLoading((prev) => ({ ...prev, [loanId]: "returning" }));
    try {
      await returnBook(loanId);
      showToast("Volume returned successfully to the Sanctuary.");
    } catch (err) {
      showToast(err.message || "Failed to return book.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [loanId]: null }));
    }
  };

  const handleRenew = async (loanId) => {
    setActionLoading((prev) => ({ ...prev, [loanId]: "renewing" }));
    try {
      await renewLoan(loanId);
      showToast("Loan period extended successfully.");
    } catch (err) {
      showToast(err.message || "Failed to renew loan.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [loanId]: null }));
    }
  };

  const handleCancelReservation = async (reservationId) => {
    setActionLoading((prev) => ({ ...prev, [reservationId]: "cancelling" }));
    try {
      await cancelReservation(reservationId);
      showToast("Hold request cancelled successfully.");
    } catch (err) {
      showToast(err.message || "Failed to cancel reservation.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [reservationId]: null }));
    }
  };

  const activeReservations = (reservations || []).filter(
    (r) => r.status === "PENDING" || r.status === "READY_FOR_PICKUP"
  );

  // Dynamic statistics counts based on actual database loans
  const stats = [
    {
      label: "Active Checkouts",
      value: loansLoading && activeLoans.length === 0 ? "..." : String(activeLoans.length),
      change: "Limit: 5 active loans",
      icon: BookMarked,
      color: "text-[#C9A227]"
    },
    {
      label: "Active Holds",
      value: reservationsLoading && reservations.length === 0 ? "..." : String(activeReservations.length),
      change: "Reservation queue",
      icon: Bookmark,
      color: "text-amber-400"
    },
    {
      label: "Borrow History",
      value: loansLoading && loanHistory.length === 0 ? "..." : String(loanHistory.length),
      change: "Total logs in archive",
      icon: FileText,
      color: "text-emerald-400"
    },
    {
      label: "Overdue Loans",
      value: loansLoading && activeLoans.length === 0 ? "..." : String(activeLoans.filter((l) => l.status === "OVERDUE").length),
      change: "Action required",
      icon: Clock,
      color: "text-rose-400"
    }
  ];

  // Most recently borrowed active checkout acts as "Currently Reading"
  const currentLoan = activeLoans.length > 0 ? activeLoans[0] : null;
  const progressPercent = currentLoan ? calculateTimeProgress(currentLoan) : 0;

  // Curated fallback recommendations
  const recommendations = [
    {
      title: "Beyond Good and Evil",
      author: "Friedrich Nietzsche",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
      category: "Philosophy",
      readingTime: "12h"
    },
    {
      title: "The Republic",
      author: "Plato",
      image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80",
      category: "Philosophy",
      readingTime: "16h"
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
      category: "Sci-Fi",
      readingTime: "22h"
    }
  ];

  const fallbackRecentlyViewed = [
    {
      title: "Letters from a Stoic",
      author: "Seneca",
      image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80"
    },
    {
      title: "Thus Spoke Zarathustra",
      author: "Friedrich Nietzsche",
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80"
    }
  ];

  // Dynamic recommendations derived from live catalog books with fallback
  const liveRecommendations =
    books && books.length > 0
      ? books.slice(0, 3).map((b) => ({
          title: b.title,
          author: b.author,
          image: b.coverImage,
          category: b.category,
          readingTime: "12h"
        }))
      : recommendations;

  // Dynamic recently visited derived from user's submitted reviews / activity with fallback
  const liveRecentlyViewed =
    userReviews && userReviews.length > 0
      ? userReviews.slice(0, 2).map((r) => ({
          title: r.bookTitle || "Archival Codex",
          author: r.author || "Archival Author",
          image: r.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80"
        }))
      : fallbackRecentlyViewed;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#07111F] text-[#F7F5EE] pt-32 pb-24 relative overflow-hidden">
        {/* Paper grain and ambient glows */}
        <div className="paper-grain opacity-5 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A227]/3 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-[#1A2E57]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 relative z-10">
          <AnimatePresence mode="wait">
            {pathname === "/dashboard/catalog" ? (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <CatalogManager />
              </motion.div>
            ) : hash === "#profile" ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <ProfileView showToast={showToast} />
              </motion.div>
            ) : hash === "#settings" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <SettingsView showToast={showToast} />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-16"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-[rgba(201,162,39,0.1)] pb-8">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#C9A227]/20 rounded-full bg-[#C9A227]/5">
                      <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-full animate-pulse"></span>
                      <span className="font-display text-[8px] tracking-[0.3em] text-[#C9A227] uppercase font-semibold">
                        THE STUDY
                      </span>
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl tracking-[0.02em] leading-tight">
                      Welcome back, <span className="italic text-[#C9A227]">{user?.name}</span>.
                    </h1>
                  </div>
                  <div className="flex gap-4">
                    {user?.role === "ADMIN" ? (
                      <Link
                        to="/dashboard/catalog"
                        className="flex items-center gap-2 border border-[#C9A227]/20 hover:border-[#C9A227]/50 text-[#C9A227] hover:text-[#F7F5EE] px-5 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all bg-[#C9A227]/5 cursor-pointer"
                      >
                        <span>Manage Catalog</span>
                      </Link>
                    ) : null}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 px-5 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all focus:outline-none focus:ring-1 focus:ring-red-500/50 bg-red-950/10 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* Hero Study Panel & Continue Reading */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Welcome Quote Panel */}
                  <div className="lg:col-span-5 bg-[#0D1626]/50 border border-[rgba(201,162,39,0.12)] rounded-lg p-8 flex flex-col justify-between min-h-[320px] shadow-[0_15px_35px_rgba(0,0,0,0.3)] relative overflow-hidden">
                    <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#C9A227]/3 rounded-full blur-2xl pointer-events-none" />
                    <Compass className="w-8 h-8 text-[#C9A227]/40" />
                    <div className="space-y-4">
                      <p className="font-display text-lg sm:text-xl italic text-[#F7F5EE]/80 leading-relaxed font-light">
                        "A sanctuary not for the collection of bindings, but for the cultivation of the mind."
                      </p>
                      <div className="w-12 h-[1px] bg-[#C9A227]/30" />
                      <p className="font-display text-[10px] tracking-[0.2em] text-[#C9A227] uppercase">
                        AVELIS ARCHIVAL CODEX
                      </p>
                    </div>
                  </div>

                  {/* Continue Reading Panel (Real Active Loan or fallback empty CTA) */}
                  <div className="lg:col-span-7 bg-[#0D1626] border border-[rgba(201,162,39,0.18)] rounded-lg p-8 flex flex-col sm:flex-row gap-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.02)] relative overflow-hidden">
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C9A227]/3 rounded-full blur-3xl pointer-events-none" />

                    {loansLoading && activeLoans.length === 0 ? (
                      /* Pulse loader for Continue Reading */
                      <div className="flex flex-col sm:flex-row w-full gap-8 animate-pulse">
                        <div className="w-full sm:w-1/3 bg-white/5 rounded h-[190px]" />
                        <div className="w-full sm:w-2/3 flex flex-col justify-between py-2 space-y-4">
                          <div className="space-y-2">
                            <div className="h-2.5 bg-white/5 rounded w-1/4" />
                            <div className="h-6 bg-white/5 rounded w-3/4" />
                            <div className="h-3.5 bg-white/5 rounded w-1/2" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-white/5 rounded w-1/3" />
                            <div className="h-1 bg-white/5 rounded w-full" />
                          </div>
                          <div className="h-9 bg-white/5 rounded w-1/2" />
                        </div>
                      </div>
                    ) : currentLoan ? (
                      <>
                        {/* Book Cover */}
                        <div className="w-full sm:w-1/3 flex-shrink-0 flex justify-center sm:justify-start">
                          <div className="relative w-[130px] h-[190px] rounded shadow-[0_15px_30px_rgba(0,0,0,0.4)] overflow-hidden border border-[#C9A227]/20">
                            <img
                              src={currentLoan.coverImage}
                              alt={currentLoan.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/50 to-transparent" />
                          </div>
                        </div>

                        {/* Book Details */}
                        <div className="w-full sm:w-2/3 flex flex-col justify-between space-y-6">
                          <div className="space-y-2">
                            <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                              Currently Borrowed
                            </span>
                            <h3 className="font-display text-2xl text-[#F7F5EE] tracking-[0.02em] line-clamp-2">
                              {currentLoan.title}
                            </h3>
                            <p className="font-body text-xs text-[#F7F5EE]/60">
                              by {currentLoan.author}
                            </p>
                          </div>

                          {/* Progress Bar (Time Remaining Progress) */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-display tracking-[0.1em] text-[#F7F5EE]/55">
                              <span>Time Expired</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  currentLoan.status === "OVERDUE" ? "bg-rose-500" : "bg-[#C9A227]"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="block text-[9px] font-body text-[#F7F5EE]/40 italic">
                              Borrowed: {formatDate(currentLoan.borrowedAt)} •{" "}
                              <span className={currentLoan.status === "OVERDUE" ? "text-rose-400 font-semibold" : ""}>
                                {getDaysRemaining(currentLoan.dueDate)}
                              </span>
                            </span>
                          </div>

                          {/* Action Triggers */}
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => setReaderBook(currentLoan)}
                              className="flex items-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-5 py-2.5 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(201,162,39,0.2)] hover:shadow-[0_6px_20px_rgba(201,162,39,0.35)] cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Read Tome</span>
                            </button>
                            <button
                              onClick={() => handleRenew(currentLoan.id)}
                              disabled={actionLoading[currentLoan.id] || currentLoan.renewCount >= 3}
                              className="flex items-center gap-2 border border-[#C9A227]/20 hover:border-[#C9A227]/50 text-[#C9A227] hover:text-[#F7F5EE] px-5 py-2.5 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all bg-[#C9A227]/5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className={`w-3 h-3 ${actionLoading[currentLoan.id] === "renewing" ? "animate-spin" : ""}`} />
                              <span>{actionLoading[currentLoan.id] === "renewing" ? "Renewing..." : `Renew (${currentLoan.renewCount}/3)`}</span>
                            </button>
                            <button
                              onClick={() => handleReturn(currentLoan.id)}
                              disabled={actionLoading[currentLoan.id]}
                              className="flex items-center gap-2 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 px-5 py-2.5 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all bg-red-950/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <CornerDownLeft className={`w-3 h-3 ${actionLoading[currentLoan.id] === "returning" ? "animate-spin" : ""}`} />
                              <span>{actionLoading[currentLoan.id] === "returning" ? "Returning..." : "Return"}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Fallback Quote or Empty CTA when user has no active loans */
                      <div className="flex flex-col justify-between w-full min-h-[190px] py-2">
                        <div className="space-y-3">
                          <BookOpen className="w-8 h-8 text-[#C9A227]/30" />
                          <h3 className="font-display text-xl text-[#F7F5EE] tracking-[0.02em]">
                            Sanctuary Catalog is Open
                          </h3>
                          <p className="font-body text-xs text-[#F7F5EE]/60 leading-relaxed max-w-md">
                            Your desk is clear. The archives hold ancient scripts, timeless philosophical codices, and modern sci-fi volumes. Select a work from our catalog to begin.
                          </p>
                        </div>

                        <Link
                          to="/library"
                          className="flex items-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-6 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_10px_20px_rgba(201,162,39,0.15)] hover:shadow-[0_10px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 cursor-pointer w-fit mt-6"
                        >
                          <span>Explore Catalog</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div
                      key={i}
                      className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 flex items-center gap-6 shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
                    >
                      <div className="w-12 h-12 rounded bg-[#C9A227]/5 border border-[#C9A227]/20 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-5 h-5 text-[#C9A227]" />
                      </div>
                      <div className="space-y-1">
                        <span className="block font-display text-[10px] tracking-[0.2em] text-[#F7F5EE]/50 uppercase">
                          {stat.label}
                        </span>
                        <div className="flex items-baseline gap-3">
                          <span className="font-display text-3xl font-semibold text-[#F7F5EE]">
                            {stat.value}
                          </span>
                          <span className="font-body text-[10px] text-emerald-400">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabbed Bento View for Checkouts and History */}
                <div className="bg-[#0D1626]/30 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                  <div className="flex border-b border-[rgba(201,162,39,0.1)] pb-4 justify-between items-center flex-wrap gap-4">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setActiveTab("checkouts")}
                        className={`font-display text-sm tracking-[0.15em] uppercase transition-colors relative pb-4 cursor-pointer focus:outline-none ${
                          activeTab === "checkouts" ? "text-[#C9A227]" : "text-[#F7F5EE]/40 hover:text-[#F7F5EE]/75"
                        }`}
                      >
                        Active Checkouts ({loansLoading && activeLoans.length === 0 ? "..." : activeLoans.length})
                        {activeTab === "checkouts" && (
                          <motion.div
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A227]"
                          />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("history")}
                        className={`font-display text-sm tracking-[0.15em] uppercase transition-colors relative pb-4 cursor-pointer focus:outline-none ${
                          activeTab === "history" ? "text-[#C9A227]" : "text-[#F7F5EE]/40 hover:text-[#F7F5EE]/75"
                        }`}
                      >
                        Borrow History ({loansLoading && loanHistory.length === 0 ? "..." : loanHistory.length})
                        {activeTab === "history" && (
                          <motion.div
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A227]"
                          />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("reservations")}
                        className={`font-display text-sm tracking-[0.15em] uppercase transition-colors relative pb-4 cursor-pointer focus:outline-none ${
                          activeTab === "reservations" ? "text-[#C9A227]" : "text-[#F7F5EE]/40 hover:text-[#F7F5EE]/75"
                        }`}
                      >
                        Active Holds ({reservationsLoading && reservations.length === 0 ? "..." : activeReservations.length})
                        {activeTab === "reservations" && (
                          <motion.div
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A227]"
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {loansLoading && activeLoans.length === 0 && loanHistory.length === 0 ? (
                    /* Skeletons loader inside bento tabs */
                    <div className="space-y-4">
                      {[1, 2].map((n) => (
                        <div
                          key={n}
                          className="bg-[#0D1626]/10 border border-white/5 rounded-lg p-4 animate-pulse flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 flex-grow">
                            <div className="w-10 h-14 bg-white/5 rounded flex-shrink-0" />
                            <div className="space-y-2 flex-grow">
                              <div className="h-4 bg-white/5 rounded w-1/3" />
                              <div className="h-3 bg-white/5 rounded w-1/4" />
                              <div className="h-2.5 bg-white/5 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="w-24 h-8 bg-white/5 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : activeTab === "checkouts" ? (
                    <div className="space-y-4">
                      {activeLoans.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[rgba(201,162,39,0.08)] rounded-lg">
                          <BookMarked className="w-8 h-8 text-[#C9A227]/30 mx-auto mb-4" />
                          <h4 className="font-display text-xs tracking-[0.15em] uppercase text-[#F7F5EE]/50 mb-1">
                            No Active Checkouts
                          </h4>
                          <p className="font-body text-[11px] text-[#F7F5EE]/30 mb-4">
                            You have no volumes currently checked out.
                          </p>
                          <Link
                            to="/library"
                            className="inline-flex items-center gap-1.5 text-[9px] font-display tracking-[0.2em] uppercase text-[#C9A227] hover:text-[#E5C16B] transition-colors"
                          >
                            <span>Browse Catalog</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {activeLoans.map((loan) => {
                            const isOverdue = loan.status === "OVERDUE";
                            const isActionPending = !!actionLoading[loan.id];
                            return (
                              <div
                                key={loan.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-[#0D1626]/20 border border-[rgba(201,162,39,0.08)] hover:border-[#C9A227]/20 hover:bg-[#0D1626]/40 transition-all duration-300"
                              >
                                <div className="flex items-center gap-4">
                                  <img
                                    src={loan.coverImage}
                                    alt={loan.title}
                                    className="w-10 h-14 object-cover rounded shadow-md border border-white/5 flex-shrink-0"
                                  />
                                  <div className="space-y-1">
                                    <h4 className="font-display text-sm text-[#F7F5EE] tracking-wide line-clamp-1">
                                      {loan.title}
                                    </h4>
                                    <p className="font-body text-[10px] text-[#F7F5EE]/50">
                                      by {loan.author}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center pt-1">
                                      <span className="font-body text-[9px] text-[#F7F5EE]/40">
                                        Issued: {formatDate(loan.borrowedAt)}
                                      </span>
                                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                                      <span
                                        className={`font-body text-[9px] font-medium ${
                                          isOverdue ? "text-rose-400" : "text-[#C9A227]"
                                        }`}
                                      >
                                        Due: {formatDate(loan.dueDate)} ({getDaysRemaining(loan.dueDate)})
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2.5 w-full sm:w-auto justify-end">
                                  <button
                                    onClick={() => setReaderBook(loan)}
                                    className="flex items-center justify-center gap-1.5 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-4 py-2 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all duration-300 shadow-[0_4px_12px_rgba(201,162,39,0.2)] cursor-pointer"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Read Book</span>
                                  </button>
                                  <button
                                    onClick={() => handleRenew(loan.id)}
                                    disabled={isActionPending || loan.renewCount >= 3}
                                    className="flex items-center justify-center gap-1.5 border border-[#C9A227]/20 hover:border-[#C9A227]/60 text-[#C9A227] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-colors bg-white/3 focus:outline-none cursor-pointer"
                                  >
                                    <RotateCcw
                                      className={`w-3 h-3 ${
                                        actionLoading[loan.id] === "renewing" ? "animate-spin" : ""
                                      }`}
                                    />
                                    <span>
                                      {actionLoading[loan.id] === "renewing"
                                        ? "Renewing..."
                                        : `Renew (${loan.renewCount}/3)`}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleReturn(loan.id)}
                                    disabled={isActionPending}
                                    className="flex items-center justify-center gap-1.5 border border-red-500/20 hover:border-red-500/50 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all bg-red-950/10 focus:outline-none cursor-pointer"
                                  >
                                    <CornerDownLeft
                                      className={`w-3 h-3 ${
                                        actionLoading[loan.id] === "returning" ? "animate-spin" : ""
                                      }`}
                                    />
                                    <span>
                                      {actionLoading[loan.id] === "returning"
                                        ? "Returning..."
                                        : "Return"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : activeTab === "history" ? (
                    <div className="space-y-4">
                      {loanHistory.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[rgba(201,162,39,0.08)] rounded-lg">
                          <FileText className="w-8 h-8 text-[#C9A227]/30 mx-auto mb-4" />
                          <h4 className="font-display text-xs tracking-[0.15em] uppercase text-[#F7F5EE]/50 mb-1">
                            No Borrow History
                          </h4>
                          <p className="font-body text-[11px] text-[#F7F5EE]/30">
                            You have no completed transactions in your archival log.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {loanHistory.map((historyItem) => (
                            <div
                              key={historyItem.id}
                              className="flex items-center justify-between gap-4 p-4 rounded bg-[#0D1626]/20 border border-[rgba(201,162,39,0.08)] hover:border-[#C9A227]/10 hover:bg-[#0D1626]/30 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <img
                                  src={historyItem.coverImage}
                                  alt={historyItem.title}
                                  className="w-10 h-14 object-cover rounded shadow-md border border-white/5 flex-shrink-0"
                                />
                                <div className="space-y-1">
                                  <h4 className="font-display text-sm text-[#F7F5EE] tracking-wide line-clamp-1">
                                    {historyItem.title}
                                  </h4>
                                  <p className="font-body text-[10px] text-[#F7F5EE]/50">
                                    by {historyItem.author}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-center pt-1 font-body text-[9px] text-[#F7F5EE]/40">
                                    <span>Borrowed: {formatDate(historyItem.borrowedAt)}</span>
                                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                                    <span>Returned: {formatDate(historyItem.returnedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-display text-[8px] tracking-[0.15em] uppercase rounded-full">
                                Returned
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeReservations.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[rgba(201,162,39,0.08)] rounded-lg">
                          <Bookmark className="w-8 h-8 text-[#C9A227]/30 mx-auto mb-4" />
                          <h4 className="font-display text-xs tracking-[0.15em] uppercase text-[#F7F5EE]/50 mb-1">
                            No Active Holds
                          </h4>
                          <p className="font-body text-[11px] text-[#F7F5EE]/30 mb-4">
                            You have no pending or ready volume reservations in the archival queue.
                          </p>
                          <Link
                            to="/library"
                            className="inline-flex items-center gap-1.5 text-[9px] font-display tracking-[0.2em] uppercase text-[#C9A227] hover:text-[#E5C16B] transition-colors"
                          >
                            <span>Browse Catalog</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {activeReservations.map((resItem) => {
                            const isReady = resItem.status === "READY_FOR_PICKUP";
                            const isActionPending = actionLoading[resItem.id] === "cancelling";
                            return (
                              <div
                                key={resItem.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-[#0D1626]/20 border border-[rgba(201,162,39,0.08)] hover:border-[#C9A227]/20 hover:bg-[#0D1626]/40 transition-all duration-300"
                              >
                                <div className="flex items-center gap-4">
                                  <img
                                    src={resItem.coverImage}
                                    alt={resItem.bookTitle}
                                    className="w-10 h-14 object-cover rounded shadow-md border border-white/5 flex-shrink-0"
                                  />
                                  <div className="space-y-1">
                                    <h4 className="font-display text-sm text-[#F7F5EE] tracking-wide line-clamp-1">
                                      {resItem.bookTitle}
                                    </h4>
                                    <p className="font-body text-[10px] text-[#F7F5EE]/50">
                                      by {resItem.author}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center pt-1 font-body text-[9px] text-[#F7F5EE]/40">
                                      <span>Requested: {formatDate(resItem.createdAt)}</span>
                                      {isReady && resItem.expiresAt && (
                                        <>
                                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                                          <span className="text-emerald-400 font-medium">
                                            Pickup Expires: {formatDate(resItem.expiresAt)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                  <span
                                    className={`px-2.5 py-1 border font-display text-[8px] tracking-[0.15em] uppercase rounded-full ${
                                      isReady
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                        : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                    }`}
                                  >
                                    {isReady ? "Ready for Pickup" : "Pending Queue"}
                                  </span>

                                  <button
                                    onClick={() => handleCancelReservation(resItem.id)}
                                    disabled={isActionPending}
                                    className="flex items-center justify-center gap-1.5 border border-rose-500/20 hover:border-rose-500/50 text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-colors bg-rose-950/10 focus:outline-none cursor-pointer"
                                  >
                                    <XCircle
                                      className={`w-3 h-3 ${isActionPending ? "animate-spin" : ""}`}
                                    />
                                    <span>{isActionPending ? "Cancelling..." : "Cancel Hold"}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Curated Recommendations */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-[rgba(201,162,39,0.1)] pb-4">
                    <h2 className="font-display text-xl tracking-[0.1em] text-[#F7F5EE] uppercase flex items-center gap-3">
                      <Compass className="w-4 h-4 text-[#C9A227]" />
                      <span>Curated for your Taste</span>
                    </h2>
                    <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                      Updated Daily
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {liveRecommendations.map((book, i) => (
                      <BookCard
                        key={i}
                        title={book.title}
                        author={book.author}
                        image={book.image}
                        category={book.category}
                        readingTime={book.readingTime}
                      />
                    ))}
                  </div>
                </div>

                {/* Recently Viewed & Journal Entry */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Recently Viewed */}
                  <div className="lg:col-span-5 space-y-6">
                    <h3 className="font-display text-sm tracking-[0.2em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
                      Recently Visited
                    </h3>
                    <div className="flex flex-col gap-4">
                      {liveRecentlyViewed.map((book, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-3 rounded bg-[#0D1626]/20 border border-transparent hover:border-[#C9A227]/20 hover:bg-[#0D1626]/40 transition-all duration-300"
                        >
                          <img
                            src={book.image}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded shadow-md border border-white/5"
                          />
                          <div className="space-y-1">
                            <h4 className="font-display text-sm text-[#F7F5EE] tracking-wide">
                              {book.title}
                            </h4>
                            <p className="font-body text-[10px] text-[#F7F5EE]/50">
                              by {book.author}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Journal Entry Preview */}
                  <div className="lg:col-span-7 bg-[#0D1626]/30 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                        Latest Reflection
                      </span>
                      <span className="font-body text-[10px] text-[#F7F5EE]/40">
                        June 28, 2026
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-display text-lg text-[#F7F5EE] tracking-wide">
                        On Seneca's "Letters from a Stoic"
                      </h4>
                      <p className="font-body text-xs text-[rgba(247,245,238,0.72)] leading-relaxed italic border-l-2 border-[#C9A227]/30 pl-4">
                        "We suffer more often in imagination than in reality."
                      </p>
                      <p className="font-body text-xs text-[rgba(247,245,238,0.6)] leading-relaxed">
                        Seneca reminds us that much of our anxiety stems from anticipating hardships that may
                        never happen. In our modern reading, this is a vital anchor. The digital world is full of
                        imaginary storms; stoicism provides the shelter.
                      </p>
                    </div>

                    <button className="flex items-center gap-1.5 text-[#C9A227] hover:text-[#E5C16B] font-display text-[9px] tracking-[0.2em] uppercase transition-colors focus:outline-none cursor-pointer">
                      <span>View Full Journal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-8 right-8 bg-[#0D1626] border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded shadow-[0_15px_40px_rgba(0,0,0,0.5)] z-50 flex items-center gap-3 font-body text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Digital Book Reader Modal */}
      <BookReaderModal
        isOpen={!!readerBook}
        onClose={() => setReaderBook(null)}
        book={readerBook}
      />
    </>
  );
};
