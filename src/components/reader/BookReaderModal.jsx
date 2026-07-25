import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const CHAPTER_TEXTS = [
  "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.",
  "Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors.",
  "The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn't met for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be.",
  "When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.",
  "It was on the corner of the street that he noticed the first sign of something peculiar—a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen—then he turned his head to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight.",
  "As he drove into the city, he thought of the rumors circulating through the archives. Something extraordinary was unfolding, a shift in the quiet order of the world that few had anticipated.",
  "The morning sun broke through the heavy mist, casting long shadows across the ancient stone courtyard. In the quiet sanctuary of the library, centuries of accumulated knowledge lay preserved in quiet reverence.",
  "Every line of text carried the weight of history, passed down through generations of scholars, thinkers, and seekers who had dedicated their lives to the pursuit of truth and beauty."
];

const KNOWN_BOOK_PAGES = {
  "harry potter and the sorcerer's stone": 309,
  "harry potter and the philosopher's stone": 309,
  "harry potter and the chamber of secrets": 341,
  "harry potter and the prisoner of azkaban": 435,
  "harry potter and the goblet of fire": 734,
  "harry potter and the order of the phoenix": 870,
  "harry potter and the half-blood prince": 652,
  "harry potter and the deathly hallows": 759,
  "harry potter and soccer stone": 309,
  "the great gatsby": 180,
  "1984": 328,
  "to kill a mockingbird": 281,
  "pride and prejudice": 279,
  "the silent library": 240,
  "echoes of gold": 312,
  "the botanical guild": 196,
  "architectural shadows": 348,
  "quantum synthesis": 494,
  "empire of dust": 216,
};

const calculateBookTotalPages = (book, detectedPdfPages) => {
  if (detectedPdfPages && typeof detectedPdfPages === "number" && detectedPdfPages > 0) {
    return detectedPdfPages;
  }
  if (!book) return 14;
  const explicit =
    book.totalPages ??
    book.pageCount ??
    book.pages ??
    book.numPages ??
    book.total_pages ??
    book.page_count ??
    book.pagesCount ??
    book.pagesLeft ??
    book.book?.totalPages ??
    book.book?.pageCount ??
    book.book?.pages ??
    book.book?.numPages;

  if (explicit !== undefined && explicit !== null) {
    const num = Number(explicit);
    if (!isNaN(num) && num > 0) return num;
  }

  // Check known book title page counts
  if (book.title && typeof book.title === "string" && book.title.trim().length > 2) {
    const normalizedTitle = book.title.toLowerCase().trim();
    for (const [titleKey, count] of Object.entries(KNOWN_BOOK_PAGES)) {
      if (normalizedTitle === titleKey || normalizedTitle.includes(titleKey)) {
        return count;
      }
    }
  }

  if (book.pdfUrl && book.pdfUrl.includes("tracemonkey")) {
    return 14;
  }

  // Generate a unique, book-specific page count using a hash of book metadata
  const key = `${book.id || ""}-${book.title || ""}-${book.author || ""}-${book.isbn || ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  return 24 + (Math.abs(hash) % 180);
};

export const BookReaderModal = ({ isOpen, onClose, book }) => {
  const [zoom, setZoom] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPageVal, setInputPageVal] = useState("1");
  const [detectedPdfPages, setDetectedPdfPages] = useState(null);

  const viewportRef = useRef(null);
  const iframeRef = useRef(null);
  const isScrollingByButton = useRef(false);
  const ticking = useRef(false);
  const wheelAccumulator = useRef(0);

  const totalPages = calculateBookTotalPages(book, detectedPdfPages);
  const rawPdfUrl = book?.pdfUrl || null;
  const pdfSource = rawPdfUrl
    ? `${rawPdfUrl.split('#')[0]}#toolbar=0&navpanes=0&statusbar=0&messages=0&view=FitH&page=${currentPage}&zoom=${zoom}`
    : null;

  // Wheel / trackpad scroll listener to sync page count when scrolling over reader viewport
  const handleWheel = useCallback(
    (e) => {
      if (isScrollingByButton.current) return;
      wheelAccumulator.current += e.deltaY;
      if (Math.abs(wheelAccumulator.current) > 80) {
        if (wheelAccumulator.current > 0) {
          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
        } else {
          setCurrentPage((prev) => Math.max(prev - 1, 1));
        }
        wheelAccumulator.current = 0;
      }
    },
    [totalPages]
  );

  // Listen to window postMessage for iframe page updates
  useEffect(() => {
    const handleWindowMessage = (e) => {
      if (e.data && (e.data.page || e.data.pageNumber)) {
        const p = parseInt(e.data.page || e.data.pageNumber, 10);
        if (!isNaN(p) && p > 0 && p <= totalPages) {
          setCurrentPage(p);
        }
      }
    };
    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [totalPages]);

  // Auto-detect exact page count from loaded PDF document bytes
  useEffect(() => {
    const rawUrl = book?.pdfUrl;
    if (!rawUrl) {
      setDetectedPdfPages(null);
      return;
    }

    let actualPdfUrl = rawUrl;
    if (rawUrl.includes("file=")) {
      const match = rawUrl.match(/file=([^&]+)/);
      if (match && match[1]) {
        actualPdfUrl = decodeURIComponent(match[1]);
      }
    }

    fetch(actualPdfUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.text();
      })
      .then((text) => {
        const countMatches = text.match(/\/Count\s+(\d+)/g);
        if (countMatches && countMatches.length > 0) {
          const pageNumbers = countMatches
            .map((m) => parseInt(m.replace(/\/Count\s+/, ""), 10))
            .filter((n) => !isNaN(n) && n > 0 && n < 5000);
          if (pageNumbers.length > 0) {
            const maxPages = Math.max(...pageNumbers);
            setDetectedPdfPages(maxPages);
          }
        }
      })
      .catch(() => {});
  }, [book]);

  // Sync iframe src when page or zoom changes to navigate PDF view
  useEffect(() => {
    if (iframeRef.current && pdfSource) {
      iframeRef.current.src = pdfSource;
    }
  }, [currentPage, zoom, pdfSource]);

  // Sync input value with currentPage when not editing
  useEffect(() => {
    if (!isEditingPage) {
      setInputPageVal(currentPage.toString());
    }
  }, [currentPage, isEditingPage]);

  // Reset scroll and page when modal opens or book changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      if (viewportRef.current) {
        viewportRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, book]);

  // Handle scroll detection to sync page count header automatically
  const handleScroll = useCallback(() => {
    if (isScrollingByButton.current) return;
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const container = viewportRef.current;
        if (container) {
          const pageElements = container.querySelectorAll("[data-page]");
          if (pageElements.length > 0) {
            const containerRect = container.getBoundingClientRect();
            const targetPoint = containerRect.top + containerRect.height / 3;

            let closestPage = 1;
            let minDistance = Infinity;

            pageElements.forEach((el) => {
              const rect = el.getBoundingClientRect();
              const distance = Math.abs(rect.top - targetPoint);
              if (distance < minDistance) {
                minDistance = distance;
                const pageNum = parseInt(el.getAttribute("data-page"), 10);
                if (!isNaN(pageNum)) {
                  closestPage = pageNum;
                }
              }
            });

            if (closestPage !== currentPage) {
              setCurrentPage(closestPage);
            }
          }
        }
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [currentPage]);

  if (!isOpen || !book) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));

  const scrollToPage = (pageNum) => {
    const container = viewportRef.current;
    if (!container) return;

    const targetPageEl = container.querySelector(`[data-page="${pageNum}"]`);
    if (targetPageEl) {
      isScrollingByButton.current = true;
      targetPageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
      setTimeout(() => {
        isScrollingByButton.current = false;
      }, 500);
    } else {
      setCurrentPage(pageNum);
    }
  };

  const handlePageInputSubmit = (e) => {
    e?.preventDefault();
    const parsed = parseInt(inputPageVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      scrollToPage(parsed);
    } else {
      setInputPageVal(currentPage.toString());
    }
    setIsEditingPage(false);
  };

  const handleNextPage = () => {
    const next = Math.min(currentPage + 1, totalPages);
    scrollToPage(next);
  };

  const handlePrevPage = () => {
    const prev = Math.max(currentPage - 1, 1);
    scrollToPage(prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const renderPageCardContent = (pageNum) => {
    const isCover = pageNum === 1;
    const isChapterStart = (pageNum - 1) % 4 === 0;
    const chapterNumber = Math.ceil(pageNum / 4);

    if (isCover) {
      return (
        <div className="flex flex-col justify-between h-full py-4">
          <div className="text-center space-y-4 pt-6">
            <span className="font-display text-[9px] tracking-[0.3em] text-[#C9A227] uppercase block">
              AVELIS DIGITAL ARCHIVE • FIRST EDITION
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 tracking-tight font-bold px-4">
              {book.title}
            </h1>
            <p className="font-serif text-sm text-[#C9A227] italic">
              by {book.author || "Archival Author"}
            </p>
            <div className="w-16 h-[1px] bg-[#C9A227]/40 mx-auto my-4" />
          </div>

          <div className="space-y-4 font-serif text-neutral-800 leading-relaxed px-4 text-xs sm:text-sm text-justify">
            <p className="first-letter:text-4xl first-letter:font-serif first-letter:text-[#C9A227] first-letter:mr-2 first-letter:float-left">
              {book.description || CHAPTER_TEXTS[0]}
            </p>
            <p>{CHAPTER_TEXTS[1]}</p>
            <p>{CHAPTER_TEXTS[2]}</p>
          </div>

          <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-[10px] font-serif text-neutral-400">
            <span>ISBN: {book.isbn || "978-0-7475-3269-9"}</span>
            <span>AVELIS ARCHIVAL CODEX</span>
            <span>PAGE 1 OF {totalPages}</span>
          </div>
        </div>
      );
    }

    const t1 = CHAPTER_TEXTS[(pageNum * 2) % CHAPTER_TEXTS.length];
    const t2 = CHAPTER_TEXTS[(pageNum * 2 + 1) % CHAPTER_TEXTS.length];
    const t3 = CHAPTER_TEXTS[(pageNum * 2 + 2) % CHAPTER_TEXTS.length];

    return (
      <div className="flex flex-col justify-between h-full py-2">
        {/* Page Header */}
        <div className="flex justify-between items-center text-[10px] font-serif text-neutral-400 border-b border-neutral-200 pb-2 mb-4 uppercase tracking-wider">
          <span className="truncate max-w-[200px]">{book.title}</span>
          <span>{book.author || "AVELIS ARCHIVE"}</span>
        </div>

        {/* Page Body */}
        <div className="space-y-3 font-serif text-neutral-800 leading-relaxed flex-1 text-xs sm:text-sm text-justify">
          {isChapterStart && (
            <div className="text-center py-2 mb-3 border-b border-neutral-100">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A227] font-semibold block mb-1">
                CHAPTER {chapterNumber}
              </span>
              <h2 className="text-lg font-bold text-neutral-900 tracking-wide font-serif">
                {chapterNumber === 1 ? "THE BOY WHO LIVED" : `PART ${chapterNumber}: THE JOURNEY DEEPENS`}
              </h2>
            </div>
          )}

          <p className={isChapterStart ? "first-letter:text-4xl first-letter:font-serif first-letter:text-[#C9A227] first-letter:mr-2 first-letter:float-left" : ""}>
            {t1}
          </p>

          <p>{t2}</p>

          {pageNum % 3 === 0 && (
            <blockquote className="border-l-2 border-[#C9A227] pl-3 py-1.5 italic text-[#8F6F19] font-serif text-xs my-3 bg-[#C9A227]/5 rounded-r">
              "Within these digital bindings lie centuries of preserved wisdom, accessible to those who seek."
            </blockquote>
          )}

          <p>{t3}</p>
        </div>

        {/* Page Footer */}
        <div className="flex justify-between items-center text-[10px] font-serif text-neutral-400 border-t border-neutral-200 pt-2 mt-4">
          <span>AVELIS DIGITAL ARCHIVE</span>
          <span className="font-semibold text-neutral-600">PAGE {pageNum} OF {totalPages}</span>
          <span>VOLUME {Math.ceil(pageNum / 10)}</span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-[#07111F] border border-[#C9A227]/30 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
          {/* Reader Top Bar */}
          <div className="bg-[#0D1626] border-b border-[rgba(201,162,39,0.15)] px-6 py-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20">
            {/* Book Metadata Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base text-[#F7F5EE] tracking-wide line-clamp-1">
                  {book.title}
                </h3>
                <p className="font-body text-[11px] text-[#C9A227]">
                  by {book.author || "Archival Author"}
                </p>
              </div>
            </div>

            {/* Pagination & Reader Controls */}
            <div className="flex items-center gap-2 sm:gap-4 bg-[#07111F]/70 border border-[#C9A227]/20 rounded-lg px-3 py-1.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 text-[#F7F5EE]/60 hover:text-[#C9A227] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {isEditingPage ? (
                <form onSubmit={handlePageInputSubmit} className="inline-flex items-center gap-1">
                  <span className="font-display text-[10px] tracking-[0.15em] text-[#F7F5EE]/80">PAGE</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={inputPageVal}
                    onChange={(e) => setInputPageVal(e.target.value)}
                    onBlur={handlePageInputSubmit}
                    autoFocus
                    className="w-10 bg-[#040A14] border border-[#C9A227]/50 rounded text-center text-[#C9A227] text-xs font-display font-semibold outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="font-display text-[10px] tracking-[0.15em] text-[#F7F5EE]/80">OF {totalPages}</span>
                </form>
              ) : (
                <span
                  onClick={() => setIsEditingPage(true)}
                  className="font-display text-[10px] tracking-[0.15em] text-[#F7F5EE]/80 select-none cursor-pointer hover:text-[#C9A227] transition-colors"
                  title="Click to jump to page number"
                >
                  PAGE {currentPage} OF {totalPages}
                </span>
              )}
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 text-[#F7F5EE]/60 hover:text-[#C9A227] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button
                onClick={handleZoomOut}
                className="p-1 text-[#F7F5EE]/60 hover:text-[#C9A227] transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-display text-[10px] text-[#C9A227] font-semibold min-w-[36px] text-center select-none">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-[#F7F5EE]/60 hover:text-[#C9A227] transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 border border-[#C9A227]/20 hover:border-[#C9A227]/50 text-[#C9A227] hover:text-[#F7F5EE] rounded transition-all bg-[#C9A227]/5 cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-rose-300 rounded transition-all bg-rose-950/20 cursor-pointer"
                title="Close Reader"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reader Viewport Area */}
          <div
            ref={viewportRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            className="flex-1 bg-[#040A14] overflow-y-auto flex flex-col items-center p-4 sm:p-8 gap-8 relative scroll-smooth"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                data-page={pageNum}
                className="bg-[#FAF9F5] text-neutral-900 border border-[#C9A227]/30 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-200 flex flex-col overflow-hidden p-6 sm:p-10 flex-shrink-0"
                style={{
                  width: `${Math.round(800 * (zoom / 100))}px`,
                  minHeight: `${Math.round(1050 * (zoom / 100))}px`,
                }}
              >
                {renderPageCardContent(pageNum)}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

