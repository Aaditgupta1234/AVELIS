import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// ─── Eager imports (must be available on first paint) ────────────────────────
// LandingPage is the primary entry point — lazy-loading it would cause a blank
// screen flash while its chunk fetches, hurting FCP. It stays synchronous.
import { LandingPage } from "./pages/LandingPage";
import { PageWrapper } from "./components/ui/PageWrapper";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { BooksProvider } from "./context/BooksContext";
import { LoanProvider } from "./context/LoanContext.jsx";
import { ReservationProvider } from "./context/ReservationContext.jsx";
import { ReviewProvider } from "./context/ReviewContext.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute";

// ─── Lazy page chunks ────────────────────────────────────────────────────────
// Each page is split into its own JS chunk and downloaded only when its route
// is first visited. The .then() re-maps named exports to the default slot that
// React.lazy() requires (pages use named exports, not default exports).
const CollectionsPage    = lazy(() => import("./pages/CollectionsPage").then(m => ({ default: m.CollectionsPage })));
const LibraryPage        = lazy(() => import("./pages/Library/LibraryPage").then(m => ({ default: m.LibraryPage })));
const BookDetailsPage    = lazy(() => import("./pages/Library/BookDetailsPage").then(m => ({ default: m.BookDetailsPage })));
const ReadingJournalPage = lazy(() => import("./pages/ReadingJournal/ReadingJournalPage").then(m => ({ default: m.ReadingJournalPage })));
const LoginPage          = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const AuthCallbackPage   = lazy(() => import("./pages/AuthCallbackPage").then(m => ({ default: m.AuthCallbackPage })));
const DashboardPage      = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));

// ─── Route-level loading fallback ────────────────────────────────────────────
// Shown while a lazy page chunk is downloading. Reuses the exact same markup
// and classes already used in ProtectedRoute.jsx — no new design language.
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center">
    <svg
      className="animate-spin h-8 w-8 text-[#C9A227]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span className="font-display text-[10px] tracking-[0.3em] text-[#C9A227] uppercase animate-pulse mt-4">
      Entering Sanctuary
    </span>
  </div>
);

// ─── Animated route tree ─────────────────────────────────────────────────────
// PER-ROUTE Suspense boundaries: each lazy route manages its own loading state.
// This means an already-rendered page (e.g. Dashboard) never stalls waiting for
// a sibling chunk (e.g. CatalogManager). The dashboard renders fully first;
// CatalogManager shows its own inline spinner inside the live dashboard layout.
//
// Suspense sits INSIDE AnimatePresence — so route-exit animations complete
// before the next route's Suspense boundary activates.
//
// ProtectedRoute wraps Suspense on authenticated routes so that DashboardPage's
// chunk is only fetched AFTER auth is confirmed — unauthenticated users never
// download the dashboard bundle.
const AnimatedRoutes = () => {
    const location = useLocation();
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Public routes ────────────────────────────────────────────── */}

          {/* LandingPage: eager — no Suspense, no chunk delay */}
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />

          <Route path="/collections" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><CollectionsPage /></PageWrapper>
            </Suspense>
          } />

          <Route path="/library" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><LibraryPage /></PageWrapper>
            </Suspense>
          } />

          <Route path="/book/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><BookDetailsPage /></PageWrapper>
            </Suspense>
          } />

          <Route path="/journal" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><ReadingJournalPage /></PageWrapper>
            </Suspense>
          } />

          <Route path="/login" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><LoginPage /></PageWrapper>
            </Suspense>
          } />

          <Route path="/auth/callback" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PageWrapper><AuthCallbackPage /></PageWrapper>
            </Suspense>
          } />

          {/* ── Protected routes ─────────────────────────────────────────── */}

          {/* ProtectedRoute checks auth first. Suspense is inside it so the   */}
          {/* DashboardPage chunk is only fetched for authenticated users.      */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoadingFallback />}>
                <PageWrapper><DashboardPage /></PageWrapper>
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/catalog" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Suspense fallback={<PageLoadingFallback />}>
                <PageWrapper><DashboardPage /></PageWrapper>
              </Suspense>
            </ProtectedRoute>
          } />

          {/* ── Alias routes ─────────────────────────────────────────────── */}
          {/* Reuse the already-eager LandingPage — no extra chunk needed.   */}
          <Route path="/authors" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/about"   element={<PageWrapper><LandingPage /></PageWrapper>} />

        </Routes>
      </AnimatePresence>
    );
};

// ─── Root app ─────────────────────────────────────────────────────────────────
function App() {
    return (
      <AuthProvider>
        <BooksProvider>
          <LoanProvider>
            <ReservationProvider>
              <ReviewProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <AnimatedRoutes />
                </BrowserRouter>
              </ReviewProvider>
            </ReservationProvider>
          </LoanProvider>
        </BooksProvider>
      </AuthProvider>
    );
}
export default App;
