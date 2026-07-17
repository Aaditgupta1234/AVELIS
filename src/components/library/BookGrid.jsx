import { motion } from "framer-motion";
import { BookCard } from "./BookCard.jsx";
import { revealVariants, staggers } from "../../utils/motion.js";

const BookSkeleton = () => (
  <div className="border border-outline-variant/10 rounded-xl bg-surface-container-lowest/10 p-4 animate-pulse flex flex-col justify-between h-full w-full">
    <div className="aspect-[2/3] rounded-lg bg-white/5 mb-6 shadow-xl w-full"/>
    <div className="space-y-3 flex-grow">
      <div className="h-2.5 bg-primary/20 rounded w-1/4"/>
      <div className="h-4 bg-white/10 rounded w-3/4"/>
      <div className="h-3 bg-white/5 rounded w-1/2"/>
    </div>
    <div className="flex justify-between items-center pt-3 mt-3 border-t border-outline-variant/10">
      <div className="h-3 bg-white/5 rounded w-1/4"/>
      <div className="h-3 bg-primary/20 rounded w-1/4"/>
    </div>
  </div>
);

export const BookGrid = ({ books, viewMode, isLoading, error, pagination, onPageChange }) => {
  const isList = viewMode === "list";
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggers.fast,
      },
    },
  };

  const hasPrev = pagination && pagination.page > 1;
  const hasNext = pagination && pagination.page < pagination.totalPages;

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40">
      {/* Editorial Header & Paging controls */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Trending This Week
          </h3>
          <p className="text-on-surface-variant/60 font-body text-sm md:text-base italic">
            {isLoading ? "Retrieving codex listings..." : "What the AVELIS community is discussing"}
          </p>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-4">
            <span className="font-display text-[10px] tracking-[0.15em] text-on-surface-variant/40 uppercase">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <motion.button
                whileHover={hasPrev ? { scale: 1.05, borderColor: "rgba(201, 162, 39, 0.5)", color: "var(--color-primary)" } : {}}
                whileTap={hasPrev ? { scale: 0.95 } : {}}
                onClick={() => hasPrev && onPageChange(pagination.page - 1)}
                disabled={!hasPrev || isLoading}
                className={`w-10 h-10 flex items-center justify-center border rounded-full transition-all focus:outline-none ${
                  hasPrev && !isLoading
                    ? "border-outline-variant/20 text-on-surface hover:bg-white/5 cursor-pointer"
                    : "border-outline-variant/10 text-on-surface/20 cursor-not-allowed opacity-40"
                }`}
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </motion.button>
              <motion.button
                whileHover={hasNext ? { scale: 1.05, borderColor: "rgba(201, 162, 39, 0.5)", color: "var(--color-primary)" } : {}}
                whileTap={hasNext ? { scale: 0.95 } : {}}
                onClick={() => hasNext && onPageChange(pagination.page + 1)}
                disabled={!hasNext || isLoading}
                className={`w-10 h-10 flex items-center justify-center border rounded-full transition-all focus:outline-none ${
                  hasNext && !isLoading
                    ? "border-outline-variant/20 text-on-surface hover:bg-white/5 cursor-pointer"
                    : "border-outline-variant/10 text-on-surface/20 cursor-not-allowed opacity-40"
                }`}
                aria-label="Next page"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <motion.div initial="hidden" animate="visible" variants={revealVariants.A} className="text-center py-20 border border-red-500/10 rounded-2xl bg-red-950/5">
          <span className="material-symbols-outlined text-4xl text-red-400/60 mb-4">
            sync_problem
          </span>
          <p className="font-display text-lg text-red-300">Failure in the Archival Codex</p>
          <p className="text-sm text-red-400/50 mt-2 max-w-md mx-auto">{error.message}</p>
        </motion.div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 md:gap-x-8 gap-y-12">
          {Array.from({ length: 5 }).map((_, idx) => (
            <BookSkeleton key={idx}/>
          ))}
        </div>
      ) : books.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={revealVariants.A} className="text-center py-20 border border-white/5 rounded-2xl bg-surface-container-lowest/10">
          <span className="material-symbols-outlined text-4xl text-primary/40 mb-4">
            search_off
          </span>
          <p className="font-display text-lg text-on-surface-variant">No archival works match your query.</p>
          <p className="text-sm text-on-surface-variant/40 mt-2">Try adjusting your filters or search terms.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className={
            isList
              ? "flex flex-col gap-6 max-w-4xl mx-auto"
              : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 md:gap-x-8 gap-y-12"
          }
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} viewMode={viewMode}/>
          ))}
        </motion.div>
      )}
    </section>
  );
};
