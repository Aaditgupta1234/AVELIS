import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";
import { BackgroundShader } from "../../components/ui/BackgroundShader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FeaturedBook } from "../../components/library/FeaturedBook";
import { SearchToolbar } from "../../components/library/SearchToolbar";
import { BookGrid } from "../../components/library/BookGrid";
import { ContinueReading } from "../../components/library/ContinueReading";
import { CategorySection } from "../../components/library/CategorySection";
import { AuthorSection } from "../../components/library/AuthorSection";
import { useLibrary } from "../../hooks/useLibrary";
import { revealVariants, springs } from "../../utils/motion";

export const LibraryPage = () => {
    const { searchQuery, setSearchQuery, activeFilters, addFilter, removeFilter, clearAllFilters, selectedSort, setSelectedSort, viewMode, setViewMode, filteredBooks, isLoading, error, pagination, setPage } = useLibrary();
    const resultsRef = useRef(null);

    const hasActiveSearch = Boolean((searchQuery && searchQuery.trim().length > 0) || activeFilters.length > 0);

    const handleCategoryClick = (category) => {
        if (activeFilters.includes(category)) {
            removeFilter(category);
        }
        else {
            addFilter(category);
        }
    };

    const handleSearchSubmit = () => {
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (<div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col">
      <div className="paper-grain"></div>
      <ProgressBar />
      <BackgroundShader />
      <Navbar />
      
      <main className="pt-20 pb-24 relative z-10 flex-grow">
        {/* Hero Section - Fades out when searching */}
        <AnimatePresence>
          {!hasActiveSearch && (
            <motion.section
              initial={{ opacity: 0, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={springs.smooth}
              className="relative px-margin-mobile md:px-gutter max-w-container-max mx-auto pt-4 pb-10 text-center"
            >
              <div className="absolute inset-0 gold-glow opacity-60 -z-10"/>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-primary mb-8 tracking-tight">
                Discover Your Next Great Read
              </h1>
              <p className="font-body text-base md:text-lg lg:text-xl text-on-surface-variant max-w-3xl mx-auto opacity-80 italic leading-relaxed">
                A curated sanctuary of timeless narratives, scientific inquiries, and the hidden gems of global literature, meticulously selected for the discerning mind.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Enhanced Search & Filter Toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilters={activeFilters}
          addFilter={addFilter}
          removeFilter={removeFilter}
          clearAllFilters={clearAllFilters}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          viewMode={viewMode}
          setViewMode={setViewMode}
          resultCount={pagination?.totalItems || filteredBooks?.length || 0}
          onSearchSubmit={handleSearchSubmit}
          hasActiveSearch={hasActiveSearch}
        />

        {/* Hero Sections (Featured, Continue Reading) - Fade out when searching */}
        <AnimatePresence>
          {!hasActiveSearch && (
            <motion.div
              initial={{ opacity: 0, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={springs.smooth}
            >
              {/* Elevated Featured Masterpiece */}
              <FeaturedBook />

              {/* Continue Reading */}
              <ContinueReading />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Heading indicator when searching */}
        <div ref={resultsRef}>
          {hasActiveSearch && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15 pb-4"
            >
              <div>
                <h2 className="font-display text-2xl text-primary font-semibold tracking-wide">
                  Matching Search Results
                </h2>
                <p className="font-body text-xs text-on-surface-variant/70 mt-1">
                  Showing {filteredBooks?.length || 0} books found in digital archive
                </p>
              </div>

              <button
                onClick={() => {
                  setSearchQuery("");
                  clearAllFilters();
                }}
                className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs font-display tracking-wider uppercase transition-all cursor-pointer"
              >
                Reset Search & Show All
              </button>
            </motion.div>
          )}

          {/* Editorial Grids: Trending Books / Search Results */}
          <BookGrid books={filteredBooks} viewMode={viewMode} isLoading={isLoading} error={error} pagination={pagination} onPageChange={setPage} hideHeader={hasActiveSearch}/>
        </div>

        {/* Browse by Category & Popular Authors - Fade out when searching */}
        <AnimatePresence>
          {!hasActiveSearch && (
            <motion.div
              initial={{ opacity: 0, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={springs.smooth}
            >
              {/* Browse by Category */}
              <CategorySection activeFilters={activeFilters} onCategoryClick={handleCategoryClick}/>

              {/* Popular Authors */}
              <AuthorSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>);
};
export default LibraryPage;
