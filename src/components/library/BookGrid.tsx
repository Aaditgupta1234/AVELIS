import { motion } from "framer-motion";
import type { Book } from "../../types/library";
import { BookCard } from "./BookCard";
import { revealVariants, staggers } from "../../utils/motion";

interface BookGridProps {
  books: Book[];
  viewMode: "grid" | "list";
}

export const BookGrid = ({ books, viewMode }: BookGridProps) => {
  const isList = viewMode === "list";

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggers.fast,
      },
    },
  };

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Trending This Week
          </h3>
          <p className="text-on-surface-variant/60 font-body text-sm md:text-base italic">
            What the AVELIS community is discussing
          </p>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "rgba(201, 162, 39, 0.5)", color: "var(--color-primary)" }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant/20 rounded-full text-on-surface transition-all focus:outline-none focus:ring-1 focus:ring-primary/40"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "rgba(201, 162, 39, 0.5)", color: "var(--color-primary)" }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant/20 rounded-full text-on-surface transition-all focus:outline-none focus:ring-1 focus:ring-primary/40"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </motion.button>
        </div>
      </div>

      {books.length === 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={revealVariants.A}
          className="text-center py-20 border border-white/5 rounded-2xl bg-surface-container-lowest/10"
        >
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
            <BookCard key={book.id} book={book} viewMode={viewMode} />
          ))}
        </motion.div>
      )}
    </section>
  );
};
