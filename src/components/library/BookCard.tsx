import { useState } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import type { Book } from "../../types/library";
import { durations, easeOut } from "../../utils/motion";

interface BookCardProps {
  book: Book;
  viewMode: "grid" | "list";
}

export const BookCard = ({ book, viewMode }: BookCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const spotlight = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(201, 162, 39, 0.08), transparent 80%)`;

  const isList = viewMode === "list";

  if (isList) {
    return (
      <motion.div
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: durations.medium, ease: easeOut }}
        whileHover={{
          borderColor: "rgba(201, 162, 39, 0.3)",
          y: -4,
          boxShadow: "0 10px 30px -10px rgba(201, 162, 39, 0.15)",
        }}
        className="group flex flex-col sm:flex-row gap-6 p-5 border border-white/5 bg-surface-container-lowest/20 rounded-2xl transition-all duration-300 relative overflow-hidden"
      >
        {/* Spotlight overlay */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: spotlight }}
        />

        {/* Image */}
        <div className="w-28 h-40 flex-shrink-0 rounded-xl overflow-hidden relative shadow-md z-10">
          <img
            alt={`${book.title} cover`}
            src={book.coverImage}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } group-hover:scale-105`}
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-display font-semibold tracking-[0.2em] text-primary/80 uppercase">
                {book.category}
              </span>
              <div className="flex items-center text-primary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="text-xs font-bold ml-1">{book.rating}</span>
              </div>
            </div>
            <h4 className="font-display text-xl text-on-surface group-hover:text-primary transition-colors">
              {book.title}
            </h4>
            <p className="text-xs text-on-surface-variant/60 font-medium font-display tracking-wide">
              {book.author}
            </p>
            <p className="text-sm text-on-surface-variant/70 font-body line-clamp-2 leading-relaxed">
              {book.description || "A masterpiece curated for the discerning mind, exploring deep themes of human nature, philosophy, and history."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
            <span className="text-[10px] text-on-surface-variant/40 font-display tracking-[0.15em] uppercase">
              {book.year ? `Published: ${book.year}` : "Archival Edition"}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[10px] font-display font-semibold tracking-[0.15em] text-primary border border-primary/30 px-5 py-2 hover:bg-primary/10 transition-all uppercase"
            >
              BORROW
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid Mode (Matching Stitch layout perfectly)
  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: durations.medium, ease: easeOut }}
      whileHover={{
        borderColor: "rgba(201, 162, 39, 0.3)",
        y: -8,
        boxShadow: "0 15px 30px -10px rgba(201, 162, 39, 0.2)",
      }}
      className="book-card-hover border border-outline-variant/10 rounded-xl bg-surface-container-lowest/30 p-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Spotlight overlay */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlight }}
      />

      <div className="z-10 flex flex-col h-full">
        {/* Cover image container */}
        <div className="aspect-[2/3] rounded-lg overflow-hidden mb-6 shadow-xl relative group bg-surface-container-lowest">
          <img
            alt={`${book.title} cover`}
            src={book.coverImage}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-1000 ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } group-hover:scale-105`}
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <span className="material-symbols-outlined">add</span>
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 flex-grow flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.15em] text-primary/80 uppercase font-semibold block">
              {book.category}
            </span>
            <h5 className="font-display text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
              {book.title}
            </h5>
            <p className="text-xs text-on-surface-variant/60 font-medium">
              {book.author}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-outline-variant/10">
            <div className="flex items-center text-primary">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="text-[11px] font-bold ml-1">{book.rating}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-[10px] tracking-[0.15em] text-primary border-b border-primary/20 pb-0.5 hover:border-primary transition-all uppercase font-semibold"
            >
              BORROW
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
