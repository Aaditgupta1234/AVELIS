import { motion } from "framer-motion";
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
import { revealVariants } from "../../utils/motion";

export const LibraryPage = () => {
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    removeFilter,
    clearAllFilters,
    selectedSort,
    setSelectedSort,
    viewMode,
    setViewMode,
    filteredBooks,
  } = useLibrary();

  return (
    <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col">
      <div className="paper-grain"></div>
      <ProgressBar />
      <BackgroundShader />
      <Navbar />
      
      <main className="pt-32 pb-24 relative z-10 flex-grow">
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={revealVariants.A}
          className="relative px-margin-mobile md:px-gutter max-w-container-max mx-auto py-16 text-center"
        >
          <div className="absolute inset-0 gold-glow opacity-60 -z-10" />
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-primary mb-8 tracking-tight">
            Discover Your Next Great Read
          </h1>
          <p className="font-body text-base md:text-lg lg:text-xl text-on-surface-variant max-w-3xl mx-auto opacity-80 italic leading-relaxed">
            A curated sanctuary of timeless narratives, scientific inquiries, and the hidden gems of global literature, meticulously selected for the discerning mind.
          </p>
        </motion.section>

        {/* Enhanced Search & Filter Toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilters={activeFilters}
          removeFilter={removeFilter}
          clearAllFilters={clearAllFilters}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          viewMode={viewMode}
          setViewMode={setViewMode}
          resultCount={filteredBooks.length}
        />

        {/* Elevated Featured Masterpiece */}
        <FeaturedBook />

        {/* Continue Reading */}
        <ContinueReading />

        {/* Editorial Grids: Trending Books */}
        <BookGrid books={filteredBooks} viewMode={viewMode} />

        {/* Browse by Category */}
        <CategorySection />

        {/* Popular Authors */}
        <AuthorSection />
      </main>

      <Footer />
    </div>
  );
};
export default LibraryPage;
