import React, { useState } from "react";
import { useBooks } from "../../context/BooksContext.jsx";
import { createBook, updateBook, deleteBook } from "../../services/book.service.js";
import { mapBookToUI } from "../../mappers/book.mapper.js";
import { normalizeError } from "../../utils/error.js";
import { Trash2, Edit, Plus, X, Search, AlertCircle, CheckCircle } from "lucide-react";

// Seeded database fallbacks in case database has no loaded books
const DEFAULT_AUTHORS = [
  { id: "4809f491-50c3-4b09-9ec3-3d7e3379eef6", name: "J.K. Rowling" },
  { id: "d6a4423a-c72e-4264-9eb7-39a106736aed", name: "Route Test Author" }
];

const DEFAULT_CATEGORIES = [
  { id: "32f7455c-8174-4005-9453-6687849f9ec1", name: "Fantasy" },
  { id: "b616ec22-1bab-4ca1-bb05-839b6afd1701", name: "General" }
];

export const CatalogManager = () => {
  const { books, isLoading, error: contextError, refreshBooks, removeBookFromState, optimisticCreate, optimisticEdit } = useBooks();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  // Form state fields
  const [title, setTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("English");
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [sellingPrice, setSellingPrice] = useState(19.99);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Dynamically extract unique authors/categories from currently loaded books
  const getUniqueRelations = () => {
    const authorsMap = new Map();
    const categoriesMap = new Map();

    DEFAULT_AUTHORS.forEach(a => authorsMap.set(a.id, a));
    DEFAULT_CATEGORIES.forEach(c => categoriesMap.set(c.id, c));

    books.forEach(b => {
      if (b.authorsList) {
        b.authorsList.forEach(a => authorsMap.set(a.id, a));
      }
      if (b.categoriesList) {
        b.categoriesList.forEach(c => categoriesMap.set(c.id, c));
      }
    });

    return {
      authors: Array.from(authorsMap.values()),
      categories: Array.from(categoriesMap.values())
    };
  };

  const { authors, categories } = getUniqueRelations();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const openCreateModal = () => {
    setEditingBook(null);
    setTitle("");
    setIsbn("");
    setPublisher("Archival Press");
    setLanguage("English");
    setPublicationYear(new Date().getFullYear());
    setSellingPrice(19.99);
    setStockQuantity(10);
    setDescription("");
    setCoverImage("");
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
    setSellingPrice(book.sellingPrice || 19.99);
    setStockQuantity(book.stockQuantity || 10);
    setDescription(book.description || "");
    setCoverImage(book.coverImage || "");
    setSelectedAuthorId(book.authorsList?.[0]?.id || authors[0]?.id || "");
    setSelectedCategoryId(book.categoriesList?.[0]?.id || categories[0]?.id || "");
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitLoading(true);

    const payload = {
      title,
      isbn,
      publisher,
      language,
      publicationYear: parseInt(publicationYear, 10),
      sellingPrice: parseFloat(sellingPrice),
      stockQuantity: parseInt(stockQuantity, 10),
      isBorrowable: true,
      isForSale: true,
      description,
      coverImage: coverImage || undefined,
      authorIds: [selectedAuthorId],
      categoryIds: [selectedCategoryId]
    };

    try {
      if (editingBook) {
        // Optimistic edit mapping
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
        });

        const rawUpdated = await updateBook(editingBook.id, payload);
        const normalized = mapBookToUI(rawUpdated);
        // Refresh context to resolve final data
        refreshBooks();
        showToast("Volume updated successfully!");
      } else {
        // Create DTO call
        const rawCreated = await createBook(payload);
        const normalized = mapBookToUI(rawCreated);
        optimisticCreate(normalized);
        showToast("New volume registered in catalog!");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this volume from the archives?")) {
      return;
    }
    try {
      await deleteBook(id);
      removeBookFromState(id);
      showToast("Volume deleted successfully.");
    } catch (err) {
      alert(`Deletion failed: ${err.message || "Unknown error"}`);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-[#0D1626]/20 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Toast Announcement */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-[#0D1626] border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded shadow-[0_15px_40px_rgba(0,0,0,0.5)] z-50 flex items-center gap-3 font-body text-sm animate-bounce">
          <CheckCircle className="w-5 h-5"/>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[rgba(201,162,39,0.1)]">
        <div>
          <h2 className="font-display text-2xl tracking-[0.05em] text-[#F7F5EE] uppercase">
            Codex Catalog Management
          </h2>
          <p className="text-xs text-[#F7F5EE]/60 font-body mt-1">
            Maintain, edit, and audit the timeworn archives.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F] px-5 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_5px_15px_rgba(201,162,39,0.2)] hover:-translate-y-0.5 cursor-pointer font-bold"
        >
          <Plus className="w-3.5 h-3.5"/>
          <span>Add Volume</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40"/>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter catalog by title or author..."
          className="w-full bg-[#0D1626] border border-[rgba(201,162,39,0.15)] focus:border-primary/50 text-[#F7F5EE] rounded-lg pl-12 pr-4 py-3 text-xs outline-none transition-colors"
        />
      </div>

      {/* Catalog Table */}
      <div className="overflow-x-auto rounded-lg border border-[rgba(201,162,39,0.08)] bg-black/10">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0D1626]/80 text-primary font-display tracking-[0.1em] uppercase border-b border-[rgba(201,162,39,0.15)]">
              <th className="p-4">Cover</th>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">Category</th>
              <th className="p-4">ISBN</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,162,39,0.06)] font-body text-[#F7F5EE]/80">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-on-surface-variant/40 animate-pulse font-display text-[10px] tracking-[0.2em] uppercase">
                  Fetching Archives...
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-on-surface-variant/40">
                  No volumes found matching the query.
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <img src={book.coverImage} alt={book.title} className="w-8 h-12 object-cover rounded border border-white/5 shadow"/>
                  </td>
                  <td className="p-4 font-semibold text-white">{book.title}</td>
                  <td className="p-4">{book.author}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 border border-[#C9A227]/20 rounded bg-[#C9A227]/5 text-[9px] text-[#C9A227] uppercase">
                      {book.category}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[#F7F5EE]/60">{book.isbn}</td>
                  <td className="p-4 font-semibold">{book.stockQuantity}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(book)}
                      className="p-2 border border-[#C9A227]/10 hover:border-[#C9A227]/40 rounded hover:bg-[#C9A227]/5 text-[#C9A227] transition-all cursor-pointer inline-flex items-center"
                      title="Edit details"
                    >
                      <Edit className="w-3.5 h-3.5"/>
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-2 border border-red-500/10 hover:border-red-500/40 rounded hover:bg-red-950/10 text-red-400 transition-all cursor-pointer inline-flex items-center"
                      title="Delete volume"
                    >
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE & EDIT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#0D1626] border border-[#C9A227]/30 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#F7F5EE]/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>

            <h3 className="font-display text-xl tracking-wider uppercase text-primary mb-6 border-b border-[rgba(201,162,39,0.1)] pb-3">
              {editingBook ? "Edit Archival Volume" : "Add Archival Volume"}
            </h3>

            {formError && (
              <div className="p-4 mb-5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded font-body flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                  {fieldErrors.title && <p className="text-red-400 text-[10px]">{fieldErrors.title}</p>}
                </div>

                {/* ISBN */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">ISBN</label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                  {fieldErrors.isbn && <p className="text-red-400 text-[10px]">{fieldErrors.isbn}</p>}
                </div>

                {/* Publisher */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Publisher</label>
                  <input
                    type="text"
                    required
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                </div>

                {/* Language */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Language</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                </div>

                {/* Pub Year */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Publication Year</label>
                  <input
                    type="number"
                    required
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                  {fieldErrors.publicationYear && <p className="text-red-400 text-[10px]">{fieldErrors.publicationYear}</p>}
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                  {fieldErrors.sellingPrice && <p className="text-red-400 text-[10px]">{fieldErrors.sellingPrice}</p>}
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                  />
                  {fieldErrors.stockQuantity && <p className="text-red-400 text-[10px]">{fieldErrors.stockQuantity}</p>}
                </div>

                {/* Cover Image */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {fieldErrors.coverImage && <p className="text-red-400 text-[10px]">{fieldErrors.coverImage}</p>}
                </div>
              </div>

              {/* Author Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Author Relation</label>
                <select
                  value={selectedAuthorId}
                  onChange={(e) => setSelectedAuthorId(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#0D1626] text-white">
                      {a.name} ({a.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Category Relation</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/20 rounded p-2.5 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0D1626] text-white">
                      {c.name} ({c.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-display uppercase tracking-wider text-[#F7F5EE]/60">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-black/30 border border-outline-variant/20 rounded p-2.5 text-xs text-white resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[rgba(201,162,39,0.1)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-white/10 hover:bg-white/5 rounded font-display text-[9px] tracking-wider uppercase text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-3 bg-[#C9A227] hover:bg-[#E5C16B] disabled:bg-gray-700 text-[#07111F] rounded font-display text-[9px] tracking-wider uppercase transition-colors cursor-pointer font-bold"
                >
                  {submitLoading ? "Submitting..." : editingBook ? "Save Volume" : "Register Volume"}
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
