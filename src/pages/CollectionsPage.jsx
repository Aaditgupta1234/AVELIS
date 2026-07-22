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
  const [allBundles, setAllBundles] = useState(() => {
    try {
      const custom = localStorage.getItem("avelis_custom_bundles_v1");
      return custom ? JSON.parse(custom) : mockCollections;
    } catch {
      return mockCollections;
    }
  });
  const [results, setResults] = useState(allBundles);

  useEffect(() => {
    try {
      const custom = localStorage.getItem("avelis_custom_bundles_v1");
      if (custom) {
        setAllBundles(JSON.parse(custom));
      }
    } catch {}
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults(allBundles);
      } else {
        const lower = query.toLowerCase();
        setResults(
          allBundles.filter(
            (c) =>
              c.title.toLowerCase().includes(lower) ||
              c.description.toLowerCase().includes(lower)
          )
        );
      }
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, allBundles]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20">
        <CollectionsHero />
        <CollectionsSearch
          query={query}
          setQuery={setQuery}
          resultCount={results.length}
        />
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

export default CollectionsPage;
