import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import { BackgroundShader } from "../../components/ui/BackgroundShader.jsx";
import { ProgressBar } from "../../components/ui/ProgressBar.jsx";
import { JournalHero } from "../../components/journal/JournalHero.jsx";
import { ReflectionEditor } from "../../components/journal/ReflectionEditor.jsx";
import { ReflectionGrid } from "../../components/journal/ReflectionGrid.jsx";
import { JournalPagination } from "../../components/journal/JournalPagination.jsx";
import { VisibilityToggle } from "../../components/journal/VisibilityToggle.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useBooks } from "../../context/BooksContext.jsx";
import { getAllPublicReviews, createReview, updateReview, deleteReview } from "../../services/review.service.js";
import { getBooks } from "../../services/book.service.js";
import { X, Sparkles, Edit3 } from "lucide-react";

const PUBLIC_STORAGE_KEY = "avelis_public_reflections_v5";

export const ReadingJournalPage = () => {
  const { user } = useAuth();
  const { books } = useBooks();
  const privateStorageKey = user?.id ? `avelis_private_reflections_${user.id}` : "avelis_private_reflections_guest";

  const [reflections, setReflections] = useState([]);
  
  // Edit Reflection Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReflection, setEditingReflection] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editBookTitle, setEditBookTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState("private");

  // Load public reflections from Database + current user's private reflections from LocalStorage
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // 1. Fetch ALL Public Reviews/Reflections from Database
      let publicReviews = [];
      try {
        const reviews = await getAllPublicReviews();
        if (Array.isArray(reviews)) {
          publicReviews = reviews.map((rev) => {
            const lines = (rev.comment || "").split("\n\n");
            const titleStr = lines.length > 1 ? lines[0] : (rev.book?.title ? `Meditation: ${rev.book.title}` : "Archival Meditation");
            const contentStr = lines.length > 1 ? lines.slice(1).join("\n\n") : rev.comment;
            const authorStr = rev.book?.authors?.[0]?.author?.fullName || undefined;

            return {
              id: `review-${rev.id}`,
              userId: rev.user?.id,
              authorName: rev.user?.username || "Member Scholar",
              title: titleStr,
              content: contentStr || `Rated ${rev.rating}/5 stars.`,
              bookTitle: rev.book?.title || undefined,
              bookAuthor: authorStr,
              coverImage: rev.book?.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
              visibility: "public",
              readingTime: `${Math.max(2, Math.ceil((contentStr || "").split(/\s+/).length / 200))} min read`,
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
      } catch {}

      // 2. Fetch Public Reflections Local Fallback
      let publicLocal = [];
      try {
        const savedPublic = localStorage.getItem(PUBLIC_STORAGE_KEY);
        if (savedPublic) publicLocal = JSON.parse(savedPublic);
      } catch {}

      // 3. Fetch Private Reflections
      let privateReflections = [];
      try {
        const local = localStorage.getItem(privateStorageKey);
        if (local) {
          privateReflections = JSON.parse(local);
        }
      } catch {}

      if (isMounted) {
        const map = new Map();
        [...publicReviews, ...publicLocal].forEach((item) => {
          map.set(item.id, { ...item, visibility: "public" });
        });
        privateReflections.forEach((item) => {
          map.set(item.id, { ...item, visibility: "private" });
        });
        setReflections(Array.from(map.values()));
      }
    };

    loadData();

    window.addEventListener("avelis_public_reflections_updated", loadData);
    return () => {
      isMounted = false;
      window.removeEventListener("avelis_public_reflections_updated", loadData);
    };
  }, [user, privateStorageKey]);

  // Handle Delete Reflection
  const handleDelete = async (ref) => {
    if (!window.confirm(`Are you sure you want to delete "${ref.title}"?`)) return;

    if (ref.id?.startsWith("review-")) {
      const reviewId = ref.id.replace("review-", "");
      try {
        await deleteReview(reviewId);
      } catch (err) {
        console.error("Failed to delete review on server:", err);
      }
    }

    // Remove from private & local storage
    try {
      const privateItems = JSON.parse(localStorage.getItem(privateStorageKey) || "[]");
      const updatedPrivate = privateItems.filter((item) => item.id !== ref.id);
      localStorage.setItem(privateStorageKey, JSON.stringify(updatedPrivate));

      const publicItems = JSON.parse(localStorage.getItem(PUBLIC_STORAGE_KEY) || "[]");
      const updatedPublic = publicItems.filter((item) => item.id !== ref.id);
      localStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify(updatedPublic));
    } catch {}

    setReflections((prev) => prev.filter((item) => item.id !== ref.id));
    window.dispatchEvent(new CustomEvent("avelis_public_reflections_updated"));
  };

  // Handle Edit Open
  const handleEdit = (ref) => {
    setEditingReflection(ref);
    setEditTitle(ref.title);
    setEditContent(ref.content);
    setEditBookTitle(ref.bookTitle || "");
    setEditVisibility(ref.visibility || "private");
    setIsEditModalOpen(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReflection || !editTitle.trim() || !editContent.trim()) return;

    const matchedBook = books?.find((b) =>
      editBookTitle && b.title.toLowerCase().includes(editBookTitle.toLowerCase())
    );

    const updatedRef = {
      ...editingReflection,
      title: editTitle.trim(),
      content: editContent.trim(),
      bookTitle: matchedBook?.title || (editBookTitle ? editBookTitle : undefined),
      bookAuthor: matchedBook?.author || editingReflection.bookAuthor,
      coverImage: matchedBook?.coverImage || editingReflection.coverImage,
      visibility: editVisibility,
    };

    if (editingReflection.id?.startsWith("review-")) {
      const reviewId = editingReflection.id.replace("review-", "");
      try {
        await updateReview(reviewId, {
          comment: `${editTitle.trim()}\n\n${editContent.trim()}`,
          rating: 5,
        });
      } catch (err) {
        console.error("Failed to update backend review:", err);
      }
    }

    // Update in UI state
    setReflections((prev) =>
      prev.map((item) => (item.id === editingReflection.id ? updatedRef : item))
    );

    // Update in local storage
    try {
      if (editVisibility === "private") {
        const privateItems = JSON.parse(localStorage.getItem(privateStorageKey) || "[]");
        const updatedPrivate = privateItems.map((item) => (item.id === editingReflection.id ? updatedRef : item));
        localStorage.setItem(privateStorageKey, JSON.stringify(updatedPrivate));
      } else {
        const publicItems = JSON.parse(localStorage.getItem(PUBLIC_STORAGE_KEY) || "[]");
        const updatedPublic = publicItems.map((item) => (item.id === editingReflection.id ? updatedRef : item));
        localStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify(updatedPublic));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent("avelis_public_reflections_updated"));
    setIsEditModalOpen(false);
    setEditingReflection(null);
  };

  // Handle Reflection Save
  const handleSave = async (entry) => {
    const isPrivate = entry.visibility === "private";

    const matchedBook = books?.find((b) =>
      entry.bookTitle && b.title.toLowerCase().includes(entry.bookTitle.toLowerCase())
    );

    const newReflection = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || "guest",
      authorName: user?.username || user?.name || "Archival Reader",
      title: entry.title,
      content: entry.content,
      bookTitle: matchedBook?.title || (entry.bookTitle !== "General Reflection" ? entry.bookTitle : undefined),
      bookAuthor: matchedBook?.author || undefined,
      coverImage: matchedBook?.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
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
      // Save locally to public fallback storage & trigger cross-window update event
      try {
        const existingPublic = JSON.parse(localStorage.getItem(PUBLIC_STORAGE_KEY) || "[]");
        localStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify([newReflection, ...existingPublic]));
      } catch {}

      setReflections((prev) => [newReflection, ...prev]);

      // Post to PostgreSQL Database so ALL users see it
      try {
        let targetBookId = matchedBook?.id;
        if (!targetBookId) {
          const res = await getBooks({ limit: 1 });
          targetBookId = res?.books?.[0]?.id || "6bf52051-860c-4cc4-b60c-1b22d6697399";
        }

        await createReview({
          bookId: targetBookId,
          rating: 5,
          comment: `${entry.title}\n\n${entry.content}`,
        });

        window.dispatchEvent(new CustomEvent("avelis_public_reflections_updated"));
      } catch (err) {
        window.dispatchEvent(new CustomEvent("avelis_public_reflections_updated"));
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
        <ReflectionGrid
          reflections={reflections}
          currentUserId={user?.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Feed Pagination */}
        <JournalPagination />
      </main>

      {/* EDIT REFLECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-[#0D1626] border border-[#C9A227]/30 rounded-xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[#C9A227]">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-display text-xl text-[#F7F5EE] uppercase tracking-[0.05em]">
                Edit Reflection Entry
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1 font-bold">
                  Title of Reflection *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Linked Volume Title
                </label>
                <input
                  type="text"
                  value={editBookTitle}
                  onChange={(e) => setEditBookTitle(e.target.value)}
                  placeholder="Optional book title..."
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1 font-bold">
                  Reflection Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1 font-bold">
                  Visibility
                </label>
                <VisibilityToggle value={editVisibility} onChange={setEditVisibility} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-display uppercase tracking-wider text-[#F7F5EE]/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-2.5 rounded font-display text-xs tracking-widest uppercase font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default ReadingJournalPage;
