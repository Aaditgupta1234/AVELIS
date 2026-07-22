import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";
import { BackgroundShader } from "../../components/ui/BackgroundShader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { JournalHero } from "../../components/journal/JournalHero";
import { ReflectionEditor } from "../../components/journal/ReflectionEditor";
import { ReflectionGrid } from "../../components/journal/ReflectionGrid";
import { JournalPagination } from "../../components/journal/JournalPagination";
import { useAuth } from "../../hooks/useAuth.js";
import { getUserReviews } from "../../services/review.service.js";

export const ReadingJournalPage = () => {
  const { user } = useAuth();
  const storageKey = `avelis_reflections_${user?.id || "guest"}`;

  const [reflections, setReflections] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load real user reviews from backend and merge with local reflections
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      try {
        const savedLocal = localStorage.getItem(storageKey);
        const localItems = savedLocal ? JSON.parse(savedLocal) : [];

        let remoteItems = [];
        if (user) {
          const reviews = await getUserReviews();
          if (Array.isArray(reviews)) {
            remoteItems = reviews.map((rev) => ({
              id: `review-${rev.id}`,
              title: rev.bookTitle ? `Review: ${rev.bookTitle}` : "Book Reflection",
              content: rev.comment || `Rated ${rev.rating}/5 stars.`,
              bookTitle: rev.bookTitle || "Archival Codex",
              bookAuthor: rev.author || "Archival Author",
              coverImage: rev.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
              visibility: "public",
              readingTime: "3 min read",
              date: new Date(rev.createdAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              appreciations: rev.rating * 10,
              saves: rev.rating * 3,
            }));
          }
        }

        if (isMounted) {
          // Merge local and remote, deduplicating by ID
          const combinedMap = new Map();
          [...localItems, ...remoteItems].forEach((item) => combinedMap.set(item.id, item));
          setReflections(Array.from(combinedMap.values()));
        }
      } catch (err) {
        // Fallback to local items if endpoint unavailable
      }
    };

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [user, storageKey]);

  // Persist reflections to LocalStorage when changed
  const handleSave = (entry) => {
    const newReflection = {
      id: `ref-${Date.now()}`,
      title: entry.title,
      content: entry.content,
      bookTitle: entry.bookTitle || undefined,
      bookAuthor: entry.bookTitle ? "Archival Author" : undefined,
      visibility: entry.visibility || "private",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readingTime: `${Math.max(2, Math.ceil(entry.content.split(/\s+/).length / 200))} min read`,
      appreciations: entry.visibility === "public" ? 1 : 0,
      saves: 0,
    };

    const updated = [newReflection, ...reflections];
    setReflections(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Storage quota fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col overflow-hidden">
      {/* Paper Grain Texture */}
      <div className="paper-grain" />

      {/* Page Progress Indicator */}
      <ProgressBar />

      {/* Ambient Shader Canvas */}
      <BackgroundShader />

      {/* Global Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 relative z-10">
        {/* Journal Header */}
        <JournalHero />

        {/* Reflection Writer Card */}
        <ReflectionEditor onSave={handleSave} />

        {/* Bento Grid Reflections Feed */}
        <ReflectionGrid reflections={reflections} />

        {/* Feed Pagination */}
        <JournalPagination />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default ReadingJournalPage;
