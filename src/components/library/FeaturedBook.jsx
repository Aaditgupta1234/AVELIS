import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useBooks } from "../../context/BooksContext";
import { featuredBook as defaultFeatured } from "../../data/featuredBook";
import { springs, revealVariants } from "../../utils/motion";

export const FeaturedBook = () => {
    const { books } = useBooks();
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    const [heroIds, setHeroIds] = useState(() => {
        try {
            const saved = localStorage.getItem("avelis_hero_book_ids");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            const single = localStorage.getItem("avelis_hero_book_id");
            return single ? [single] : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const handleHeroUpdate = () => {
            try {
                const saved = localStorage.getItem("avelis_hero_book_ids");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setHeroIds(parsed);
                        return;
                    }
                }
                const single = localStorage.getItem("avelis_hero_book_id");
                if (single) setHeroIds([single]);
            } catch {}
        };
        window.addEventListener("avelis_hero_updated", handleHeroUpdate);
        window.addEventListener("storage", handleHeroUpdate);
        return () => {
            window.removeEventListener("avelis_hero_updated", handleHeroUpdate);
            window.removeEventListener("storage", handleHeroUpdate);
        };
    }, []);

    // Filter books matching admin-selected heroIds (up to 6)
    const selectedHeroBooks = Array.isArray(heroIds) && heroIds.length > 0
        ? heroIds.map((id) => books.find((b) => b.id === id)).filter(Boolean)
        : [];

    const featuredList = selectedHeroBooks.length > 0
        ? selectedHeroBooks
        : Array.isArray(books) && books.length > 0
        ? books.slice(0, 6)
        : [defaultFeatured];

    // Ensure index stays in valid range
    const activeIndex = currentIndex % featuredList.length;
    const currentBook = featuredList[activeIndex] || defaultFeatured;

    // Auto-advance featured books every 8 seconds if multiple books exist
    useEffect(() => {
        if (featuredList.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredList.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [featuredList.length]);

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
    };

    const handleViewBook = () => {
        if (currentBook.id && !String(currentBook.id).startsWith("featured-")) {
            navigate(`/book/${currentBook.id}`);
        } else if (books && books.length > 0) {
            navigate(`/book/${books[0].id}`);
        }
    };

    const categoryText = currentBook.category || currentBook.categories?.[0]?.category?.name || "FEATURED COLLECTION";
    const authorText = currentBook.author || (currentBook.authors && currentBook.authors[0]?.author?.fullName) || "AVELIS ARCHIVE";
    const ratingValue = currentBook.rating || 4.9;
    const yearValue = currentBook.year || currentBook.publicationYear || 2026;

    return (
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={revealVariants.A}
        className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-12 md:mb-20"
      >
        <div className="relative w-full aspect-[21/9] lg:aspect-[21/7] min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] rounded-2xl overflow-hidden group shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] border border-[#C9A227]/20">
          {/* Background Image with Animation */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBook.id || activeIndex}
              alt={`${currentBook.title} cover`}
              className="absolute inset-0 w-full h-full object-cover"
              src={currentBook.coverImage || defaultFeatured.coverImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </AnimatePresence>

          {/* Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111F] via-[#07111F]/85 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-transparent to-transparent z-10" />

          {/* Content overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center py-6 md:py-8 px-6 sm:px-10 md:px-16 max-w-3xl">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="inline-block px-3 py-1 bg-[#C9A227]/20 text-[#C9A227] font-body text-[9px] tracking-[0.18em] border border-[#C9A227]/30 font-semibold uppercase rounded">
                EDITOR'S MASTERPIECE
              </span>
              <span className="text-on-surface-variant/40 text-xs">|</span>
              <span className="text-[#F7F5EE]/60 font-body text-[9px] tracking-[0.18em] uppercase font-semibold">
                {categoryText}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentBook.id || activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="space-y-2.5"
              >
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-[#F7F5EE] leading-tight tracking-tight line-clamp-2">
                  {currentBook.title}
                </h2>

                <p className="font-body text-xs sm:text-sm text-[#C9A227] italic tracking-wider">
                  by {authorText}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[#F7F5EE]/80 font-body text-xs pt-0.5">
                  <div className="flex items-center gap-1 text-[#C9A227]">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="text-xs font-semibold ml-0.5">{ratingValue}</span>
                  </div>
                  <span className="text-white/30 font-light">·</span>
                  <span>{yearValue}</span>
                  <span className="text-white/30 font-light">·</span>
                  <span className="text-emerald-400 font-semibold uppercase tracking-widest text-[9px]">
                    Available in Archive
                  </span>
                </div>

                <p className="font-body text-xs sm:text-sm text-[#F7F5EE]/75 max-w-xl leading-relaxed line-clamp-2">
                  {currentBook.description || "A masterwork of literature preserved within the AVELIS digital sanctuary for discerning readers."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4">
              <motion.button
                onClick={handleViewBook}
                whileHover={{
                  y: -2,
                  boxShadow: "0px 8px 24px -8px rgba(201, 162, 39, 0.4)",
                  filter: "brightness(1.1)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={springs.buttonClick}
                className="bg-[#C9A227] text-[#07111F] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-body text-[11px] tracking-[0.05em] hover:bg-[#E5C16B] transition-all flex items-center gap-2 shadow-lg shadow-[#C9A227]/10 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">auto_stories</span>
                View Book & Borrow
              </motion.button>

              <motion.button
                onClick={handleViewBook}
                whileHover={{
                  y: -2,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(255, 255, 255, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={springs.buttonClick}
                className="bg-white/5 backdrop-blur-md border border-white/20 text-[#F7F5EE] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-body text-[11px] tracking-[0.05em] transition-all flex items-center gap-2 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Read Book
              </motion.button>
            </div>
          </div>

          {/* Interactive Next / Previous Book Controls */}
          {featuredList.length > 1 && (
            <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3 bg-[#07111F]/80 backdrop-blur-md border border-[#C9A227]/30 rounded-xl px-4 py-2">
              <button
                onClick={handlePrev}
                className="p-1.5 text-[#F7F5EE]/70 hover:text-[#C9A227] hover:bg-white/10 rounded transition-all cursor-pointer"
                title="Previous Featured Book"
              >
                <span className="material-symbols-outlined text-lg block">chevron_left</span>
              </button>

              <span className="font-display text-[10px] tracking-[0.15em] text-[#C9A227] font-semibold min-w-[48px] text-center select-none">
                {activeIndex + 1} / {featuredList.length}
              </span>

              <button
                onClick={handleNext}
                className="p-1.5 text-[#F7F5EE]/70 hover:text-[#C9A227] hover:bg-white/10 rounded transition-all cursor-pointer"
                title="Next Featured Book"
              >
                <span className="material-symbols-outlined text-lg block">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </motion.section>
    );
};
