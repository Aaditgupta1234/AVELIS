import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import { BackgroundShader } from "../../components/ui/BackgroundShader.jsx";
import { ProgressBar } from "../../components/ui/ProgressBar.jsx";
import { JournalHero } from "../../components/journal/JournalHero.jsx";
import { ReflectionEditor } from "../../components/journal/ReflectionEditor.jsx";
import { ReflectionGrid } from "../../components/journal/ReflectionGrid.jsx";
import { JournalPagination } from "../../components/journal/JournalPagination.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useBooks } from "../../context/BooksContext.jsx";
import { getAllPublicReviews, createReview } from "../../services/review.service.js";
import { getBooks } from "../../services/book.service.js";

const PUBLIC_STORAGE_KEY = "avelis_public_reflections_v5";

export const ReadingJournalPage = () => {
  const { user } = useAuth();
  const { books } = useBooks();
  const privateStorageKey = user?.id ? `avelis_private_reflections_${user.id}` : "avelis_private_reflections_guest";

  const [reflections, setReflections] = useState([]);

  // Load public reflections from Database + current user's private reflections from LocalStorage
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // 1. Fetch ALL Public Reviews/Reflections from Database (visible to ALL users across sessions)
      let publicReviews = [];
      try {
        const reviews = await getAllPublicReviews();
        if (Array.isArray(reviews)) {
          publicReviews = reviews.map((rev) => {
            const lines = (rev.comment || "").split("\n\n");
            const titleStr = lines.length > 1 ? lines[0] : (rev.book?.title ? `Review: ${rev.book.title}` : "Book Meditation");
            const contentStr = lines.length > 1 ? lines.slice(1).join("\n\n") : rev.comment;

            return {
              id: `review-${rev.id}`,
              userId: rev.user?.id,
              authorName: rev.user?.username || "Member Scholar",
              title: titleStr,
              content: contentStr || `Rated ${rev.rating}/5 stars.`,
              bookTitle: rev.book?.title || "Archival Codex",
              bookAuthor: "Archival Author",
              coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
              visibility: "public",
              readingTime: "3 min read",
              date: new Date(rev.createdAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              appreciations: (rev.rating || 5) * 10,
              saves: (rev.rating || 5) * 3,
            };
          });
        }
      } catch {
        publicReviews = [];
      }

      // 2. Local Storage Public Reflections Fallback
      let publicLocal = [];
      try {
        const savedPublic = localStorage.getItem(PUBLIC_STORAGE_KEY);
        publicLocal = savedPublic ? JSON.parse(savedPublic) : [];
      } catch {
        publicLocal = [];
      }

      // 3. Current User's Private Reflections ONLY
      let privateItems = [];
      try {
        const savedPrivate = localStorage.getItem(privateStorageKey);
        privateItems = savedPrivate ? JSON.parse(savedPrivate) : [];
      } catch {
        privateItems = [];
      }

      if (isMounted) {
        const map = new Map();

        // All public items from database and fallback storage
        [...publicReviews, ...publicLocal].forEach((item) => {
          map.set(item.id, { ...item, visibility: "public" });
        });

        // Private items belonging strictly to this logged-in user
        privateItems.forEach((item) => {
          map.set(item.id, { ...item, visibility: "private", userId: user?.id || "guest" });
        });

        setReflections(Array.from(map.values()));
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, privateStorageKey]);

  // Handle Reflection Save
  const handleSave = async (entry) => {
    const isPrivate = entry.visibility === "private";

    const newReflection = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || "guest",
      authorName: user?.username || user?.name || "Archival Reader",
      title: entry.title,
      content: entry.content,
      bookTitle: entry.bookTitle || undefined,
      bookAuthor: entry.bookTitle ? "Archival Author" : undefined,
      visibility: isPrivate ? "private" : "public",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readingTime: `${Math.max(2, Math.ceil(entry.content.split(/\s+/).length / 200))} min read`,
      appreciations: isPrivate ? 0 : 1,
      saves: 0,
    };

    if (isPrivate) {
      // Save ONLY to creator's private storage
      try {
        const existingPrivate = JSON.parse(localStorage.getItem(privateStorageKey) || "[]");
        const updatedPrivate = [newReflection, ...existingPrivate];
        localStorage.setItem(privateStorageKey, JSON.stringify(updatedPrivate));
      } catch {}
      setReflections((prev) => [newReflection, ...prev]);
    } else {
      // Post to PostgreSQL Database so ALL users see it
      try {
        let targetBookId = books?.find(
          (b) =>
            entry.bookTitle &&
            b.title.toLowerCase().includes(entry.bookTitle.toLowerCase())
        )?.id || books?.[0]?.id;

        if (!targetBookId) {
          const res = await getBooks({ limit: 1 });
          targetBookId = res?.books?.[0]?.id || "6bf52051-860c-4cc4-b60c-1b22d6697399";
        }

        await createReview({
          bookId: targetBookId,
          rating: 5,
          comment: `${entry.title}\n\n${entry.content}`,
        });

        // Re-fetch global public feed
        const freshReviews = await getAllPublicReviews();
        if (Array.isArray(freshReviews)) {
          const remoteMapped = freshReviews.map((rev) => {
            const lines = (rev.comment || "").split("\n\n");
            const titleStr = lines.length > 1 ? lines[0] : (rev.book?.title ? `Review: ${rev.book.title}` : "Book Meditation");
            const contentStr = lines.length > 1 ? lines.slice(1).join("\n\n") : rev.comment;

            return {
              id: `review-${rev.id}`,
              userId: rev.user?.id,
              authorName: rev.user?.username || "Member Scholar",
              title: titleStr,
              content: contentStr || `Rated ${rev.rating}/5 stars.`,
              bookTitle: rev.book?.title || "Archival Codex",
              bookAuthor: "Archival Author",
              coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
              visibility: "public",
              readingTime: "3 min read",
              date: new Date(rev.createdAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              appreciations: (rev.rating || 5) * 10,
              saves: (rev.rating || 5) * 3,
            };
          });

          setReflections((prev) => {
            const privateOnly = prev.filter((r) => r.visibility === "private");
            return [...remoteMapped, ...privateOnly];
          });
        }
      } catch (err) {
        // Fallback local save if API call fails
        try {
          const existingPublic = JSON.parse(localStorage.getItem(PUBLIC_STORAGE_KEY) || "[]");
          localStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify([newReflection, ...existingPublic]));
        } catch {}
        setReflections((prev) => [newReflection, ...prev]);
      }
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
        <ReflectionGrid reflections={reflections} currentUserId={user?.id} />

        {/* Feed Pagination */}
        <JournalPagination />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default ReadingJournalPage;
