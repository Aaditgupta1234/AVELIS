import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs, staggers } from "../../utils/motion";
import { useAuth } from "../../hooks/useAuth.js";
import { useLoans } from "../../context/LoanContext.jsx";
import { useBooks } from "../../context/BooksContext.jsx";
import { BookOpen, CheckCircle2, RotateCcw, X, ExternalLink, Sparkles } from "lucide-react";

// Fallback catalog books to guarantee books are ALWAYS rendered even if context is initializing
const FALLBACK_CATALOG_BOOKS = [
  {
    id: "e1",
    title: "The Silent Archive",
    author: "Julian Vance",
    category: "Philosophy",
    sellingPrice: 24.99,
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2187&auto=format&fit=crop"
  },
  {
    id: "e2",
    title: "Mechanics of Time",
    author: "Elara Sterling",
    category: "Science",
    sellingPrice: 29.99,
    coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2187&auto=format&fit=crop"
  },
  {
    id: "e3",
    title: "Botany of Desire",
    author: "Aris Thorne",
    category: "Science",
    sellingPrice: 24.99,
    coverImage: "https://images.unsplash.com/photo-1629196914169-1c93a0bfa9b8?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "e4",
    title: "Digital Consciousness",
    author: "Alan Turing",
    category: "Technology",
    sellingPrice: 24.99,
    coverImage: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=2071&auto=format&fit=crop"
  }
];

const DEFAULT_BUNDLE_IMAGE = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop";

const CollectionCard = ({ item, index, onBorrowBundle, onExploreBundle, isBorrowing, allBooks = [] }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(item?.image || DEFAULT_BUNDLE_IMAGE);

  useEffect(() => {
    setImgSrc(item?.image || DEFAULT_BUNDLE_IMAGE);
  }, [item?.image]);

  // Combine loaded books with fallbacks so catalog is never empty
  const catalogPool = allBooks.length > 0 ? allBooks : FALLBACK_CATALOG_BOOKS;

  // Find exact books selected by Admin for this bundle
  const selectedBooks = catalogPool.filter((b) =>
    item.bookIds?.some((id) => String(id) === String(b.id))
  );

  const displayBooks = selectedBooks.length > 0 ? selectedBooks : catalogPool.slice(0, 3);

  return (
    <motion.div
      key={index}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: springs.smooth },
      }}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group relative overflow-hidden border border-white/10 glass-panel min-h-[540px] flex flex-col transition-colors duration-700 hover:border-primary/50 bg-surface/50 rounded-lg"
    >
      <motion.div
        variants={{
          rest: { y: 0, boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
          hover: {
            y: -8,
            boxShadow:
              "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)",
          },
        }}
        transition={springs.smooth}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <motion.div
        variants={{
          rest: { y: 0 },
          hover: { y: -8 },
        }}
        transition={springs.smooth}
        className="flex flex-col h-full relative z-10"
      >
        <div className="h-[220px] w-full overflow-hidden bg-surface-variant relative cursor-pointer" onClick={() => onExploreBundle(item)}>
          <motion.img
            variants={{
              rest: { scale: 1, filter: "grayscale(100%)" },
              hover: { scale: 1.03, filter: "grayscale(0%)" },
            }}
            transition={springs.smooth}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: isLoaded ? 1 : 0 }}
            alt={item.title}
            src={imgSrc}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              if (imgSrc !== DEFAULT_BUNDLE_IMAGE) {
                setImgSrc(DEFAULT_BUNDLE_IMAGE);
              }
              setIsLoaded(true);
            }}
          />
          {item.price && (
            <div className="absolute top-3 right-3 bg-[#07111F]/90 text-[#C9A227] px-3 py-1 rounded border border-[#C9A227]/30 font-display text-[10px] uppercase font-bold tracking-widest">
              ${item.price.toFixed(2)}
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col justify-between flex-grow">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-display text-[9px] tracking-[0.25em] text-[#C9A227] uppercase font-bold">
                {item.subtitle || "Curated Bundle"}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30 text-[9px] font-display uppercase tracking-wider font-bold">
                {item.category || "General"}
              </span>
            </div>

            <h3 className="font-display text-xl text-white tracking-wide cursor-pointer hover:text-primary transition-colors" onClick={() => onExploreBundle(item)}>
              {item.title}
            </h3>

            <p className="font-body text-xs text-white/60 mt-3 leading-relaxed line-clamp-2">
              {item.description}
            </p>

            {/* Display Included Books in Bundle */}
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <p className="font-display text-[9px] uppercase tracking-widest text-[#C9A227]/80">
                Included Volumes:
              </p>
              <div className="space-y-1.5">
                {displayBooks.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs text-white/80">
                    <BookOpen className="w-3 h-3 text-[#C9A227] flex-shrink-0" />
                    <span className="truncate">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3 mt-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-[10px] uppercase tracking-[0.2em] text-white/50">
                {item.volumes || `${displayBooks.length} Volumes Bundle`}
              </span>
              <button
                className="font-display text-[10px] uppercase tracking-[0.2em] text-primary hover:text-white transition-colors cursor-pointer"
                onClick={() => onExploreBundle(item)}
              >
                EXPLORE BUNDLE ↗
              </button>
            </div>

            <button
              disabled={isBorrowing}
              onClick={() => onBorrowBundle(item)}
              className="w-full flex items-center justify-center gap-2 bg-[#C9A227]/10 hover:bg-[#C9A227] border border-[#C9A227]/40 text-[#C9A227] hover:text-[#07111F] px-4 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 font-bold disabled:opacity-50 cursor-pointer"
            >
              {isBorrowing ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              <span>{isBorrowing ? "Borrowing Bundle..." : "Borrow Collection Bundle"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const CollectionsGrid = ({ collections = [], isLoading = false }) => {
  const { isAuthenticated } = useAuth();
  const { borrowBook } = useLoans();
  const { books, refreshBooks } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();

  const [borrowingCard, setBorrowingCard] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [activeExploreBundle, setActiveExploreBundle] = useState(null);

  const hasFetchedRef = useRef(false);

  // Trigger books load ONCE if empty
  useEffect(() => {
    if (!hasFetchedRef.current && (!books || books.length === 0) && refreshBooks) {
      hasFetchedRef.current = true;
      refreshBooks();
    }
  }, [books, refreshBooks]);

  // Automatically reopen bundle modal if returning from BookDetailsPage
  useEffect(() => {
    if (location.state?.openBundle) {
      setActiveExploreBundle(location.state.openBundle);
    }
  }, [location.state]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const catalogPool = books && books.length > 0 ? books : FALLBACK_CATALOG_BOOKS;

  const handleBorrowBundle = async (item) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/collections" } });
      return;
    }

    setBorrowingCard(item.title);
    let borrowedCount = 0;

    try {
      let bundleBooks = [];
      if (item.bookIds && Array.isArray(item.bookIds) && item.bookIds.length > 0) {
        bundleBooks = catalogPool.filter((b) =>
          item.bookIds.some((id) => String(id) === String(b.id))
        );
      }
      
      if (bundleBooks.length === 0) {
        const itemTitleLower = (item.title || "").toLowerCase();
        const categoryBooks = catalogPool.filter(
          (b) =>
            b.isBorrowable &&
            b.copies &&
            b.copies.some((c) => c.status === "AVAILABLE") &&
            ((b.category && b.category.toLowerCase().includes(itemTitleLower)) ||
              itemTitleLower.includes((b.category || "").toLowerCase()) ||
              b.title.toLowerCase().includes(itemTitleLower))
        );

        bundleBooks =
          categoryBooks.length > 0
            ? categoryBooks
            : catalogPool.filter(
                (b) =>
                  b.isBorrowable &&
                  b.copies &&
                  b.copies.some((c) => c.status === "AVAILABLE")
              ).slice(0, 3);
      }

      if (bundleBooks.length === 0) {
        bundleBooks = catalogPool.slice(0, 3);
      }

      for (const b of bundleBooks) {
        const availableCopy = b.copies?.find((c) => c.status === "AVAILABLE");
        if (availableCopy) {
          try {
            await borrowBook(availableCopy.id);
            borrowedCount++;
          } catch (e) {
            // Continue borrowing remaining copies in bundle
          }
        }
      }

      if (borrowedCount > 0) {
        showToast(
          `Collection Bundle (${borrowedCount} volumes) borrowed successfully!`
        );
        setTimeout(() => navigate("/dashboard"), 1400);
      } else {
        showToast(
          "No available physical copies in this collection right now."
        );
      }
    } catch (err) {
      showToast(err.message || "Failed to borrow collection bundle.");
    } finally {
      setBorrowingCard(null);
    }
  };

  // Get books present in the explored bundle with reliable fallback
  const getBundleBooks = (bundle) => {
    if (!bundle) return [];

    // 1. Match selected bookIds with string-coerced comparisons
    if (bundle.bookIds && Array.isArray(bundle.bookIds) && bundle.bookIds.length > 0) {
      const selected = catalogPool.filter((b) =>
        bundle.bookIds.some((id) => String(id) === String(b.id))
      );
      if (selected.length > 0) return selected;
    }

    // 2. Category / Title fuzzy match
    const itemTitleLower = (bundle.title || "").toLowerCase();
    const categoryBooks = catalogPool.filter(
      (b) =>
        (b.category && b.category.toLowerCase().includes(itemTitleLower)) ||
        (b.category && itemTitleLower.includes(b.category.toLowerCase())) ||
        (b.title && b.title.toLowerCase().includes(itemTitleLower))
    );

    if (categoryBooks.length > 0) return categoryBooks;

    // 3. Guaranteed Fallback: Return catalog books (up to 12) so user ALWAYS sees catalog volumes
    return catalogPool;
  };

  return (
    <>
      <AnimatedSection
        variant="A"
        className="px-gutter max-w-container-max mx-auto mb-32 min-h-[500px]"
      >
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="border border-white/10 glass-panel h-[500px] flex flex-col bg-surface-variant/20"
              >
                <div className="h-2/3 w-full bg-white/5" />
                <div className="p-8 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="h-2 w-16 bg-white/10 rounded mb-4" />
                    <div className="h-6 w-48 bg-white/10 rounded mb-4" />
                    <div className="h-3 w-full bg-white/5 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && collections.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center border border-white/5 glass-panel"
          >
            <span
              className="material-symbols-outlined text-4xl text-primary/50 mb-6"
              aria-hidden="true"
            >
              search_off
            </span>
            <h3 className="font-display text-2xl mb-4 text-white">
              No works were found within this collection.
            </h3>
            <p className="font-body text-white/60">
              Try broadening your search or explore another collection.
            </p>
          </motion.div>
        )}

        {!isLoading && collections.length > 0 && (
          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: staggers.fast } },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {collections.map((item, index) => (
              <CollectionCard
                key={index}
                item={item}
                index={index}
                onBorrowBundle={handleBorrowBundle}
                onExploreBundle={(b) => setActiveExploreBundle(b)}
                isBorrowing={borrowingCard === item.title}
                allBooks={catalogPool}
              />
            ))}
          </motion.div>
        )}
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* EXPLORE BUNDLE MODAL - DISPLAYS ALL INCLUDED BOOKS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeExploreBundle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-[#0D1626] border border-[#C9A227]/40 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveExploreBundle(null)}
                className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/80 transition-colors z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Bundle Hero Header */}
              <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-[#C9A227]/20 relative z-10">
                <img
                  src={activeExploreBundle.image}
                  alt={activeExploreBundle.title}
                  className="w-full md:w-48 h-36 md:h-48 object-cover rounded-xl border border-[#C9A227]/30 shadow-xl flex-shrink-0"
                />
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] font-display text-[10px] tracking-[0.2em] uppercase font-bold">
                      {activeExploreBundle.subtitle || "Curated Collection Bundle"}
                    </span>
                    <span className="px-3 py-1 rounded bg-[#C9A227]/25 border border-[#C9A227]/40 text-[#C9A227] font-display text-[10px] tracking-[0.2em] uppercase font-bold">
                      {activeExploreBundle.category || "General"}
                    </span>
                    {activeExploreBundle.price && (
                      <span className="font-display text-sm text-[#C9A227] font-bold">
                        ${activeExploreBundle.price.toFixed(2)} Bundle Price
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
                    {activeExploreBundle.title}
                  </h2>

                  <p className="font-body text-white/80 text-sm leading-relaxed max-w-2xl">
                    {activeExploreBundle.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[#C9A227] font-display tracking-widest uppercase font-bold pt-1">
                    <Sparkles className="w-4 h-4 text-[#C9A227]" />
                    <span>
                      {getBundleBooks(activeExploreBundle).length} Volumes Included in this Archive Boxed Set
                    </span>
                  </div>
                </div>
              </div>

              {/* Books Included Grid */}
              <div className="py-6 overflow-y-auto flex-grow space-y-4 pr-1">
                <h3 className="font-display text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C9A227]" />
                  <span>Volumes Included in Bundle</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {getBundleBooks(activeExploreBundle).map((b) => (
                    <div
                      key={b.id}
                      className="bg-[#07111F] border border-white/10 hover:border-[#C9A227]/50 rounded-xl p-4 flex gap-4 items-center transition-all duration-300 group"
                    >
                      <img
                        src={b.coverImage}
                        alt={b.title}
                        className="w-14 h-20 object-cover rounded-lg border border-white/10 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-grow min-w-0 space-y-1">
                        <h4 className="font-display text-sm text-white truncate group-hover:text-[#C9A227] transition-colors">
                          {b.title}
                        </h4>
                        <p className="text-xs text-[#F7F5EE]/60 font-body truncate">
                          {b.author}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded bg-[#C9A227]/10 text-[#C9A227] text-[9px] font-display uppercase tracking-wider">
                          {b.category || "General"}
                        </span>
                        <div className="pt-1">
                          <Link
                            to={`/book/${b.id}`}
                            state={{ fromBundle: activeExploreBundle }}
                            className="text-[10px] text-[#C9A227] hover:text-white uppercase tracking-widest font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Details</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Action Bar */}
              <div className="pt-4 border-t border-[#C9A227]/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0D1626]">
                <button
                  onClick={() => setActiveExploreBundle(null)}
                  className="text-xs text-white/60 hover:text-white uppercase font-display tracking-widest cursor-pointer"
                >
                  Close Exploration
                </button>
                <button
                  onClick={() => {
                    const bundleToBorrow = activeExploreBundle;
                    setActiveExploreBundle(null);
                    handleBorrowBundle(bundleToBorrow);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-8 py-3.5 rounded-lg font-display text-xs tracking-widest uppercase transition-all duration-300 font-bold shadow-[0_5px_20px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Borrow Complete Bundle</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-8 right-8 bg-[#0D1626] border border-[#C9A227]/40 text-[#C9A227] px-6 py-4 rounded shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 flex items-center gap-3 font-body text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-[#C9A227] flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollectionsGrid;
