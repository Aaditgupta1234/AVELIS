import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "../../utils/motion";
import { VisibilityToggle } from "./VisibilityToggle";
import { useBooks } from "../../context/BooksContext.jsx";
import { X, BookCheck, Sparkles, BookOpen } from "lucide-react";

export const ReflectionEditor = ({ onSave }) => {
  const { books } = useBooks();
  const location = useLocation();
  
  // Check if user came from a specific Book Details Page ("Write Reflection")
  const prefilledTitle = location.state?.prefilledBookTitle || location.state?.linkedBookTitle || "";

  const [bookTitle, setBookTitle] = useState(prefilledTitle);
  const [visibility, setVisibility] = useState("private");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Update book title if location state changes
  useEffect(() => {
    if (prefilledTitle) {
      setBookTitle(prefilledTitle);
    }
  }, [prefilledTitle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter library books for autocomplete
  const matchingBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
    (b.author || "").toLowerCase().includes(bookTitle.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title,
      content,
      bookTitle: bookTitle.trim() || "General Reflection",
      visibility,
    });

    // Reset Form
    setTitle("");
    setContent("");
    setBookTitle("");
    setVisibility("private");
  };

  return (
    <section className="mb-24 max-w-4xl mx-auto px-gutter relative">
      <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 rounded-2xl shadow-2xl relative border border-outline-variant/10">
        {/* Metadata Inputs */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Linked Volume Search (Optional Library Book Selector) */}
          <div className="flex-grow relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-body text-[10px] text-primary block uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Select Volume from Library (Optional)</span>
              </label>
              {bookTitle && (
                <span className="text-[10px] text-[#C9A227] font-mono flex items-center gap-1">
                  <BookCheck className="w-3 h-3" /> Linked to "{bookTitle}"
                </span>
              )}
            </div>

            <div className="relative group">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary transition-colors select-none">
                book
              </span>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => {
                  setBookTitle(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full bg-transparent border-b border-outline-variant/20 py-3 pl-8 pr-8 text-on-surface focus:border-primary focus:ring-0 transition-all outline-none font-body text-sm placeholder:text-on-surface-variant/30 caret-primary"
                placeholder="Search & select a book from library (or leave blank to post anyway)..."
              />
              {bookTitle && (
                <button
                  type="button"
                  onClick={() => setBookTitle("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white cursor-pointer"
                  title="Clear selected book"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown List of Library Books */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#0D1626] border border-[#C9A227]/30 rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto divide-y divide-white/5">
                <div
                  onClick={() => {
                    setBookTitle("");
                    setIsDropdownOpen(false);
                  }}
                  className="p-3 hover:bg-[#C9A227]/10 transition-colors cursor-pointer text-xs text-[#F7F5EE]/60 italic"
                >
                  None (Post general reflection without linking a book)
                </div>

                {matchingBooks.length > 0 ? (
                  matchingBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setBookTitle(b.title);
                        setIsDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-[#C9A227]/15 transition-colors cursor-pointer flex items-center gap-3"
                    >
                      <img
                        src={b.coverImage}
                        alt={b.title}
                        className="w-8 h-11 object-cover rounded border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-semibold text-white truncate">{b.title}</p>
                        <p className="text-[10px] text-[#F7F5EE]/60 truncate">{b.author}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#C9A227]/10 text-[#C9A227] font-display uppercase tracking-wider font-bold">
                        {b.category || "General"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#F7F5EE]/50">
                    No matching volumes in library catalog.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visibility Selector */}
          <div className="w-full md:w-64">
            <label className="font-body text-[10px] text-primary mb-2 block uppercase tracking-[0.2em] font-bold">
              Visibility
            </label>
            <VisibilityToggle value={visibility} onChange={setVisibility} />
          </div>
        </div>

        {/* Writing Area */}
        <div className="mb-12">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none text-2xl md:text-3xl font-display text-on-surface placeholder:text-on-surface-variant/30 mb-4 focus:ring-0 px-0 outline-none caret-primary"
            placeholder="Title of Reflection..."
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="writing-area w-full bg-transparent border-none text-base md:text-lg font-body text-on-surface-variant placeholder:text-on-surface-variant/20 focus:ring-0 px-0 leading-relaxed resize-none outline-none caret-primary"
            placeholder="Begin your meditation here..."
            rows={8}
            required
          />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center pt-8 border-t border-outline-variant/10">
          <div className="flex gap-4">
            <button
              type="button"
              aria-label="Insert bullet list"
              className="text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg"
            >
              <span className="material-symbols-outlined select-none">format_list_bulleted</span>
            </button>
            <button
              type="button"
              aria-label="Insert blockquote"
              className="text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg"
            >
              <span className="material-symbols-outlined select-none">format_quote</span>
            </button>
          </div>

          <motion.button
            type="submit"
            whileHover={{
              scale: 1.02,
              boxShadow: "0px 10px 25px -5px rgba(201, 162, 39, 0.3)",
              filter: "brightness(1.1)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={springs.buttonClick}
            className="bg-primary text-on-primary font-body text-xs tracking-[0.2em] font-bold px-8 py-4 uppercase transition-all shadow-lg shadow-primary/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-[#07111F] min-w-[200px] overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={visibility}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {visibility === "private" ? "Save Reflection" : "Publish Reflection"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </section>
  );
};
export default ReflectionEditor;

