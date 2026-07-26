import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getBooks } from "../../services/book.service";
import { getAllPublicReviews } from "../../services/review.service";
import { mapBookToUI } from "../../mappers/book.mapper";
import { springs, staggers, durations, easeOut } from "../../utils/motion";

export const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState("");
    const [bookResults, setBookResults] = useState([]);
    const [reflectionResults, setReflectionResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setBookResults([]);
            setReflectionResults([]);
            setIsSearching(false);
            const timeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Combined search across Books and Reflections
    useEffect(() => {
        const cleanQ = query.trim().toLowerCase();
        if (!cleanQ) {
            setBookResults([]);
            setReflectionResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                // 1. Query Books from backend API
                const booksData = await getBooks({ search: cleanQ, limit: 10 }).catch(() => ({ books: [] }));
                const mappedBooks = Array.isArray(booksData?.books)
                    ? booksData.books.map(mapBookToUI).filter(Boolean)
                    : [];

                // Sort books with title-starting priority
                mappedBooks.sort((a, b) => {
                    const aTitle = (a.title || "").toLowerCase();
                    const bTitle = (b.title || "").toLowerCase();
                    const aStart = aTitle.startsWith(cleanQ);
                    const bStart = bTitle.startsWith(cleanQ);
                    if (aStart && !bStart) return -1;
                    if (!aStart && bStart) return 1;
                    return 0;
                });
                setBookResults(mappedBooks);

                // 2. Query Public & Private Reflections
                const publicReviews = await getAllPublicReviews().catch(() => []);
                const localPublic = (() => {
                    try {
                        const saved = localStorage.getItem("avelis_public_reflections_v5");
                        return saved ? JSON.parse(saved) : [];
                    } catch { return []; }
                })();
                const localPrivate = (() => {
                    try {
                        const savedKeys = Object.keys(localStorage).filter(k => k.startsWith("avelis_private_reflections"));
                        let items = [];
                        savedKeys.forEach(k => {
                            try { items = [...items, ...JSON.parse(localStorage.getItem(k))]; } catch {}
                        });
                        return items;
                    } catch { return []; }
                })();

                // Combine and normalize all reflections
                const allReflectionsMap = new Map();

                (publicReviews || []).forEach(r => {
                    allReflectionsMap.set(r.id, {
                        id: r.id,
                        title: r.comment ? `Review: ${r.book?.title || "Archival Tome"}` : "Public Review",
                        content: r.comment || "",
                        bookTitle: r.book?.title || "",
                        authorName: r.user?.fullName || r.user?.username || "Scholar Reader",
                        type: "reflection"
                    });
                });

                [...localPublic, ...localPrivate].forEach(r => {
                    allReflectionsMap.set(r.id || `local-${Math.random()}`, {
                        id: r.id,
                        title: r.title || r.bookTitle || "Reading Reflection",
                        content: r.content || r.notes || "",
                        bookTitle: r.bookTitle || "",
                        authorName: r.authorName || r.user?.fullName || "Avelis Reader",
                        type: "reflection"
                    });
                });

                const filteredReflections = Array.from(allReflectionsMap.values()).filter(r =>
                    (r.title && r.title.toLowerCase().includes(cleanQ)) ||
                    (r.content && r.content.toLowerCase().includes(cleanQ)) ||
                    (r.bookTitle && r.bookTitle.toLowerCase().includes(cleanQ)) ||
                    (r.authorName && r.authorName.toLowerCase().includes(cleanQ))
                ).slice(0, 5);

                setReflectionResults(filteredReflections);
            } catch (_) {
            } finally {
                setIsSearching(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearchSubmit = (searchTerm) => {
        const term = searchTerm !== undefined ? searchTerm : query;
        if (!term || !term.trim()) return;
        navigate(`/library?search=${encodeURIComponent(term.trim())}`);
        onClose();
    };

    const handleReflectionClick = (reflection) => {
        navigate(`/journal`);
        onClose();
    };

    const cleanQuery = query.trim().toLowerCase();
    const totalCount = bookResults.length + reflectionResults.length;

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: durations.medium, ease: easeOut } },
    };
    const modalVariants = {
        hidden: { opacity: 0, y: -20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { ...springs.smooth, duration: durations.medium }
        },
    };
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggers.fast,
                delayChildren: 0.1,
            },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: durations.fast, ease: easeOut } },
    };

    return (<AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4">
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="hidden" className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose}/>
          
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="relative w-full max-w-2xl bg-[#0D1626] border border-[#C9A227]/30 p-6 sm:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.7)] rounded-2xl max-h-[85vh] flex flex-col">
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="flex items-center border-b border-white/10 pb-4 mb-6 flex-shrink-0">
              <button type="submit" aria-label="Execute Search" className="material-symbols-outlined text-primary mr-4 hover:brightness-125 cursor-pointer border-none bg-transparent outline-none text-2xl">search</button>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search books, authors, or reflections (e.g. Harry, Gatsby, Sanctuary)..."
                className="w-full bg-transparent border-none outline-none font-display text-lg sm:text-xl text-white placeholder-white/30"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-white/40 hover:text-white mr-3 transition-colors text-xs font-display uppercase tracking-wider">
                  Clear
                </button>
              )}
              <button type="button" onClick={onClose} aria-label="Close search modal" className="text-white/50 hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </form>

            {/* LIVE MATCHING SEARCH RESULTS */}
            {cleanQuery ? (
              <div className="space-y-6 overflow-y-auto pr-1 flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[10px] tracking-[0.2em] text-[#C9A227] uppercase font-semibold">
                    Matching Results ({totalCount} Found)
                  </h3>
                  {isSearching && (
                    <span className="text-[10px] text-[#C9A227] font-display animate-pulse uppercase tracking-wider">
                      Searching Archives & Reflections...
                    </span>
                  )}
                </div>

                {/* BOOKS MATCHES */}
                {bookResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-display text-[9px] tracking-[0.15em] text-white/50 uppercase font-semibold flex items-center gap-2">
                      <span>📖 Books ({bookResults.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {bookResults.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => handleSearchSubmit(book.title)}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#07111F]/80 hover:bg-[#C9A227]/15 border border-white/5 hover:border-[#C9A227]/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            {book.coverImage ? (
                              <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0 border border-white/10" />
                            ) : (
                              <div className="w-10 h-14 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white/30 text-xs flex-shrink-0 font-display">📖</div>
                            )}
                            <div>
                              <h4 className="font-display text-sm text-[#F7F5EE] group-hover:text-[#C9A227] transition-colors font-medium">
                                {book.title}
                              </h4>
                              <p className="font-body text-xs text-white/50">
                                by {book.author || "AVELIS Press"} • <span className="text-[#C9A227]/80">{book.category || "General"}</span>
                              </p>
                            </div>
                          </div>
                          <span className="font-display text-[10px] tracking-widest text-[#C9A227] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            View Book →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REFLECTIONS MATCHES */}
                {reflectionResults.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-display text-[9px] tracking-[0.15em] text-white/50 uppercase font-semibold flex items-center gap-2">
                      <span>✍️ Reader Reflections & Journal Entries ({reflectionResults.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {reflectionResults.map((ref) => (
                        <div
                          key={ref.id}
                          onClick={() => handleReflectionClick(ref)}
                          className="p-3.5 rounded-lg bg-[#07111F]/80 hover:bg-[#C9A227]/15 border border-white/5 hover:border-[#C9A227]/40 transition-all cursor-pointer group space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-display text-sm text-[#F7F5EE] group-hover:text-[#C9A227] transition-colors font-medium">
                              {ref.title}
                            </h4>
                            <span className="font-display text-[9px] text-[#C9A227] uppercase">
                              Journal Entry
                            </span>
                          </div>
                          {ref.content && (
                            <p className="font-body text-xs text-white/60 line-clamp-2 italic">
                              "{ref.content}"
                            </p>
                          )}
                          <p className="font-display text-[9px] text-white/40 tracking-wider">
                            By {ref.authorName} {ref.bookTitle ? `• On "${ref.bookTitle}"` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalCount === 0 && !isSearching && (
                  <div className="text-center py-8 space-y-2">
                    <p className="font-display text-sm text-white/60">
                      No books or reflections found matching "{query}".
                    </p>
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="text-xs font-display tracking-wider text-[#C9A227] uppercase hover:underline cursor-pointer"
                    >
                      Press Enter to search entire catalog
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <motion.h3 variants={itemVariants} className="font-display text-[10px] tracking-widest text-primary uppercase mb-4">Popular Searches</motion.h3>
                  <div className="space-y-3">
                    {["Harry Potter", "1984", "Classics", "Dystopian"].map((item, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        onClick={() => handleSearchSubmit(item)}
                        className="text-sm text-white/70 hover:text-primary cursor-pointer transition-colors"
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <motion.h3 variants={itemVariants} className="font-display text-[10px] tracking-widest text-primary uppercase mb-4">Quick Volumes</motion.h3>
                  <div className="space-y-3">
                    {["The Great Gatsby", "Pride and Prejudice", "The Hobbit"].map((item, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        onClick={() => handleSearchSubmit(item)}
                        className="text-sm text-white/70 hover:text-primary cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[14px] text-white/30">history</span>
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>)}
    </AnimatePresence>);
};
