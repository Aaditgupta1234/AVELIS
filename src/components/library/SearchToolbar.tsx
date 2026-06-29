import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "../../utils/motion";

interface SearchToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: string[];
  removeFilter: (filter: string) => void;
  clearAllFilters: () => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  resultCount: number;
}

export const SearchToolbar = ({
  searchQuery,
  setSearchQuery,
  activeFilters,
  removeFilter,
  clearAllFilters,
  selectedSort,
  setSelectedSort,
  viewMode,
  setViewMode,
  resultCount,
}: SearchToolbarProps) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = ["Recommended", "Newest", "A-Z"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-20">
      <div className="glass-card rounded-2xl p-4 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-xl pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary/30 focus:border-primary/30 text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-all"
              placeholder="Search by author, title, genre, or ISBN..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Advanced Filter */}
            <motion.button
              whileHover={{ y: -1, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-4 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-xl font-display text-[11px] tracking-[0.15em] uppercase text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Advanced
            </motion.button>

            {/* Sort Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ y: -1, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-5 py-4 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-xl font-display text-[11px] tracking-[0.15em] uppercase text-on-surface-variant justify-between min-w-[180px]"
              >
                <span>Sort: {selectedSort}</span>
                <motion.span 
                  animate={{ rotate: isSortOpen ? 180 : 0 }}
                  transition={springs.smooth}
                  className="material-symbols-outlined text-sm"
                >
                  expand_more
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 5 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={springs.smooth}
                    className="absolute z-30 left-0 right-0 top-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl py-2 shadow-2xl mt-1 overflow-hidden"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedSort(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-xs font-display tracking-wider uppercase hover:bg-primary/10 transition-colors ${
                          selectedSort === option ? "text-primary bg-primary/5" : "text-white/60"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Toggle */}
            <div className="flex bg-surface-container-lowest/50 border border-outline-variant/20 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-on-surface-variant/50 hover:text-primary"
                }`}
                aria-label="Grid View"
              >
                <span className="material-symbols-outlined text-sm block">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-primary/10 text-primary" : "text-on-surface-variant/50 hover:text-primary"
                }`}
                aria-label="List View"
              >
                <span className="material-symbols-outlined text-sm block">view_list</span>
              </button>
            </div>

            <motion.button
              whileHover={{ 
                y: -2, 
                boxShadow: "0px 10px 35px -10px rgba(212, 175, 55, 0.3)",
                filter: "brightness(1.1)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="bg-primary text-on-primary px-10 py-4 rounded-xl font-display text-[11px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-lg shadow-primary/10"
            >
              Search Library
            </motion.button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-outline-variant/10">
            <span className="font-display text-[10px] tracking-[0.2em] font-semibold text-on-surface-variant/50 mr-2 uppercase">
              {resultCount} RESULTS FOUND FOR:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={filter}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full pl-3 pr-2 py-1.5"
                >
                  <span className="text-[10px] font-medium text-primary tracking-wider uppercase font-display">{filter}</span>
                  <button
                    onClick={() => removeFilter(filter)}
                    className="material-symbols-outlined text-[14px] text-primary hover:text-white transition-colors"
                  >
                    close
                  </button>
                </motion.div>
              ))}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-[10px] text-primary hover:text-white underline underline-offset-4 font-semibold font-display tracking-wider ml-auto transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
