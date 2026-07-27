import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBooks } from "../../context/BooksContext.jsx";
import { createBook, updateBook, deleteBook } from "../../services/book.service.js";
import { mapBookToUI } from "../../mappers/book.mapper.js";
import { mockCollections } from "../../data/collections.js";
import { uploadBookCover, uploadBookPdf } from "../../services/upload.service.js";
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, restoreCategoryApi } from "../../api/category.api.js";
import { getAuthorsApi, createAuthorApi, updateAuthorApi, deleteAuthorApi, restoreAuthorApi } from "../../api/author.api.js";
import { getHeroApi, saveHeroApi } from "../../api/hero.api.js";
import { getBundlesApi, createBundleApi, updateBundleApi, deleteBundleApi } from "../../api/bundle.api.js";
import { getAllPublicReviews, deleteReview } from "../../services/review.service.js";
import { apiClient } from "../../api/client.js";
import {
  Trash2,
  Edit,
  Plus,
  X,
  Search,
  CheckCircle,
  Sparkles,
  Package,
  BookOpen,
  Layout,
  Tag,
  DollarSign,
  Layers,
  Star,
  Megaphone,
  CheckSquare,
  Upload,
  FileText,
  MessageSquare,
  RotateCcw,
  Save,
  ShoppingBag,
  XCircle,
  Image as ImageIcon,
  ShieldAlert,
  Info,
  UserCheck,
  RefreshCw,
  FolderPlus,
  UserPlus
} from "lucide-react";

const CatalogManagerInner = () => {
  const {
    books,
    isLoading,
    refreshBooks,
    removeBookFromState,
    optimisticCreate,
    optimisticEdit
  } = useBooks();

  // Dynamic API Relations State
  const [apiAuthors, setApiAuthors] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);

  // Quick Create Modal State inside Book Form
  const [isQuickAuthorOpen, setIsQuickAuthorOpen] = useState(false);
  const [quickAuthorName, setQuickAuthorName] = useState("");
  const [quickAuthorBio, setQuickAuthorBio] = useState("");
  const [quickAuthorPhoto, setQuickAuthorPhoto] = useState("");
  const [quickAuthorLoading, setQuickAuthorLoading] = useState(false);

  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDesc, setQuickCategoryDesc] = useState("");
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);

  // Dedicated Authors & Categories Management Tab State
  const [adminTab, setAdminTab] = useState("catalog"); // "catalog" | "relations" | "hero" | "bundles" | "reflections" | "orders"
  const [relationFilter, setRelationFilter] = useState("active"); // "active" | "archived" | "all"
  const [relationSearchQuery, setRelationSearchQuery] = useState("");

  // Edit / Restore / Audit Modal State in Management Tab
  const [editingAuthorModal, setEditingAuthorModal] = useState(null);
  const [editingCategoryModal, setEditingCategoryModal] = useState(null);
  const [confirmRestoreModal, setConfirmRestoreModal] = useState(null); // { type: 'author'|'category', item: ... }
  const [viewAuditModal, setViewAuditModal] = useState(null); // { type: 'author'|'category', item: ... }

  // Fetch live Authors & Categories dynamically from API on mount & filter change
  const fetchRelations = async (filterParam = relationFilter) => {
    try {
      const [authRes, catRes] = await Promise.all([
        getAuthorsApi({ filter: filterParam }),
        getCategoriesApi({ filter: filterParam }),
      ]);
      const authorsData = Array.isArray(authRes)
        ? authRes
        : (Array.isArray(authRes?.data) ? authRes.data : (Array.isArray(authRes?.data?.data) ? authRes.data.data : []));
      const categoriesData = Array.isArray(catRes)
        ? catRes
        : (Array.isArray(catRes?.data) ? catRes.data : (Array.isArray(catRes?.data?.data) ? catRes.data.data : []));

      setApiAuthors(authorsData);
      setApiCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load live authors/categories from API:", err);
    }
  };

  useEffect(() => {
    fetchRelations(relationFilter);
  }, [relationFilter, adminTab]);





  // Quick Create Submit Handlers
  const handleQuickCreateAuthor = async (e) => {
    e.preventDefault();
    if (!quickAuthorName.trim()) return;
    setQuickAuthorLoading(true);
    try {
      const res = await createAuthorApi({
        fullName: quickAuthorName,
        biography: quickAuthorBio,
        photo: quickAuthorPhoto,
      });
      if (res.success && res.data) {
        const newAuthor = res.data;
        showToast(`Author "${newAuthor.fullName || newAuthor.name}" saved successfully!`);
        setApiAuthors((prev) => {
          const exists = prev.some((a) => a.id === newAuthor.id);
          if (exists) return prev.map((a) => (a.id === newAuthor.id ? newAuthor : a));
          return [...prev, newAuthor];
        });
        setSelectedAuthorId(newAuthor.id);
        setIsQuickAuthorOpen(false);
        setQuickAuthorName("");
        setQuickAuthorBio("");
        setQuickAuthorPhoto("");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to save author.");
    } finally {
      setQuickAuthorLoading(false);
    }
  };

  const handleQuickCreateCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;
    setQuickCategoryLoading(true);
    try {
      const res = await createCategoryApi({
        name: quickCategoryName,
        description: quickCategoryDesc,
      });
      if (res.success && res.data) {
        const newCategory = res.data;
        showToast(`Category "${newCategory.name}" saved successfully!`);
        setApiCategories((prev) => {
          const exists = prev.some((c) => c.id === newCategory.id);
          if (exists) return prev.map((c) => (c.id === newCategory.id ? newCategory : c));
          return [...prev, newCategory];
        });
        setSelectedCategoryId(newCategory.id);
        setIsQuickCategoryOpen(false);
        setQuickCategoryName("");
        setQuickCategoryDesc("");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to save category.");
    } finally {
      setQuickCategoryLoading(false);
    }
  };

  // Management Tab Actions
  const handleSaveEditAuthor = async (e) => {
    e.preventDefault();
    if (!editingAuthorModal) return;
    try {
      const res = await updateAuthorApi(editingAuthorModal.id, {
        fullName: editingAuthorModal.fullName || editingAuthorModal.name,
        biography: editingAuthorModal.biography,
        photo: editingAuthorModal.photo,
        expectedUpdatedAt: editingAuthorModal.updatedAt,
      });
      if (res.success) {
        showToast(`Author "${res.data.fullName}" updated successfully!`);
        setEditingAuthorModal(null);
        fetchRelations(relationFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update author.");
    }
  };

  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    if (!editingCategoryModal) return;
    try {
      const res = await updateCategoryApi(editingCategoryModal.id, {
        name: editingCategoryModal.name,
        description: editingCategoryModal.description,
        expectedUpdatedAt: editingCategoryModal.updatedAt,
      });
      if (res.success) {
        showToast(`Category "${res.data.name}" updated successfully!`);
        setEditingCategoryModal(null);
        fetchRelations(relationFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update category.");
    }
  };

  const handleDeleteAuthor = async (author) => {
    if (author.isSystem) return;
    if (!window.confirm(`Are you sure you want to soft-delete author "${author.fullName || author.name}"?`)) return;
    try {
      const res = await deleteAuthorApi(author.id);
      showToast(res.message || "Author soft-deleted.");
      fetchRelations(relationFilter);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to delete author.");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category.isSystem) return;
    if (!window.confirm(`Are you sure you want to soft-delete category "${category.name}"?`)) return;
    try {
      const res = await deleteCategoryApi(category.id);
      showToast(res.message || "Category soft-deleted.");
      fetchRelations(relationFilter);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to delete category.");
    }
  };

  const handleExecuteRestore = async () => {
    if (!confirmRestoreModal) return;
    const { type, item } = confirmRestoreModal;
    try {
      if (type === 'author') {
        const res = await restoreAuthorApi(item.id);
        showToast(`Author "${res.data.fullName || res.data.name}" restored successfully!`);
      } else {
        const res = await restoreCategoryApi(item.id);
        showToast(`Category "${res.data.name}" restored successfully!`);
      }
      setConfirmRestoreModal(null);
      fetchRelations(relationFilter);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to restore.");
    }
  };

  // -------------------------------------------------------------
  // TAB 4: MEMBER JOURNAL REFLECTIONS MODERATION STATE
  // -------------------------------------------------------------
  const [publicReflections, setPublicReflections] = useState([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);

  const fetchPublicReflections = async () => {
    setReflectionsLoading(true);
    try {
      const reviews = await getAllPublicReviews();
      if (Array.isArray(reviews)) {
        const mapped = reviews.map((rev) => {
          const lines = (rev.comment || "").split("\n\n");
          const titleStr = lines.length > 1 ? lines[0] : (rev.book?.title ? `Meditation: ${rev.book.title}` : "Archival Meditation");
          const contentStr = lines.length > 1 ? lines.slice(1).join("\n\n") : rev.comment;

          return {
            id: rev.id,
            userId: rev.user?.id,
            authorName: rev.user?.username || "Member Scholar",
            title: titleStr,
            content: contentStr || `Rated ${rev.rating}/5 stars.`,
            bookTitle: rev.book?.title,
            bookAuthor: rev.book?.authors?.[0]?.author?.fullName,
            coverImage: rev.book?.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
            date: new Date(rev.createdAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            readingTime: `${Math.max(2, Math.ceil((contentStr || "").split(/\s+/).length / 200))} min read`,
          };
        });
        setPublicReflections(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch public reflections for admin:", err);
    } finally {
      setReflectionsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 5: ADMIN CUSTOMER ORDERS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [allOrders, setAllOrders] = useState([]);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);

  const fetchAdminOrders = async () => {
    setAdminOrdersLoading(true);
    try {
      const response = await apiClient.get('/orders');
      setAllOrders(response.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
      setAllOrders([]);
    } finally {
      setAdminOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (adminTab === "orders") {
      fetchAdminOrders();
    }
  }, [adminTab]);

  const handleAdminCancelOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to cancel Order ${orderNumber}? Stock will be automatically restored.`)) return;
    try {
      const res = await apiClient.patch(`/orders/${orderId}/cancel`, {
        reason: "ADMIN_CANCELLED"
      });
      showToast(`Order ${orderNumber} cancelled by Admin. Stock restored.`);
      fetchAdminOrders();
      refreshBooks();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to cancel order.");
    }
  };

  useEffect(() => {
    if (adminTab === "reflections") {
      fetchPublicReflections();
    }
  }, [adminTab]);

  const handleDeleteReflection = async (reviewId) => {
    if (!window.confirm("Are you sure you want to remove this public reflection post?")) return;
    try {
      await deleteReview(reviewId);
      setPublicReflections((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Public reflection removed successfully.");
    } catch (err) {
      showToast(`Failed to remove reflection: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // TAB 1: BOOK CATALOG & PRICE MANAGER STATE
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form & Filtering state
  const BOOK_TYPES = [
    "Hardcover",
    "Paperback",
    "E-Book",
    "Audiobook",
    "Collector's Edition",
    "Archival Codex",
    "Journal",
    "Reference"
  ];

  const [title, setTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("English");
  const [bookType, setBookType] = useState("Hardcover");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [sortField, setSortField] = useState("title");
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [sellingPrice, setSellingPrice] = useState(24.99);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  useEffect(() => {
    if (!selectedAuthorId && Array.isArray(apiAuthors) && apiAuthors.length > 0) {
      setSelectedAuthorId(apiAuthors[0]?.id || "");
    }
  }, [apiAuthors, selectedAuthorId]);

  useEffect(() => {
    if (!selectedCategoryId && Array.isArray(apiCategories) && apiCategories.length > 0) {
      setSelectedCategoryId(apiCategories[0]?.id || "");
    }
  }, [apiCategories, selectedCategoryId]);

  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // File Upload State
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [coverError, setCoverError] = useState(null);

  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfError, setPdfError] = useState(null);
  const [pdfMetadata, setPdfMetadata] = useState(null);

  // File Selection Upload Handlers
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setCoverProgress(0);
    setCoverError(null);

    try {
      const res = await uploadBookCover(file, (percent) => {
        setCoverProgress(percent);
      });
      setCoverImage(res.fileUrl);
      showToast("Cover image uploaded to Supabase!");
    } catch (err) {
      setCoverError(err.message || "Cover upload failed.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploading(true);
    setPdfProgress(0);
    setPdfError(null);

    let clientPageCount = null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
      }

      const rootPagesMatches = binary.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/g) || 
                               binary.match(/\/Count\s+(\d+)[^]*?\/Type\s*\/Pages/g);
      if (rootPagesMatches && rootPagesMatches.length > 0) {
        const counts = rootPagesMatches.map((m) => {
          const match = m.match(/\/Count\s+(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }).filter((n) => n > 0);
        if (counts.length > 0) clientPageCount = Math.max(...counts);
      }

      if (!clientPageCount) {
        const pageObjMatches = binary.match(/\/Type\s*\/Page\b/g);
        if (pageObjMatches && pageObjMatches.length > 0) {
          clientPageCount = pageObjMatches.length;
        }
      }

      if (!clientPageCount) {
        const countMatches = binary.match(/\/Count\s+(\d+)/g);
        if (countMatches && countMatches.length > 0) {
          const counts = countMatches
            .map((m) => parseInt(m.replace(/\/Count\s+/, ""), 10))
            .filter((n) => !isNaN(n) && n > 0 && n < 5000);
          if (counts.length > 0) clientPageCount = Math.max(...counts);
        }
      }
    } catch (_) {}

    setPdfMetadata({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB" + (clientPageCount ? ` • ${clientPageCount} Pages` : ""),
    });

    try {
      const res = await uploadBookPdf(file, (percent) => {
        setPdfProgress(percent);
      });
      setPdfUrl(res.fileUrl);
      const totalP = res.pageCount || res.totalPages || clientPageCount;
      if (totalP) {
        showToast(`PDF uploaded successfully (${totalP} pages detected)!`);
      } else {
        showToast("PDF document uploaded to Supabase!");
      }
    } catch (err) {
      setPdfError(err.message || "PDF upload failed.");
      setPdfMetadata(null);
    } finally {
      setPdfUploading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: HERO & TOP LAYOUT MANAGER ("WHAT APPEARS ABOVE")
  // -------------------------------------------------------------
  const [featuredHeroIds, setFeaturedHeroIds] = useState(() => {
    try {
      const saved = localStorage.getItem("avelis_hero_book_ids");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const single = localStorage.getItem("avelis_hero_book_id");
      if (single) return [single];
      return [];
    } catch {
      return [];
    }
  });

  const [editorPicksIds, setEditorPicksIds] = useState(() => {
    try {
      const saved = localStorage.getItem("avelis_editor_picks_ids");
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Fetch live hero banner settings from server on mount
  useEffect(() => {
    getHeroApi()
      .then((res) => {
        if (res?.success && res?.data) {
          if (Array.isArray(res.data.heroBookIds) && res.data.heroBookIds.length > 0) {
            setFeaturedHeroIds(res.data.heroBookIds);
            localStorage.setItem("avelis_hero_book_ids", JSON.stringify(res.data.heroBookIds));
          }
          if (Array.isArray(res.data.heroBooks) && res.data.heroBooks.length > 0) {
            localStorage.setItem("avelis_hero_books", JSON.stringify(res.data.heroBooks));
          }
          if (Array.isArray(res.data.editorPicksBookIds) && res.data.editorPicksBookIds.length > 0) {
            setEditorPicksIds(res.data.editorPicksBookIds);
            localStorage.setItem("avelis_editor_picks_ids", JSON.stringify(res.data.editorPicksBookIds));
          }
          if (res.data.announcementText) {
            setAnnouncementText(res.data.announcementText);
            localStorage.setItem("avelis_announcement_text", res.data.announcementText);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleEditorPick = (bookId, title) => {
    setEditorPicksIds((prev) => {
      if (prev.includes(bookId)) {
        const next = prev.filter((id) => id !== bookId);
        showToast(`Removed "${title}" from Editor's Choice.`);
        return next;
      }
      if (prev.length >= 4) {
        showToast("Maximum 4 books can be selected for Editor's Choice.");
        return prev;
      }
      const next = [...prev, bookId];
      showToast(`Added "${title}" as Editor's Pick #${next.length}.`);
      return next;
    });
  };

  const handleSaveEditorPicks = async () => {
    const selectedPicksBooks = editorPicksIds
      .map((id) => books.find((b) => String(b.id) === String(id)))
      .filter(Boolean);

    try {
      await saveHeroApi({
        editorPicksBookIds: editorPicksIds,
        editorPicksBooks: selectedPicksBooks
      });

      localStorage.setItem("avelis_editor_picks_ids", JSON.stringify(editorPicksIds));
      localStorage.setItem("avelis_editor_picks_books", JSON.stringify(selectedPicksBooks));
      window.dispatchEvent(new CustomEvent("avelis_editors_picks_updated"));
      showToast("Editor's Choice picks saved successfully!");
    } catch (err) {
      localStorage.setItem("avelis_editor_picks_ids", JSON.stringify(editorPicksIds));
      localStorage.setItem("avelis_editor_picks_books", JSON.stringify(selectedPicksBooks));
      window.dispatchEvent(new CustomEvent("avelis_editors_picks_updated"));
      showToast("Editor's Choice picks updated successfully!");
    }
  };

  // Sanitize featuredHeroIds when books populate if empty
  useEffect(() => {
    if (!Array.isArray(books) || books.length === 0) return;
    setFeaturedHeroIds((prev) => {
      if (prev && prev.length > 0) {
        const valid = prev.filter((id) => books.some((b) => b && String(b.id) === String(id)));
        if (valid.length > 0) return valid;
      }
      return books.slice(0, 6).map((b) => b?.id).filter(Boolean);
    });
  }, [books?.length]);
  const [announcementText, setAnnouncementText] = useState(() => {
    return (
      localStorage.getItem("avelis_announcement_text") ||
      "Welcome to AVELIS — Enjoy 20% Off All Curated Bundling & Physical Archives this Season."
    );
  });

  // -------------------------------------------------------------
  // TAB 3: CURATED BUNDLES MANAGER ("WHAT SHOULD BUNDLE LOOK LIKE")
  // -------------------------------------------------------------
  const [bundles, setBundles] = useState(() => {
    try {
      const saved = localStorage.getItem("avelis_custom_bundles_v1");
      return saved ? JSON.parse(saved) : mockCollections;
    } catch {
      return mockCollections;
    }
  });

  const BUNDLE_CATEGORIES = [
    "Fiction",
    "Philosophy",
    "Business",
    "Science",
    "History",
    "Literature",
    "Technology"
  ];

  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleSubtitle, setBundleSubtitle] = useState("");
  const [bundleCategory, setBundleCategory] = useState("Fiction");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundleVolumes, setBundleVolumes] = useState("3 Volumes");
  const [bundlePrice, setBundlePrice] = useState(49.99);
  const [bundleImage, setBundleImage] = useState("");
  const [bundleCoverUploading, setBundleCoverUploading] = useState(false);
  const [bundleCoverProgress, setBundleCoverProgress] = useState(0);
  const [bundleCoverError, setBundleCoverError] = useState(null);
  const [selectedBookIds, setSelectedBookIds] = useState([]);

  const handleBundleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBundleCoverUploading(true);
    setBundleCoverProgress(0);
    setBundleCoverError(null);

    try {
      const res = await uploadBookCover(file, (percent) => {
        setBundleCoverProgress(percent);
      });
      setBundleImage(res.fileUrl);
      showToast("Bundle cover image uploaded to Supabase Storage!");
    } catch (err) {
      setBundleCoverError(err.message || "Bundle cover upload failed.");
    } finally {
      setBundleCoverUploading(false);
    }
  };

  // Save Bundles & Layout to LocalStorage
  const saveBundlesToStorage = (updatedBundles) => {
    setBundles(updatedBundles);
    try {
      localStorage.setItem("avelis_custom_bundles_v1", JSON.stringify(updatedBundles));
      window.dispatchEvent(new CustomEvent("avelis_bundles_updated"));
    } catch {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Helper relation extractor (100% API Driven, zero hardcoded fallback UUIDs)
  const getUniqueRelations = () => {
    const authorsMap = new Map();
    const categoriesMap = new Map();

    if (Array.isArray(apiAuthors)) {
      apiAuthors.forEach((a) => {
        if (a && a.id) authorsMap.set(a.id, a);
      });
    }
    if (Array.isArray(apiCategories)) {
      apiCategories.forEach((c) => {
        if (c && c.id) categoriesMap.set(c.id, c);
      });
    }

    if (Array.isArray(books)) {
      books.forEach((b) => {
        if (b && Array.isArray(b.authorsList)) {
          b.authorsList.forEach((a) => {
            if (a && a.id) authorsMap.set(a.id, a);
          });
        }
        if (b && Array.isArray(b.categoriesList)) {
          b.categoriesList.forEach((c) => {
            if (c && c.id) categoriesMap.set(c.id, c);
          });
        }
      });
    }

    return {
      authors: Array.from(authorsMap.values()),
      categories: Array.from(categoriesMap.values())
    };
  };

  const { authors, categories } = getUniqueRelations();

  const rawCategories = (Array.isArray(apiCategories) && apiCategories.length > 0)
    ? apiCategories
    : (Array.isArray(categories) ? categories : []);

  const displayCategories = rawCategories.filter(
    (c) => (c?.name || "").toLowerCase().includes(relationSearchQuery.toLowerCase())
  );

  const rawAuthors = (Array.isArray(apiAuthors) && apiAuthors.length > 0)
    ? apiAuthors
    : (Array.isArray(authors) ? authors : []);

  const displayAuthors = rawAuthors.filter(
    (a) => ((a?.fullName || a?.name) || "").toLowerCase().includes(relationSearchQuery.toLowerCase())
  );

  // Book Modal Triggers
  const openCreateModal = () => {
    setEditingBook(null);
    setTitle("");
    setIsbn("");
    setPublisher("Archival Press");
    setLanguage("English");
    setBookType("Hardcover");
    setPublicationYear(new Date().getFullYear());
    setSellingPrice(24.99);
    setStockQuantity(10);
    setDescription("");
    setCoverImage("");
    setPdfUrl("");
    setCoverError(null);
    setCoverProgress(0);
    setPdfError(null);
    setPdfProgress(0);
    setPdfMetadata(null);
    setSelectedAuthorId(authors[0]?.id || "");
    setSelectedCategoryId(categories[0]?.id || "");
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setTitle(book.title);
    setIsbn(book.isbn || "");
    setPublisher(book.publisher || "Archival Press");
    setLanguage(book.language || "English");
    setBookType(book.bookType || "Hardcover");
    setPublicationYear(book.publicationYear || new Date().getFullYear());
    setSellingPrice(book.sellingPrice || 24.99);
    setStockQuantity(book.stockQuantity || 10);
    setDescription(book.description || "");
    setCoverImage(book.coverImage || "");
    setPdfUrl(book.pdfUrl || "");
    setCoverError(null);
    setCoverProgress(0);
    setPdfError(null);
    setPdfProgress(0);
    setPdfMetadata(book.pdfUrl ? { name: "Existing PDF Document", size: "Cloud Storage" } : null);
    setSelectedAuthorId(book.authorsList?.[0]?.id || authors[0]?.id || "");
    setSelectedCategoryId(book.categoriesList?.[0]?.id || categories[0]?.id || "");
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Submit Book Form
  const handleSubmitBook = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitLoading(true);

    const cleanAuthorIds = selectedAuthorId && selectedAuthorId.trim() !== "" ? [selectedAuthorId.trim()] : undefined;
    const cleanCategoryIds = selectedCategoryId && selectedCategoryId.trim() !== "" ? [selectedCategoryId.trim()] : undefined;

    const cleanIsbn = isbn?.trim() ? isbn.trim() : undefined;
    const cleanPublisher = publisher?.trim() ? publisher.trim() : undefined;
    const cleanLanguage = language?.trim() ? language.trim() : undefined;
    const cleanDescription = description?.trim() ? description.trim() : undefined;

    const payload = {
      title: title.trim(),
      publicationYear: parseInt(publicationYear, 10),
      sellingPrice: parseFloat(sellingPrice),
      stockQuantity: parseInt(stockQuantity, 10),
      isBorrowable: true,
      isForSale: true,
      bookType: bookType || "Hardcover",
      ...(cleanIsbn && { isbn: cleanIsbn }),
      ...(cleanPublisher && { publisher: cleanPublisher }),
      ...(cleanLanguage && { language: cleanLanguage }),
      ...(cleanDescription && { description: cleanDescription }),
      coverImage: coverImage || undefined,
      pdfUrl: pdfUrl || undefined,
      ...(cleanAuthorIds && { authorIds: cleanAuthorIds }),
      ...(cleanCategoryIds && { categoryIds: cleanCategoryIds }),
    };

    try {
      if (editingBook) {
        optimisticEdit(editingBook.id, {
          title,
          isbn,
          publisher,
          language,
          bookType,
          publicationYear: parseInt(publicationYear, 10),
          sellingPrice: parseFloat(sellingPrice),
          stockQuantity: parseInt(stockQuantity, 10),
          description,
          coverImage,
          pdfUrl
        });

        const rawUpdated = await updateBook(editingBook.id, payload);
        mapBookToUI(rawUpdated);
        refreshBooks();
        showToast(`Volume "${title}" updated with price $${sellingPrice}!`);
      } else {
        const rawCreated = await createBook(payload);
        const normalized = mapBookToUI(rawCreated);
        optimisticCreate(normalized);
        showToast(`New volume "${title}" added to catalog at $${sellingPrice}!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError(err.message || "Operation failed.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteBook = async (id, bookTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${bookTitle}" from the catalog?`)) {
      return;
    }
    try {
      await deleteBook(id);
      removeBookFromState(id);
      showToast(`Volume "${bookTitle}" deleted.`);
    } catch (err) {
      alert(`Deletion failed: ${err.message || "Unknown error"}`);
    }
  };

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // TAB 2: HERO & LAYOUT ACTIONS (UP TO 6 HERO BOOKS)
  // -------------------------------------------------------------
  const handleToggleHeroBook = (bookId, bookTitle) => {
    setFeaturedHeroIds((prev) => {
      const targetIdStr = String(bookId);
      const isCurrentlySelected = prev.some((id) => String(id) === targetIdStr);

      if (isCurrentlySelected) {
        if (prev.length <= 1) {
          showToast("At least 1 book must remain in the Hero Showcase.");
          return prev;
        }
        return prev.filter((id) => String(id) !== targetIdStr);
      } else {
        if (prev.length >= 6) {
          showToast("Maximum 6 Hero books allowed. Deselect a book first.");
          return prev;
        }
        const matchInBooks = books.find((b) => String(b.id) === targetIdStr);
        const actualId = matchInBooks ? matchInBooks.id : bookId;
        return [...prev, actualId];
      }
    });
  };

  const handleMoveHeroOrder = (e, bookId, direction) => {
    e.stopPropagation();
    setFeaturedHeroIds((prev) => {
      const targetIdStr = String(bookId);
      const index = prev.findIndex((id) => String(id) === targetIdStr);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(newIndex, 0, movedItem);
      return updated;
    });
  };

  const handleSaveHeroShowcase = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const validHeroIds = featuredHeroIds.filter((id) =>
      books.some((b) => String(b.id) === String(id))
    );

    if (!validHeroIds || validHeroIds.length === 0) {
      showToast("Select at least 1 volume for the Hero Showcase.");
      return;
    }

    const fullHeroBooks = validHeroIds
      .map((id) => books.find((b) => String(b.id) === String(id)))
      .filter(Boolean);

    localStorage.setItem("avelis_hero_book_ids", JSON.stringify(validHeroIds));
    localStorage.setItem("avelis_hero_books", JSON.stringify(fullHeroBooks));
    localStorage.setItem("avelis_hero_book_id", String(validHeroIds[0]));

    try {
      await saveHeroApi({ heroBookIds: validHeroIds, heroBooks: fullHeroBooks });
    } catch (_) {}

    window.dispatchEvent(new CustomEvent("avelis_hero_updated"));
    showToast(`Hero Showcase Banner saved successfully! (${validHeroIds.length} volumes active in carousel).`);
  };

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    localStorage.setItem("avelis_announcement_text", announcementText);
    showToast("Site-wide announcement updated successfully!");
  };

  // -------------------------------------------------------------
  // TAB 3: BUNDLES ACTIONS WITH BOOK SELECTOR
  // -------------------------------------------------------------
  const openCreateBundleModal = () => {
    setEditingBundle(null);
    setBundleTitle("");
    setBundleSubtitle("Curated Collection");
    setBundleCategory("Fiction");
    setBundleDescription("");
    setBundleVolumes("3 Volumes Boxed Set");
    setBundlePrice(49.99);
    setBundleImage("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2228&auto=format&fit=crop");
    setBundleCoverError(null);
    setBundleCoverProgress(0);
    setBundleCoverUploading(false);
    setSelectedBookIds(books.slice(0, 3).map((b) => b.id));
    setIsBundleModalOpen(true);
  };

  const openEditBundleModal = (bundle) => {
    setEditingBundle(bundle);
    setBundleTitle(bundle.title);
    setBundleSubtitle(bundle.subtitle || "Curated Series");
    setBundleCategory(bundle.category || "Fiction");
    setBundleDescription(bundle.description || "");
    setBundleVolumes(bundle.volumes || `${bundle.bookIds?.length || 3} Volumes Set`);
    setBundlePrice(bundle.price || 49.99);
    setBundleImage(bundle.image || "");
    setBundleCoverError(null);
    setBundleCoverProgress(0);
    setBundleCoverUploading(false);
    setSelectedBookIds(bundle.bookIds || books.slice(0, 3).map((b) => b.id));
    setIsBundleModalOpen(true);
  };

  useEffect(() => {
    getBundlesApi()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          saveBundlesToStorage(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveBundle = async (e) => {
    e.preventDefault();
    if (!bundleTitle.trim() || !bundleDescription.trim()) return;

    const volumesLabel = bundleVolumes || `${selectedBookIds.length} Volumes Included`;
    const payload = {
      title: bundleTitle,
      subtitle: bundleSubtitle,
      category: bundleCategory || "Fiction",
      description: bundleDescription,
      volumes: volumesLabel,
      price: parseFloat(bundlePrice),
      image: bundleImage || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop",
      bookIds: selectedBookIds
    };

    try {
      if (editingBundle) {
        const res = await updateBundleApi(editingBundle.id, payload);
        const updatedItem = res?.data || { ...editingBundle, ...payload };
        const updated = bundles.map((b) => (b.id === editingBundle.id ? updatedItem : b));
        saveBundlesToStorage(updated);
        showToast(`Bundle "${bundleTitle}" updated!`);
      } else {
        const res = await createBundleApi(payload);
        const newBundle = res?.data || { id: `bundle-${Date.now()}`, ...payload };
        const updated = [newBundle, ...bundles];
        saveBundlesToStorage(updated);
        showToast(`New Bundle "${bundleTitle}" created!`);
      }
    } catch (err) {
      showToast(`Error saving bundle: ${err.message}`);
    }
    setIsBundleModalOpen(false);
  };

  const handleDeleteBundle = async (bundleId, bTitle) => {
    if (!window.confirm(`Delete bundle "${bTitle}"?`)) return;
    try {
      const updated = bundles.filter((b) => b.id !== bundleId);
      saveBundlesToStorage(updated);
      showToast(`Bundle "${bTitle}" deleted.`);
    } catch (err) {
      showToast(`Error deleting bundle: ${err.message}`);
    }
  };

  const filteredBooks = (Array.isArray(books) ? books : [])
    .filter((b) => {
      if (!b) return false;
      const q = (searchQuery || "").toLowerCase();
      const titleStr = (b.title || "").toLowerCase();
      const authorStr = (b.author || b.authorName || "").toLowerCase();
      const typeStr = (b.bookType || "").toLowerCase();
      const matchesSearch =
        titleStr.includes(q) || authorStr.includes(q) || typeStr.includes(q);
      const matchesType =
        selectedTypeFilter === "ALL" || (b.bookType || "Hardcover") === selectedTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const titleA = a?.title || "";
      const titleB = b?.title || "";
      if (sortField === "type") {
        return (a?.bookType || "Hardcover").localeCompare(b?.bookType || "Hardcover");
      }
      if (sortField === "price") {
        return (a?.sellingPrice || 0) - (b?.sellingPrice || 0);
      }
      return titleA.localeCompare(titleB);
    });

  return (
    <div className="space-y-8 bg-[#0D1626]/40 border border-[rgba(201,162,39,0.15)] rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Toast Announcement Portalled directly to document.body */}
      {toastMessage &&
        createPortal(
          <div className="fixed top-20 right-6 bg-[#07111F] border border-emerald-500/60 text-emerald-400 px-6 py-4 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-[99999] flex items-center gap-3 font-body text-sm border-l-4 border-l-emerald-400 transition-all pointer-events-auto">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>,
          document.body
        )}

      {/* Header Toolbar & Role Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[rgba(201,162,39,0.15)]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] font-display text-[9px] tracking-[0.2em] uppercase font-bold">
              ADMIN CONTROL CENTER
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl tracking-[0.05em] text-[#F7F5EE] uppercase">
            Sanctuary Site & Catalog Management
          </h2>
          <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
            Manage physical stock, set pricing, choose top featured hero books, and select specific books in curated bundles.
          </p>
        </div>

        {/* Tab Navigation Pill Selector */}
        <div className="flex items-center gap-2 bg-[#07111F] p-1.5 rounded-lg border border-[#C9A227]/20 flex-wrap">
          <button
            onClick={() => setAdminTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "catalog"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Books & Pricing</span>
          </button>
          <button
            onClick={() => setAdminTab("relations")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "relations"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Authors & Categories</span>
          </button>
          <button
            onClick={() => setAdminTab("hero")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "hero"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Hero & Layout</span>
          </button>
          <button
            onClick={() => setAdminTab("bundles")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "bundles"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Curated Bundles</span>
          </button>
          <button
            onClick={() => setAdminTab("reflections")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "reflections"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Journal Reflections</span>
          </button>
          <button
            onClick={() => setAdminTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer ${
              adminTab === "orders"
                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                : "text-[#F7F5EE]/70 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Orders</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOOKS & PRICE MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F7F5EE]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by title, author, or book type..."
                className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] focus:border-[#C9A227] text-[#F7F5EE] rounded-lg pl-12 pr-4 py-3 text-xs outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Filter by Book Type */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-[#07111F] border border-[rgba(201,162,39,0.25)] focus:border-[#C9A227] text-[#C9A227] rounded-lg px-3 py-3 text-xs outline-none cursor-pointer font-display uppercase tracking-wider font-bold"
              >
                <option value="ALL">All Book Types</option>
                {BOOK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Sort selector */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-[#07111F] border border-[rgba(201,162,39,0.25)] focus:border-[#C9A227] text-[#F7F5EE] rounded-lg px-3 py-3 text-xs outline-none cursor-pointer font-display uppercase tracking-wider font-semibold"
              >
                <option value="title">Sort by Title</option>
                <option value="type">Sort by Book Type</option>
                <option value="price">Sort by Price</option>
              </select>

              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-3 rounded-lg font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_5px_15px_rgba(201,162,39,0.25)] hover:-translate-y-0.5 cursor-pointer font-bold flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Volume</span>
              </button>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.12)] bg-black/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#07111F]/90 text-[#C9A227] font-display tracking-[0.1em] uppercase border-b border-[rgba(201,162,39,0.2)]">
                  <th className="p-4 text-left">Cover</th>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Author</th>
                  <th className="p-4 text-center whitespace-nowrap">Type / Format</th>
                  <th className="p-4 text-center whitespace-nowrap">Selling Price</th>
                  <th className="p-4 text-center whitespace-nowrap">Stock</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,162,39,0.08)] font-body text-[#F7F5EE]/80">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-12 text-center text-[#F7F5EE]/40 animate-pulse font-display text-[10px] tracking-[0.2em] uppercase"
                    >
                      Fetching Archives...
                    </td>
                  </tr>
                ) : filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-[#F7F5EE]/40">
                      No volumes found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book) => {
                    return (
                      <tr key={book.id} className="hover:bg-white/5 transition-colors align-middle">
                        <td className="p-4 align-middle">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
                            }}
                            className="w-9 h-13 object-cover rounded border border-white/10 shadow"
                          />
                        </td>
                        <td className="p-4 align-middle font-semibold text-white">
                          <div>{book.title}</div>
                          <span className="text-[10px] text-[#F7F5EE]/40 font-mono">
                            ISBN: {book.isbn || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{book.author}</td>
                        <td className="p-4 align-middle text-center">
                          <span className="inline-block px-2.5 py-1 rounded bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30 text-[10px] font-display uppercase tracking-wider font-bold whitespace-nowrap">
                            {book.bookType || "Hardcover"}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-center font-bold text-[#C9A227] whitespace-nowrap">
                          ${book.sellingPrice ? book.sellingPrice.toFixed(2) : "24.99"}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                              (book.availableCopiesCount ?? book.stockQuantity) > 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {(book.availableCopiesCount ?? book.stockQuantity) > 0
                              ? `${book.availableCopiesCount ?? book.stockQuantity} in stock`
                              : "Out of stock"}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(book)}
                              className="p-2 border border-[#C9A227]/20 hover:border-[#C9A227] rounded-lg hover:bg-[#C9A227]/10 text-[#C9A227] transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Edit book and price"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="p-2 border border-red-500/20 hover:border-red-500 rounded-lg hover:bg-red-950/20 text-red-400 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete volume"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HERO & TOP LAYOUT SETTINGS ("WHAT SHOULD APPEAR ABOVE") */}
      {/* ========================================================================= */}
      {adminTab === "hero" && (
        <div className="space-y-8">
          <div className="bg-[#07111F] border border-[#C9A227]/20 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 text-[#C9A227]">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-display text-xl uppercase tracking-wider text-white">
                  Featured Hero Books ({featuredHeroIds.length}/6 Selected)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveHeroShowcase}
                className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2.5 rounded-lg font-display text-xs tracking-widest uppercase font-bold cursor-pointer transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Hero Showcase Banner</span>
              </button>
            </div>
            <p className="text-xs text-[#F7F5EE]/70 leading-relaxed font-body">
              Select up to 6 volumes for the Hero Banner carousel. Re-order them using the sequence buttons below to set their exact 1 to 6 position on the Library page.
            </p>

            {/* ACTIVE HERO BANNER SEQUENCE (#1 TO #6 ORDER PREVIEW) */}
            <div className="space-y-3 bg-[#0D1626] p-4 sm:p-5 rounded-xl border border-[#C9A227]/30">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xs text-[#C9A227] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span>Carousel Display Order (#1 to #{featuredHeroIds.length})</span>
                </h4>
                <span className="text-[10px] text-[#F7F5EE]/50 font-body">
                  Use ◄ and ► arrows to change sequence
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {featuredHeroIds.map((id, index) => {
                  const heroBook = books.find((b) => String(b.id) === String(id));
                  if (!heroBook) return null;
                  return (
                    <div
                      key={id}
                      className="bg-[#07111F] border border-[#C9A227]/40 p-2.5 rounded-lg flex flex-col justify-between space-y-2 relative group shadow-md"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="bg-[#C9A227] text-[#07111F] font-display text-[10px] font-bold px-2 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => handleMoveHeroOrder(e, id, "up")}
                            className="p-1 hover:bg-[#C9A227]/20 text-[#C9A227] disabled:opacity-20 rounded text-xs transition-all cursor-pointer"
                            title="Move Left / Earlier"
                          >
                            ◄
                          </button>
                          <button
                            type="button"
                            disabled={index === featuredHeroIds.length - 1}
                            onClick={(e) => handleMoveHeroOrder(e, id, "down")}
                            className="p-1 hover:bg-[#C9A227]/20 text-[#C9A227] disabled:opacity-20 rounded text-xs transition-all cursor-pointer"
                            title="Move Right / Later"
                          >
                            ►
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={heroBook.coverImage}
                          alt={heroBook.title}
                          className="w-8 h-11 object-cover rounded border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-display text-xs text-white truncate">{heroBook.title}</h5>
                          <p className="text-[9px] text-[#F7F5EE]/50 font-body truncate">{heroBook.author}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((b) => {
                const heroIndex = featuredHeroIds.findIndex((id) => String(id) === String(b.id));
                const isSelected = heroIndex !== -1;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleHeroBook(b.id, b.title)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 items-center relative ${
                      isSelected
                        ? "bg-[#C9A227]/10 border-[#C9A227] shadow-lg shadow-[#C9A227]/10"
                        : "bg-[#0D1626] border-white/5 hover:border-[#C9A227]/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-12 h-16 object-cover rounded border border-white/10 flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-display text-sm text-white truncate">{b.title}</h4>
                      <p className="text-xs text-[#F7F5EE]/60 font-body truncate">{b.author}</p>
                      <span className="text-[10px] text-[#C9A227] font-bold mt-1 block">
                        ${b.sellingPrice ? b.sellingPrice.toFixed(2) : "24.99"}
                      </span>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-1.5 bg-[#C9A227] text-[#07111F] text-[10px] font-display font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>#{heroIndex + 1}</span>
                        <div className="flex flex-col ml-1 border-l border-[#07111F]/30 pl-1">
                          <button
                            type="button"
                            disabled={heroIndex === 0}
                            onClick={(e) => handleMoveHeroOrder(e, b.id, "up")}
                            className="hover:text-white disabled:opacity-20 cursor-pointer text-[8px] leading-none transition-colors"
                            title="Move up in carousel order"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={heroIndex === featuredHeroIds.length - 1}
                            onClick={(e) => handleMoveHeroOrder(e, b.id, "down")}
                            className="hover:text-white disabled:opacity-20 cursor-pointer text-[8px] leading-none transition-colors"
                            title="Move down in carousel order"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 text-white/30 text-xs">
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDITOR'S CHOICE PICKS MANAGER */}
          <div className="bg-[#07111F] border border-[#C9A227]/20 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#C9A227]">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-display text-xl uppercase tracking-wider text-white">
                    Editor's Choice Picks (4 Books)
                  </h3>
                </div>
                <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
                  Select the 4 featured books displayed under Editor's Picks on the Collections & Landing pages.
                </p>
              </div>

              <button
                onClick={handleSaveEditorPicks}
                className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-3 rounded-lg font-display text-xs tracking-widest uppercase font-bold cursor-pointer transition-all shadow-md flex-shrink-0"
              >
                Save Editor's Choice Picks
              </button>
            </div>

            {/* 4 Editor Pick Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const pickId = editorPicksIds[slotIdx];
                const pickBook = books.find((b) => String(b.id) === String(pickId));
                return (
                  <div
                    key={slotIdx}
                    className="p-4 rounded-xl border border-white/10 bg-[#0D1626] flex flex-col justify-between space-y-3"
                  >
                    <span className="font-display text-[9px] tracking-widest text-[#C9A227] uppercase font-bold">
                      Slot #{slotIdx + 1} Editor Pick
                    </span>
                    {pickBook ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={pickBook.coverImage}
                          alt={pickBook.title}
                          className="w-10 h-14 object-cover rounded border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-display text-xs text-white truncate">{pickBook.title}</h5>
                          <p className="text-[9px] text-[#F7F5EE]/50 font-body truncate">{pickBook.author}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-white/30 font-display italic py-3 text-center border border-dashed border-white/10 rounded">
                        Empty Slot
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Catalog Selector Grid for Editor's Picks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              {books.map((b) => {
                const pickIdx = editorPicksIds.findIndex((id) => String(id) === String(b.id));
                const isSelected = pickIdx !== -1;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleEditorPick(b.id, b.title)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-center relative ${
                      isSelected
                        ? "bg-[#C9A227]/15 border-[#C9A227] shadow-md shadow-[#C9A227]/10"
                        : "bg-[#0D1626]/60 border-white/5 hover:border-[#C9A227]/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-10 h-14 object-cover rounded border border-white/10 flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-display text-xs text-white truncate">{b.title}</h4>
                      <p className="text-[10px] text-[#F7F5EE]/50 font-body truncate">{b.author}</p>
                    </div>
                    {isSelected ? (
                      <span className="bg-[#C9A227] text-[#07111F] text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                        Pick #{pickIdx + 1}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs border border-white/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        +
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Announcement Banner Editor */}
          <form onSubmit={handleSaveAnnouncement} className="bg-[#07111F] border border-[#C9A227]/20 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-[#C9A227]">
              <Megaphone className="w-5 h-5" />
              <h3 className="font-display text-xl uppercase tracking-wider text-white">
                Global Sanctuary Announcement Banner
              </h3>
            </div>
            <textarea
              rows={3}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full bg-[#0D1626] border border-[#C9A227]/20 focus:border-[#C9A227] text-white rounded-lg p-4 text-sm outline-none font-body leading-relaxed"
              placeholder="Enter announcement text..."
            />
            <button
              type="submit"
              className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-3 rounded-lg font-display text-xs tracking-widest uppercase font-bold cursor-pointer transition-all shadow-md"
            >
              Save Sanctuary Announcement
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CURATED BUNDLES MANAGER ("WHAT SHOULD BUNDLE LOOK LIKE") */}
      {/* ========================================================================= */}
      {adminTab === "bundles" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-xl text-white uppercase tracking-wider">
                Curated Collection Bundles
              </h3>
              <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
                Design custom volume bundles, select included books, set bundle prices, and control how they render on the Collections Page.
              </p>
            </div>
            <button
              onClick={openCreateBundleModal}
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-3 rounded-lg font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bundle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => {
              const includedBooks = books.filter((b) => bundle.bookIds?.includes(b.id));

              return (
                <div
                  key={bundle.id}
                  className="bg-[#07111F] border border-[rgba(201,162,39,0.2)] rounded-xl overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div className="h-44 w-full overflow-hidden relative">
                    <img
                      src={bundle.image}
                      alt={bundle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[#07111F]/90 text-[#C9A227] px-3 py-1 rounded border border-[#C9A227]/30 font-display text-[10px] uppercase font-bold tracking-widest">
                      ${bundle.price ? bundle.price.toFixed(2) : "49.99"}
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-[9px] text-[#C9A227] uppercase tracking-[0.2em] font-bold">
                        {bundle.subtitle || "Curated Bundle"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30 text-[9px] font-display uppercase tracking-wider font-bold">
                        {bundle.category || "General"}
                      </span>
                    </div>
                    <h4 className="font-display text-lg text-white tracking-wide">
                      {bundle.title}
                    </h4>
                    <p className="font-body text-xs text-[#F7F5EE]/70 line-clamp-2">
                      {bundle.description}
                    </p>

                    {/* Display Selected Included Books */}
                    {includedBooks.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-[#C9A227] font-display uppercase tracking-widest block mb-1.5 font-bold">
                          Included Volumes ({includedBooks.length}):
                        </span>
                        <div className="space-y-1">
                          {includedBooks.map((ib) => (
                            <div key={ib.id} className="text-[11px] text-[#F7F5EE]/80 flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] flex-shrink-0" />
                              <span className="truncate">{ib.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="inline-block text-[10px] text-[#F7F5EE]/50 font-display uppercase tracking-widest pt-2">
                      {bundle.volumes || `${bundle.bookIds?.length || 3} Volumes Set`}
                    </span>
                  </div>

                  <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-2">
                    <button
                      onClick={() => openEditBundleModal(bundle)}
                      className="px-3 py-2 border border-[#C9A227]/30 text-[#C9A227] rounded hover:bg-[#C9A227]/10 font-display text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Bundle</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                      className="px-3 py-2 border border-red-500/30 text-red-400 rounded hover:bg-red-950/20 font-display text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEMBER JOURNAL REFLECTIONS MODERATION */}
      {/* ========================================================================= */}
      {adminTab === "reflections" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-xl text-white uppercase tracking-wider">
                Member Journal Reflections Moderation
              </h3>
              <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
                View all public journal entries posted by scholars, review linked library volumes, and moderate public posts.
              </p>
            </div>
            <button
              onClick={fetchPublicReflections}
              className="flex items-center gap-2 bg-[#C9A227]/20 border border-[#C9A227]/40 hover:bg-[#C9A227]/30 text-[#C9A227] px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {reflectionsLoading ? (
            <div className="p-12 text-center text-xs text-[#F7F5EE]/60">Loading public reflections...</div>
          ) : publicReflections.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#F7F5EE]/50 bg-[#07111F] rounded-xl border border-white/5">
              No public member journal reflections currently posted.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publicReflections.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-[#07111F] border border-[rgba(201,162,39,0.2)] rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    {ref.coverImage && (
                      <img
                        src={ref.coverImage}
                        alt={ref.bookTitle || ref.title}
                        className="w-16 h-24 object-cover rounded border border-white/10 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-grow space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#C9A227] font-display uppercase tracking-widest font-bold">
                          By {ref.authorName || "Member Scholar"}
                        </span>
                        <span className="text-[10px] text-white/40">{ref.date}</span>
                      </div>

                      {ref.bookTitle && (
                        <div className="text-[10px] text-[#C9A227]/90 font-display uppercase tracking-wider truncate font-semibold">
                          Linked Volume: {ref.bookTitle}
                        </div>
                      )}

                      <h4 className="font-display text-base text-white truncate">{ref.title}</h4>
                      <p className="font-body text-xs text-[#F7F5EE]/70 line-clamp-3 italic">
                        "{ref.content}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">
                      {ref.readingTime || "3 min read"}
                    </span>
                    <button
                      onClick={() => handleDeleteReflection(ref.id)}
                      className="px-3 py-1.5 border border-rose-500/30 text-rose-400 rounded hover:bg-rose-500/10 font-display text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Post</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CUSTOMER ORDERS MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === "orders" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-display text-xl text-white uppercase tracking-wider">
                All Placed Customer Orders
              </h3>
              <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
                View all physical book orders placed by members, check reserved copies, and manage cancellations/stock restoration.
              </p>
            </div>
            <button
              onClick={fetchAdminOrders}
              className="flex items-center gap-2 bg-[#C9A227]/20 border border-[#C9A227]/40 hover:bg-[#C9A227]/30 text-[#C9A227] px-4 py-2 rounded text-xs font-display tracking-wider uppercase transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {adminOrdersLoading ? (
            <div className="p-12 text-center text-xs text-[#F7F5EE]/60">Loading customer orders...</div>
          ) : allOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#F7F5EE]/50 bg-[#07111F] rounded-xl border border-white/5">
              No physical book orders currently placed.
            </div>
          ) : (
            <div className="space-y-4">
              {allOrders.map((ord) => {
                const firstItem = ord.items?.[0];
                const bookTitle = firstItem?.book?.title || "Archival Hardcover Volume";
                const coverImg = firstItem?.book?.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
                const isCancellable = ord.orderStatus === "PLACED" || ord.orderStatus === "PROCESSING";
                const isCancelled = ord.orderStatus === "CANCELLED";

                return (
                  <div
                    key={ord.id}
                    className="bg-[#07111F] border border-[rgba(201,162,39,0.2)] rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={coverImg}
                        alt={bookTitle}
                        className="w-12 h-16 object-cover rounded border border-white/10 shadow flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs text-[#C9A227] font-semibold tracking-wider">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 font-display text-[8px] tracking-widest uppercase rounded border ${
                              isCancelled
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            }`}
                          >
                            {ord.orderStatus || "PLACED"}
                          </span>
                        </div>
                        <h4 className="font-display text-sm text-white tracking-wide">
                          {bookTitle} {ord.items?.length > 1 ? `(+${ord.items.length - 1} more)` : ""}
                        </h4>
                        <p className="font-body text-[11px] text-[#F7F5EE]/60">
                          Member: <span className="text-[#C9A227] font-semibold">{ord.user?.username || ord.user?.email || "Scholar"}</span> • Placed: {new Date(ord.orderedAt || ord.createdAt).toLocaleDateString()}
                        </p>
                        <p className="font-body text-[10px] text-[#F7F5EE]/40 italic truncate max-w-md">
                          Address: {ord.shippingAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                      <span className="font-display text-base font-bold text-[#C9A227]">
                        ${Number(ord.totalAmount || 24.99).toFixed(2)}
                      </span>
                      <span className={`font-body text-[9px] ${isCancelled ? "text-rose-400" : "text-emerald-400"}`}>
                        Payment: {ord.paymentStatus || "PAID"}
                      </span>
                      {isCancellable && (
                        <button
                          onClick={() => handleAdminCancelOrder(ord.id, ord.orderNumber)}
                          className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 rounded font-display text-[9px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer mt-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Cancel Order & Restock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 6: AUTHORS & CATEGORIES MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === "relations" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#07111F] p-6 rounded-xl border border-[rgba(201,162,39,0.2)]">
            <div>
              <h3 className="font-display text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C9A227]" />
                <span>Authors & Categories Management</span>
              </h3>
              <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
                Manage authors and domains, soft-delete or restore entries, inspect audit lifecycle trails, and review linked volumes count.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Tabs (Active, Archived, All) */}
              <div className="flex items-center bg-[#0D1626] p-1 rounded-lg border border-[#C9A227]/20 text-xs font-display uppercase tracking-wider">
                <button
                  onClick={() => setRelationFilter("active")}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    relationFilter === "active" ? "bg-[#C9A227] text-[#07111F] font-bold" : "text-[#F7F5EE]/60 hover:text-white"
                  }`}
                >
                  Active Only
                </button>
                <button
                  onClick={() => setRelationFilter("archived")}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    relationFilter === "archived" ? "bg-[#C9A227] text-[#07111F] font-bold" : "text-[#F7F5EE]/60 hover:text-white"
                  }`}
                >
                  Archived
                </button>
                <button
                  onClick={() => setRelationFilter("all")}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    relationFilter === "all" ? "bg-[#C9A227] text-[#07111F] font-bold" : "text-[#F7F5EE]/60 hover:text-white"
                  }`}
                >
                  All
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setIsQuickAuthorOpen(true)}
                className="bg-[#C9A227]/20 border border-[#C9A227]/40 hover:bg-[#C9A227]/30 text-[#C9A227] px-3.5 py-2 rounded text-xs font-display tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Author</span>
              </button>

              <button
                onClick={() => setIsQuickCategoryOpen(true)}
                className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-3.5 py-2 rounded text-xs font-display tracking-wider uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Add Category</span>
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F7F5EE]/40" />
            <input
              type="text"
              value={relationSearchQuery}
              onChange={(e) => setRelationSearchQuery(e.target.value)}
              placeholder="Search authors by name, bio or categories by title..."
              className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] focus:border-[#C9A227] text-[#F7F5EE] rounded-lg pl-12 pr-4 py-2.5 text-xs outline-none transition-colors"
            />
          </div>

          {/* 1. CATEGORIES MANAGEMENT TABLE */}
          <div className="bg-[#07111F] border border-[rgba(201,162,39,0.2)] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#0D1626] border-b border-[#C9A227]/20 flex justify-between items-center">
              <h4 className="font-display text-sm text-[#C9A227] uppercase tracking-wider font-bold flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Categories Catalog ({displayCategories.length})</span>
              </h4>
              <span className="text-[10px] text-[#F7F5EE]/50 font-mono">Sorted Alphabetically</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C9A227]/20 bg-[#07111F] text-[#C9A227] font-display text-[10px] uppercase tracking-widest">
                    <th className="p-3.5">Category Name</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 text-center">Active Books</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">System Protected</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-body text-[#F7F5EE]/80">
                  {displayCategories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-white/40">
                        <p className="text-xs">No categories found matching criteria.</p>
                        <button
                          onClick={() => setIsQuickCategoryOpen(true)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] text-xs font-display uppercase tracking-wider hover:bg-[#C9A227]/30 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Add Category
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors align-middle">
                        <td className="p-3.5 font-semibold text-white font-display uppercase tracking-wide">
                          {c.name}
                        </td>
                        <td className="p-3.5 text-[#F7F5EE]/70 max-w-xs truncate">
                          {c.description || "—"}
                        </td>
                        <td className="p-3.5 text-center font-bold text-[#C9A227]">
                          {c.booksCount !== undefined ? c.booksCount : 0}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-display uppercase font-bold tracking-wider border ${
                              c.isDeleted
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {c.isDeleted ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {c.isSystem ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40 text-[9px] font-display uppercase font-bold tracking-widest">
                              System Core
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/30 font-mono">Custom</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setViewAuditModal({ type: 'category', item: c })}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-white/60 hover:text-white transition-all cursor-pointer"
                              title="View Audit Trail Lifecycle"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setEditingCategoryModal(c)}
                              className="p-1.5 border border-[#C9A227]/20 hover:border-[#C9A227] rounded text-[#C9A227] hover:bg-[#C9A227]/10 transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {c.isDeleted ? (
                              <button
                                onClick={() => setConfirmRestoreModal({ type: 'category', item: c })}
                                className="p-1.5 border border-emerald-500/30 hover:border-emerald-500 rounded text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                                title="Restore Category"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled={c.isSystem}
                                onClick={() => handleDeleteCategory(c)}
                                className={`p-1.5 border rounded transition-all ${
                                  c.isSystem
                                    ? "opacity-30 cursor-not-allowed border-white/10 text-white/40"
                                    : "border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                                }`}
                                title={c.isSystem ? "System core categories cannot be deleted." : "Soft-delete Category"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. AUTHORS MANAGEMENT TABLE */}
          <div className="bg-[#07111F] border border-[rgba(201,162,39,0.2)] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#0D1626] border-b border-[#C9A227]/20 flex justify-between items-center">
              <h4 className="font-display text-sm text-[#C9A227] uppercase tracking-wider font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Authors Roster ({displayAuthors.length})</span>
              </h4>
              <span className="text-[10px] text-[#F7F5EE]/50 font-mono">Sorted Alphabetically</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C9A227]/20 bg-[#07111F] text-[#C9A227] font-display text-[10px] uppercase tracking-widest">
                    <th className="p-3.5">Author Name</th>
                    <th className="p-3.5">Biography</th>
                    <th className="p-3.5 text-center">Active Books</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">System Protected</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-body text-[#F7F5EE]/80">
                  {displayAuthors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-white/40">
                        <p className="text-xs">No authors found matching criteria.</p>
                        <button
                          onClick={() => setIsQuickAuthorOpen(true)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] text-xs font-display uppercase tracking-wider hover:bg-[#C9A227]/30 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> + Add Author
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayAuthors.map((a) => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors align-middle">
                        <td className="p-3.5 font-semibold text-white font-display tracking-wide">
                          <div className="flex items-center gap-2.5">
                            {a.photo ? (
                              <img src={a.photo} alt={a.fullName || a.name} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center font-bold text-[10px]">
                                {(a.fullName || a.name || "A").substring(0, 1)}
                              </div>
                            )}
                            <span>{a.fullName || a.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-[#F7F5EE]/70 max-w-xs truncate italic">
                          {a.biography || "—"}
                        </td>
                        <td className="p-3.5 text-center font-bold text-[#C9A227]">
                          {a.booksCount !== undefined ? a.booksCount : 0}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-display uppercase font-bold tracking-wider border ${
                              a.isDeleted
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {a.isDeleted ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {a.isSystem ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40 text-[9px] font-display uppercase font-bold tracking-widest">
                              System Core
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/30 font-mono">Custom</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setViewAuditModal({ type: 'author', item: a })}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-white/60 hover:text-white transition-all cursor-pointer"
                              title="View Audit Trail Lifecycle"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setEditingAuthorModal(a)}
                              className="p-1.5 border border-[#C9A227]/20 hover:border-[#C9A227] rounded text-[#C9A227] hover:bg-[#C9A227]/10 transition-all cursor-pointer"
                              title="Edit Author"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {a.isDeleted ? (
                              <button
                                onClick={() => setConfirmRestoreModal({ type: 'author', item: a })}
                                className="p-1.5 border border-emerald-500/30 hover:border-emerald-500 rounded text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                                title="Restore Author"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled={a.isSystem}
                                onClick={() => handleDeleteAuthor(a)}
                                className={`p-1.5 border rounded transition-all ${
                                  a.isSystem
                                    ? "opacity-30 cursor-not-allowed border-white/10 text-white/40"
                                    : "border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                                }`}
                                title={a.isSystem ? "System core authors cannot be deleted." : "Soft-delete Author"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE & EDIT BOOK MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#0D1626] border border-[#C9A227]/30 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl text-[#F7F5EE] uppercase tracking-[0.05em] mb-4">
              {editingBook ? "Edit Volume & Pricing" : "Add New Volume"}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitBook} className="space-y-4 overflow-y-auto pr-2">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Physical Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227]">
                      Author
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickAuthorOpen(true)}
                      className="text-[10px] text-[#C9A227] hover:text-[#E5C16B] font-display tracking-widest uppercase flex items-center gap-1 cursor-pointer bg-[#C9A227]/10 px-2 py-0.5 rounded border border-[#C9A227]/30 hover:bg-[#C9A227]/20 transition-all"
                    >
                      <Plus className="w-3 h-3" /> + New Author
                    </button>
                  </div>
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => setSelectedAuthorId(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  >
                    {authors.length === 0 ? (
                      <option value="">No Authors Available</option>
                    ) : (
                      authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.fullName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227]">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryOpen(true)}
                      className="text-[10px] text-[#C9A227] hover:text-[#E5C16B] font-display tracking-widest uppercase flex items-center gap-1 cursor-pointer bg-[#C9A227]/10 px-2 py-0.5 rounded border border-[#C9A227]/30 hover:bg-[#C9A227]/20 transition-all"
                    >
                      <Plus className="w-3 h-3" /> + New Category
                    </button>
                  </div>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  >
                    {categories.length === 0 ? (
                      <option value="">No Categories Available</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1 font-bold">
                    Book Type / Format *
                  </label>
                  <select
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.25)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  >
                    {BOOK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. English"
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* COVER IMAGE FILE UPLOADER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] font-semibold">
                    Cover Image File (Supabase Storage)
                  </label>
                  {coverImage && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3" /> Uploaded to Storage
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-[#07111F] p-3 rounded-lg border border-[rgba(201,162,39,0.2)]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-12 h-16 object-cover rounded border border-[#C9A227]/40 flex-shrink-0 shadow"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-[#0D1626] rounded border border-dashed border-[#C9A227]/30 flex flex-col items-center justify-center text-[#C9A227]/50 flex-shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-[#C9A227]/15 hover:bg-[#C9A227]/25 text-[#C9A227] border border-[#C9A227]/40 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{coverUploading ? `Uploading (${coverProgress}%)...` : "Choose Cover Image"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={coverUploading}
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>

                    {coverUploading && (
                      <div className="w-full bg-[#0D1626] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#C9A227] h-full transition-all duration-200"
                          style={{ width: `${coverProgress}%` }}
                        />
                      </div>
                    )}

                    {coverError && (
                      <p className="text-[11px] text-rose-400">{coverError}</p>
                    )}

                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full bg-[#0D1626] border border-white/10 text-[#F7F5EE]/70 rounded p-1.5 text-[11px] outline-none focus:border-[#C9A227]"
                    />
                  </div>
                </div>
              </div>

              {/* PDF DOCUMENT FILE UPLOADER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] font-semibold">
                    PDF Book File (Digital Reader)
                  </label>
                  {pdfUrl && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3" /> Ready for Reader
                    </span>
                  )}
                </div>

                <div className="bg-[#07111F] p-3 rounded-lg border border-[rgba(201,162,39,0.2)] space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-[#F7F5EE] font-medium truncate max-w-[200px]">
                          {pdfMetadata?.name || (pdfUrl ? "PDF Document Linked" : "No PDF selected")}
                        </p>
                        {pdfMetadata?.size && (
                          <span className="text-[10px] text-[#C9A227]/80">{pdfMetadata.size}</span>
                        )}
                      </div>
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 bg-[#C9A227]/15 hover:bg-[#C9A227]/25 text-[#C9A227] border border-[#C9A227]/40 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{pdfUploading ? `Uploading (${pdfProgress}%)...` : "Choose PDF File"}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={pdfUploading}
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {pdfUploading && (
                    <div className="w-full bg-[#0D1626] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#C9A227] h-full transition-all duration-200"
                        style={{ width: `${pdfProgress}%` }}
                      />
                    </div>
                  )}

                  {pdfError && (
                    <p className="text-[11px] text-rose-400">{pdfError}</p>
                  )}

                  <input
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="Or paste direct PDF URL (https://.../book.pdf)"
                    className="w-full bg-[#0D1626] border border-white/10 text-[#F7F5EE]/70 rounded p-1.5 text-[11px] outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-2.5 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer"
                >
                  {submitLoading ? "Saving..." : editingBook ? "Save Changes" : "Create Volume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {isBundleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#0D1626] border border-[#C9A227]/30 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsBundleModalOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl text-[#F7F5EE] uppercase tracking-[0.05em] mb-4">
              {editingBundle ? "Edit Curated Bundle" : "Create New Collection Bundle"}
            </h3>

            <form onSubmit={handleSaveBundle} className="space-y-4 overflow-y-auto pr-2">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Bundle Title *
                </label>
                <input
                  type="text"
                  required
                  value={bundleTitle}
                  onChange={(e) => setBundleTitle(e.target.value)}
                  placeholder="e.g. Modern Classics Boxed Set"
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Subtitle / Badge
                  </label>
                  <input
                    type="text"
                    value={bundleSubtitle}
                    onChange={(e) => setBundleSubtitle(e.target.value)}
                    placeholder="e.g. Featured Series"
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1 font-bold">
                    Category *
                  </label>
                  <select
                    value={bundleCategory}
                    onChange={(e) => setBundleCategory(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.25)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  >
                    {BUNDLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* MULTI-SELECT INCLUDED BOOKS IN BUNDLE */}
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-2 font-bold flex items-center justify-between">
                  <span>Select Included Books ({selectedBookIds.length} Selected) *</span>
                  <span className="text-[#F7F5EE]/50 font-normal">Click to toggle books</span>
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 border border-[rgba(201,162,39,0.25)] rounded-lg p-3 bg-[#07111F]">
                  {books.map((b) => {
                    const isChecked = selectedBookIds.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedBookIds(selectedBookIds.filter((id) => id !== b.id));
                          } else {
                            setSelectedBookIds([...selectedBookIds, b.id]);
                          }
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-[#C9A227]/15 border-[#C9A227] text-white shadow"
                            : "bg-[#0D1626] border-white/5 text-[#F7F5EE]/70 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent div
                          className="w-4 h-4 accent-[#C9A227] rounded cursor-pointer"
                        />
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-8 h-11 object-cover rounded border border-white/10 flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-semibold truncate">{b.title}</p>
                          <p className="text-[10px] text-[#F7F5EE]/50 truncate">{b.author}</p>
                        </div>
                        <span className="text-[10px] text-[#C9A227] font-bold">
                          ${b.sellingPrice ? b.sellingPrice.toFixed(2) : "24.99"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Included Volumes Badge / Label
                </label>
                <input
                  type="text"
                  value={bundleVolumes}
                  onChange={(e) => setBundleVolumes(e.target.value)}
                  placeholder="e.g. 3 Volumes Boxed Set"
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-2 font-bold">
                  Bundle Cover Image Page
                </label>
                <div className="flex items-center gap-4 bg-[#07111F] p-3 rounded-lg border border-[rgba(201,162,39,0.2)]">
                  {bundleImage ? (
                    <img
                      src={bundleImage}
                      alt="Bundle Cover Preview"
                      className="w-12 h-16 object-cover rounded border border-[#C9A227]/40 flex-shrink-0 shadow"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-[#0D1626] rounded border border-dashed border-[#C9A227]/30 flex flex-col items-center justify-center text-[#C9A227]/50 flex-shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-[#C9A227]/15 hover:bg-[#C9A227]/25 text-[#C9A227] border border-[#C9A227]/40 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{bundleCoverUploading ? `Uploading (${bundleCoverProgress}%)...` : "Upload Cover Image File"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={bundleCoverUploading}
                        onChange={handleBundleCoverUpload}
                        className="hidden"
                      />
                    </label>

                    {bundleCoverUploading && (
                      <div className="w-full bg-[#0D1626] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#C9A227] h-full transition-all duration-200"
                          style={{ width: `${bundleCoverProgress}%` }}
                        />
                      </div>
                    )}

                    {bundleCoverError && (
                      <p className="text-[11px] text-rose-400">{bundleCoverError}</p>
                    )}

                    <input
                      type="url"
                      value={bundleImage}
                      onChange={(e) => setBundleImage(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full bg-[#0D1626] border border-white/10 text-[#F7F5EE]/70 rounded p-1.5 text-[11px] outline-none focus:border-[#C9A227]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  placeholder="Describe what is included in this bundle..."
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBundleModalOpen(false)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-2.5 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer"
                >
                  {editingBundle ? "Save Bundle" : "Create Bundle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* QUICK CREATE AUTHOR MODAL */}
      {/* ========================================================================= */}
      {isQuickAuthorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0D1626] border border-[#C9A227]/40 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsQuickAuthorOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg text-[#F7F5EE] uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C9A227]" />
              <span>Add New Author</span>
            </h3>

            <form onSubmit={handleQuickCreateAuthor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Full Author Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickAuthorName}
                  onChange={(e) => setQuickAuthorName(e.target.value)}
                  placeholder="e.g. Carl Sagan"
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Biography (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quickAuthorBio}
                  onChange={(e) => setQuickAuthorBio(e.target.value)}
                  placeholder="Short author biography..."
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={quickAuthorPhoto}
                  onChange={(e) => setQuickAuthorPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickAuthorOpen(false)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAuthorLoading}
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer transition-all"
                >
                  {quickAuthorLoading ? "Saving..." : "Create Author"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK CREATE CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isQuickCategoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0D1626] border border-[#C9A227]/40 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsQuickCategoryOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg text-[#F7F5EE] uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#C9A227]" />
              <span>Add New Category</span>
            </h3>

            <form onSubmit={handleQuickCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quickCategoryDesc}
                  onChange={(e) => setQuickCategoryDesc(e.target.value)}
                  placeholder="Short description of this domain..."
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryOpen(false)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCategoryLoading}
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer transition-all"
                >
                  {quickCategoryLoading ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT AUTHOR MODAL */}
      {/* ========================================================================= */}
      {editingAuthorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0D1626] border border-[#C9A227]/40 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setEditingAuthorModal(null)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg text-[#F7F5EE] uppercase tracking-wider flex items-center gap-2">
              <Edit className="w-4 h-4 text-[#C9A227]" />
              <span>Edit Author</span>
            </h3>

            <form onSubmit={handleSaveEditAuthor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Full Author Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingAuthorModal.fullName || editingAuthorModal.name || ""}
                  onChange={(e) => setEditingAuthorModal({ ...editingAuthorModal, fullName: e.target.value, name: e.target.value })}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Biography
                </label>
                <textarea
                  rows={3}
                  value={editingAuthorModal.biography || ""}
                  onChange={(e) => setEditingAuthorModal({ ...editingAuthorModal, biography: e.target.value })}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={editingAuthorModal.photo || ""}
                  onChange={(e) => setEditingAuthorModal({ ...editingAuthorModal, photo: e.target.value })}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAuthorModal(null)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {editingCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0D1626] border border-[#C9A227]/40 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setEditingCategoryModal(null)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg text-[#F7F5EE] uppercase tracking-wider flex items-center gap-2">
              <Edit className="w-4 h-4 text-[#C9A227]" />
              <span>Edit Category</span>
            </h3>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategoryModal.name || ""}
                  onChange={(e) => setEditingCategoryModal({ ...editingCategoryModal, name: e.target.value })}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingCategoryModal.description || ""}
                  onChange={(e) => setEditingCategoryModal({ ...editingCategoryModal, description: e.target.value })}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] text-[#F7F5EE] rounded p-2.5 text-xs outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategoryModal(null)}
                  className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTORE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-[#0D1626] border border-emerald-500/40 rounded-xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="font-display text-lg text-white uppercase tracking-wider">
              Restore {confirmRestoreModal.type === 'author' ? 'Author' : 'Category'}
            </h3>

            <p className="font-body text-xs text-[#F7F5EE]/80 leading-relaxed">
              Are you sure you want to restore{" "}
              <span className="text-[#C9A227] font-semibold">
                "{confirmRestoreModal.item.name || confirmRestoreModal.item.fullName}"
              </span>
              ? It will reappear in active dropdowns and catalog options.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestoreModal(null)}
                className="px-4 py-2 text-[#F7F5EE]/60 hover:text-white text-xs uppercase font-display cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer shadow-md"
              >
                Restore Entity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT TRAIL LIFECYCLE MODAL */}
      {/* ========================================================================= */}
      {viewAuditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0D1626] border border-[#C9A227]/40 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setViewAuditModal(null)}
              className="absolute top-4 right-4 text-[#F7F5EE]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg text-[#C9A227] uppercase tracking-wider flex items-center gap-2">
              <Info className="w-5 h-5 text-[#C9A227]" />
              <span>Audit Lifecycle Details</span>
            </h3>

            <div className="space-y-3 font-body text-xs bg-[#07111F] p-4 rounded-lg border border-white/10 text-[#F7F5EE]/90">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase font-display text-[10px]">Entity Name:</span>
                <span className="font-bold text-[#C9A227] font-display">{viewAuditModal.item.name || viewAuditModal.item.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase font-display text-[10px]">Created At:</span>
                <span>{viewAuditModal.item.createdAt ? new Date(viewAuditModal.item.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase font-display text-[10px]">Created By:</span>
                <span className="text-emerald-400 font-mono">{viewAuditModal.item.createdBy || 'System Initialization'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase font-display text-[10px]">Updated At:</span>
                <span>{viewAuditModal.item.updatedAt ? new Date(viewAuditModal.item.updatedAt).toLocaleString() : 'N/A'}</span>
              </div>
              {viewAuditModal.item.deletedAt && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-rose-400 uppercase font-display text-[10px]">Deleted At:</span>
                  <span className="text-rose-300">{new Date(viewAuditModal.item.deletedAt).toLocaleString()}</span>
                </div>
              )}
              {viewAuditModal.item.deletedBy && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-rose-400 uppercase font-display text-[10px]">Deleted By:</span>
                  <span className="text-rose-300 font-mono">{viewAuditModal.item.deletedBy}</span>
                </div>
              )}
              {viewAuditModal.item.restoredAt && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-emerald-400 uppercase font-display text-[10px]">Restored At:</span>
                  <span className="text-emerald-300">{new Date(viewAuditModal.item.restoredAt).toLocaleString()}</span>
                </div>
              )}
              {viewAuditModal.item.restoredBy && (
                <div className="flex justify-between pb-1">
                  <span className="text-emerald-400 uppercase font-display text-[10px]">Restored By:</span>
                  <span className="text-emerald-300 font-mono">{viewAuditModal.item.restoredBy}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewAuditModal(null)}
                className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-2 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

class CatalogManagerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CatalogManager rendering error captured:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0D1626] border border-rose-500/40 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg text-white uppercase tracking-wider">
            Catalog Control Center Render Notice
          </h3>
          <p className="font-body text-xs text-rose-300 bg-rose-950/30 p-4 rounded border border-rose-500/20 font-mono text-left overflow-x-auto">
            {this.state.error?.message || "An unexpected rendering exception occurred."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-6 py-2.5 rounded font-display text-xs tracking-wider uppercase font-bold cursor-pointer transition-all shadow-md"
          >
            Reload Control Center
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const CatalogManager = (props) => (
  <CatalogManagerErrorBoundary>
    <CatalogManagerInner {...props} />
  </CatalogManagerErrorBoundary>
);

export default CatalogManager;
