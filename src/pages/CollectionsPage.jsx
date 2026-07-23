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
import { getBundlesApi } from "../api/bundle.api";

export const CollectionsPage = () => {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("DEFAULT");
  const [isLoading, setIsLoading] = useState(false);
  const loadCustomBundles = () => {
    try {
      const custom = localStorage.getItem("avelis_custom_bundles_v1");
      return custom ? JSON.parse(custom) : mockCollections;
    } catch {
      return mockCollections;
    }
  };

  const [allBundles, setAllBundles] = useState(loadCustomBundles);
  const [results, setResults] = useState(loadCustomBundles);

  useEffect(() => {
    const fetchServerBundles = async () => {
      try {
        const res = await getBundlesApi();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setAllBundles(res.data);
          localStorage.setItem("avelis_custom_bundles_v1", JSON.stringify(res.data));
        }
      } catch (_) {}
    };

    fetchServerBundles();

    const handleSync = () => {
      const updated = loadCustomBundles();
      setAllBundles(updated);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("avelis_bundles_updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("avelis_bundles_updated", handleSync);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...allBundles];

      if (query.trim()) {
        const lower = query.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(lower) ||
            (c.description || "").toLowerCase().includes(lower) ||
            (c.category || "").toLowerCase().includes(lower)
        );
      }

      if (categoryFilter !== "ALL") {
        filtered = filtered.filter(
          (c) => (c.category || "General").toLowerCase() === categoryFilter.toLowerCase()
        );
      }

      if (sortOrder === "A-Z") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortOrder === "Newest") {
        filtered.reverse();
      }

      setResults(filtered);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryFilter, sortOrder, allBundles]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20">
        <CollectionsHero />
        <CollectionsSearch
          query={query}
          setQuery={setQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
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
