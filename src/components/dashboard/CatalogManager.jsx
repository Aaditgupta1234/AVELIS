import React, { useState, useEffect } from "react";
import { useBooks } from "../../context/BooksContext.jsx";
import { createBook, updateBook, deleteBook } from "../../services/book.service.js";
import { mapBookToUI } from "../../mappers/book.mapper.js";
import { mockCollections } from "../../data/collections.js";
import { uploadBookCover, uploadBookPdf } from "../../services/upload.service.js";
import { getBundlesApi, createBundleApi, updateBundleApi, deleteBundleApi } from "../../api/bundle.api.js";
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
  Image as ImageIcon
} from "lucide-react";

export const CatalogManager = () => {
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

  // Fetch live Authors & Categories dynamically from API on mount
  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [authRes, catRes] = await Promise.all([
          fetch('/api/v1/authors').then((r) => r.json()),
          fetch('/api/v1/categories').then((r) => r.json()),
        ]);
        if (authRes.success && Array.isArray(authRes.data)) {
          setApiAuthors(authRes.data);
        }
        if (catRes.success && Array.isArray(catRes.data)) {
          setApiCategories(catRes.data);
        }
      } catch (err) {
        console.error("Failed to load live authors/categories from API:", err);
      }
    };
    fetchRelations();
  }, []);

  // Admin Hub Main Section Tabs
  const [adminTab, setAdminTab] = useState("catalog"); // "catalog" | "hero" | "bundles"

  // -------------------------------------------------------------
  // TAB 1: BOOK CATALOG & PRICE MANAGER STATE
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("English");
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [sellingPrice, setSellingPrice] = useState(24.99);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

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
    setPdfMetadata({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
    });

    try {
      const res = await uploadBookPdf(file, (percent) => {
        setPdfProgress(percent);
      });
      setPdfUrl(res.fileUrl);
      showToast("PDF document uploaded to Supabase!");
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
  const [featuredHeroBookId, setFeaturedHeroBookId] = useState(() => {
    return localStorage.getItem("avelis_hero_book_id") || books[0]?.id || "";
  });
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

  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleSubtitle, setBundleSubtitle] = useState("");
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

    apiAuthors.forEach((a) => authorsMap.set(a.id, a));
    apiCategories.forEach((c) => categoriesMap.set(c.id, c));

    books.forEach((b) => {
      if (b.authorsList) b.authorsList.forEach((a) => authorsMap.set(a.id, a));
      if (b.categoriesList) b.categoriesList.forEach((c) => categoriesMap.set(c.id, c));
    });

    return {
      authors: Array.from(authorsMap.values()),
      categories: Array.from(categoriesMap.values())
    };
  };

  const { authors, categories } = getUniqueRelations();

  // Book Modal Triggers
  const openCreateModal = () => {
    setEditingBook(null);
    setTitle("");
    setIsbn("");
    setPublisher("Archival Press");
    setLanguage("English");
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
  // TAB 2: HERO & LAYOUT ACTIONS
  // -------------------------------------------------------------
  const handleSetHeroBook = (bookId, bookTitle) => {
    setFeaturedHeroBookId(bookId);
    localStorage.setItem("avelis_hero_book_id", bookId);
    showToast(`"${bookTitle}" is now set as the Featured Hero Book at the top of the site!`);
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
      await deleteBundleApi(bundleId);
      const updated = bundles.filter((b) => b.id !== bundleId);
      saveBundlesToStorage(updated);
      showToast(`Bundle "${bTitle}" deleted.`);
    } catch (err) {
      showToast(`Error deleting bundle: ${err.message}`);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-[#0D1626]/40 border border-[rgba(201,162,39,0.15)] rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Toast Announcement */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-[#0D1626] border border-emerald-500/40 text-emerald-400 px-6 py-4 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 flex items-center gap-3 font-body text-sm animate-bounce">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
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
        <div className="flex items-center gap-2 bg-[#07111F] p-1.5 rounded-lg border border-[#C9A227]/20">
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOOKS & PRICE MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F7F5EE]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by volume title or author..."
                className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.2)] focus:border-[#C9A227] text-[#F7F5EE] rounded-lg pl-12 pr-4 py-3 text-xs outline-none transition-colors"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-3 rounded-lg font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_5px_15px_rgba(201,162,39,0.25)] hover:-translate-y-0.5 cursor-pointer font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Volume</span>
            </button>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.12)] bg-black/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#07111F]/90 text-[#C9A227] font-display tracking-[0.1em] uppercase border-b border-[rgba(201,162,39,0.2)]">
                  <th className="p-4">Cover</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Featured Hero</th>
                  <th className="p-4 text-right">Actions</th>
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
                      No volumes found in catalog.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book) => {
                    const isHero = featuredHeroBookId === book.id;
                    return (
                      <tr key={book.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
                            }}
                            className="w-9 h-13 object-cover rounded border border-white/10 shadow"
                          />
                        </td>
                        <td className="p-4 font-semibold text-white">
                          <div>{book.title}</div>
                          <span className="text-[10px] text-[#F7F5EE]/40 font-mono">
                            ISBN: {book.isbn || "N/A"}
                          </span>
                        </td>
                        <td className="p-4">{book.author}</td>
                        <td className="p-4 font-bold text-[#C9A227]">
                          ${book.sellingPrice ? book.sellingPrice.toFixed(2) : "24.99"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
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
                        <td className="p-4">
                          <button
                            onClick={() => handleSetHeroBook(book.id, book.title)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                              isHero
                                ? "bg-[#C9A227] text-[#07111F] font-bold shadow-md"
                                : "bg-[#07111F] text-[#F7F5EE]/60 hover:text-white border border-[#C9A227]/20"
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isHero ? "fill-[#07111F]" : ""}`} />
                            <span>{isHero ? "Hero Book" : "Set Hero"}</span>
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-2 border border-[#C9A227]/20 hover:border-[#C9A227] rounded-lg hover:bg-[#C9A227]/10 text-[#C9A227] transition-all cursor-pointer inline-flex items-center"
                            title="Edit book and price"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            className="p-2 border border-red-500/20 hover:border-red-500 rounded-lg hover:bg-red-950/20 text-red-400 transition-all cursor-pointer inline-flex items-center"
                            title="Delete volume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
            <div className="flex items-center gap-3 text-[#C9A227]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-display text-xl uppercase tracking-wider text-white">
                Featured Hero Book ("What Appears Above")
              </h3>
            </div>
            <p className="text-xs text-[#F7F5EE]/70 leading-relaxed font-body">
              Select which volume is highlighted prominently at the top of the Library and Sanctuary Hero sections.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((b) => {
                const isSelected = featuredHeroBookId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleSetHeroBook(b.id, b.title)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 items-center ${
                      isSelected
                        ? "bg-[#C9A227]/10 border-[#C9A227] shadow-lg shadow-[#C9A227]/10"
                        : "bg-[#0D1626] border-white/5 hover:border-[#C9A227]/40"
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
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-[#C9A227] flex-shrink-0" />
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
                    <span className="font-display text-[9px] text-[#C9A227] uppercase tracking-[0.2em] block font-bold">
                      {bundle.subtitle || "Curated Bundle"}
                    </span>
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
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Author
                  </label>
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
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Category
                  </label>
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
      {/* CREATE & EDIT BUNDLE MODAL WITH BOOK SELECTOR */}
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-[10px] font-display uppercase tracking-widest text-[#C9A227] mb-1">
                    Bundle Price ($) *
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
    </div>
  );
};

export default CatalogManager;
