import { useState, useEffect } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CollectionsHero } from "../sections/collections/CollectionsHero";
import { CollectionsSearch } from "../sections/collections/CollectionsSearch";
import { CollectionsGrid } from "../sections/collections/CollectionsGrid";
import { EditorsPicks } from "../sections/collections/EditorsPicks";
import { FeaturedAuthor } from "../sections/collections/FeaturedAuthor";
import { ReadingQuote } from "../sections/collections/ReadingQuote";
import { CollectionsCTA } from "../sections/collections/CollectionsCTA";
import { mockCollections } from "../data/collections";

export const CollectionsPage = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(mockCollections);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults(mockCollections);
      } else {
        const lower = query.toLowerCase();
        setResults(mockCollections.filter(c => 
          c.title.toLowerCase().includes(lower) || 
          c.description.toLowerCase().includes(lower)
        ));
      }
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <CollectionsHero />
        <CollectionsSearch query={query} setQuery={setQuery} resultCount={results.length} />
        <CollectionsGrid collections={results} isLoading={isLoading} />
        <EditorsPicks />
        <FeaturedAuthor />
        <ReadingQuote />
        <CollectionsCTA />
      </main>
      
      <Footer />
    </div>
  );
};
