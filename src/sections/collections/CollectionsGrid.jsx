import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs, staggers } from "../../utils/motion";
import { useAuth } from "../../hooks/useAuth.js";
import { useLoans } from "../../context/LoanContext.jsx";
import { useBooks } from "../../context/BooksContext.jsx";
import { BookOpen, CheckCircle2, RotateCcw } from "lucide-react";

const CollectionCard = ({ item, index, onBorrowBundle, isBorrowing }) => {
  const [isLoaded, setIsLoaded] = useState(false);

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
      className="group relative overflow-hidden border border-white/10 glass-panel h-[520px] flex flex-col transition-colors duration-700 hover:border-primary/50 bg-surface/50 rounded-lg"
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
        <div className="h-[240px] w-full overflow-hidden bg-surface-variant relative">
          <motion.img
            variants={{
              rest: { scale: 1, filter: "grayscale(100%)" },
              hover: { scale: 1.03, filter: "grayscale(0%)" },
            }}
            transition={springs.smooth}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: isLoaded ? 1 : 0 }}
            alt={item.title}
            src={item.image}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
          />
        </div>

        <div className="p-6 flex flex-col justify-between flex-grow bg-surface/80 backdrop-blur-md border-t border-white/5 group-hover:border-primary/20 transition-colors">
          <div className="space-y-1">
            <span className="font-display text-[9px] text-primary uppercase tracking-[0.2em] block">
              {item.subtitle}
            </span>
            <h3 className="font-display text-xl text-white tracking-wide">
              {item.title}
            </h3>
            <p className="font-body text-white/60 text-xs line-clamp-2">
              {item.description}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-display text-white/40 tracking-[0.1em]">
                {item.volumes || "3 Volumes Bundle"}
              </span>
              <Link
                to={`/library?search=${encodeURIComponent(item.title)}`}
                className="font-display text-primary uppercase tracking-[0.15em] border-b border-primary/30 group-hover:border-primary pb-0.5 transition-all cursor-pointer hover:text-white"
              >
                Explore Collection
              </Link>
            </div>

            <button
              onClick={() => onBorrowBundle(item)}
              disabled={isBorrowing}
              className="w-full flex items-center justify-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] disabled:opacity-50 px-4 py-2.5 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(201,162,39,0.25)] hover:shadow-[0_6px_20px_rgba(201,162,39,0.4)] cursor-pointer"
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
  const { books } = useBooks();
  const navigate = useNavigate();

  const [borrowingCard, setBorrowingCard] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const handleBorrowBundle = async (item) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/collections" } });
      return;
    }

    setBorrowingCard(item.title);
    let borrowedCount = 0;

    try {
      // Find candidate books with available physical copies matching the collection category
      const itemTitleLower = (item.title || "").toLowerCase();
      const categoryBooks = books.filter(
        (b) =>
          b.isBorrowable &&
          b.copies &&
          b.copies.some((c) => c.status === "AVAILABLE") &&
          (b.category?.toLowerCase().includes(itemTitleLower) ||
            itemTitleLower.includes(b.category?.toLowerCase()) ||
            b.title.toLowerCase().includes(itemTitleLower))
      );

      const matchingBooks =
        categoryBooks.length > 0
          ? categoryBooks
          : books.filter(
              (b) =>
                b.isBorrowable &&
                b.copies &&
                b.copies.some((c) => c.status === "AVAILABLE")
            );

      // Select up to 3 available books for the bundle
      const bundleBooks = matchingBooks.slice(0, 3);

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
                isBorrowing={borrowingCard === item.title}
              />
            ))}
          </motion.div>
        )}
      </AnimatedSection>

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

