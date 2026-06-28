import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs, staggers, durations, easeOut } from "../../utils/motion";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered before focusing
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.medium, ease: easeOut } },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { ...springs.smooth, duration: durations.medium }
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggers.fast,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: durations.fast, ease: easeOut } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-2xl bg-surface border border-white/10 p-8 shadow-2xl"
          >
            <div className="flex items-center border-b border-white/10 pb-4 mb-8">
              <span className="material-symbols-outlined text-primary mr-4">search</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search authors, collections, or topics..."
                className="w-full bg-transparent border-none outline-none font-display text-xl text-white placeholder-white/30"
              />
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div>
                <motion.h3 variants={itemVariants} className="font-display text-[10px] tracking-widest text-primary uppercase mb-4">Suggestions</motion.h3>
                <div className="space-y-3">
                  {["The Botanical Guild", "Julian Vance", "First Editions", "Philosophy Collections"].map((item, i) => (
                    <motion.div key={i} variants={itemVariants} className="text-sm text-white/70 hover:text-primary cursor-pointer transition-colors">
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div>
                <motion.h3 variants={itemVariants} className="font-display text-[10px] tracking-widest text-primary uppercase mb-4">Recent Searches</motion.h3>
                <div className="space-y-3">
                  {["Echoes of Gold", "Elara Sterling", "Sci-Fi Classics"].map((item, i) => (
                    <motion.div key={i} variants={itemVariants} className="text-sm text-white/70 hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-white/30">history</span>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
