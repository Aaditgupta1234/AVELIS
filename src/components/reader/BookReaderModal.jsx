import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, BookOpen, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";

export const BookReaderModal = ({ isOpen, onClose, book }) => {
  const [zoom, setZoom] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !book) return null;

  const totalPages = book.totalPages || 48;
  const pdfSource = book.pdfUrl || `https://mozilla.github.io/pdf.js/web/viewer.html?file=https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
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
          <div className="bg-[#0D1626] border-b border-[rgba(201,162,39,0.15)] px-6 py-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
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
              <span className="font-display text-[10px] tracking-[0.15em] text-[#F7F5EE]/80">
                Page {currentPage} of {totalPages}
              </span>
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
              <span className="font-display text-[10px] text-[#C9A227] font-semibold min-w-[36px] text-center">
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
          <div className="flex-1 bg-[#040A14] overflow-auto flex items-center justify-center p-4 sm:p-8 relative">
            <div
              className="bg-[#0D1626] border border-[rgba(201,162,39,0.2)] rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-200 flex flex-col overflow-hidden"
              style={{
                width: `${Math.round(800 * (zoom / 100))}px`,
                minHeight: `${Math.round(1050 * (zoom / 100))}px`,
              }}
            >
              {book.pdfUrl ? (
                /* PDF File Viewer */
                <iframe
                  src={pdfSource}
                  title={`PDF Reader - ${book.title}`}
                  className="w-full flex-1 border-none min-h-[700px]"
                />
              ) : (
                /* Interactive Digital Book Reader */
                <div className="p-8 sm:p-12 space-y-6 flex-1 flex flex-col justify-between text-[#F7F5EE]/90">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgba(201,162,39,0.15)] pb-3">
                      <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                        AVELIS DIGITAL ARCHIVE • VOLUME READER
                      </span>
                      <span className="font-display text-[9px] text-[#F7F5EE]/40 uppercase">
                        CHAPTER {Math.ceil(currentPage / 5)}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl text-[#F7F5EE] tracking-wide pt-2">
                      {book.title}
                    </h2>
                    <p className="font-body text-xs text-[#C9A227] italic">
                      by {book.author || "Archival Author"}
                    </p>
                  </div>

                  {/* Sample Paginated Book Content */}
                  <div className="space-y-4 font-body text-sm sm:text-base leading-relaxed text-[#F7F5EE]/80 flex-1">
                    <p className="first-letter:text-4xl first-letter:font-display first-letter:text-[#C9A227] first-letter:mr-2 first-letter:float-left">
                      {book.description ||
                        "A sanctuary not for the collection of bindings, but for the cultivation of the mind. In this work, the author explores the timeless themes of human curiosity, scientific rigor, and philosophical clarity across eras."}
                    </p>

                    <p className="pt-2">
                      As we advance deeper into page {currentPage}, the text illuminates key perspectives on archival history and digital literature. Every section provides structured insight into classical literature and modern thought.
                    </p>

                    <blockquote className="border-l-2 border-[#C9A227]/40 pl-4 py-2 italic text-[#C9A227]/90 font-display text-sm my-6 bg-[#C9A227]/5 rounded-r">
                      "Books are a uniquely portable magic. Within these digital bindings lie centuries of preserved wisdom."
                    </blockquote>

                    <p>
                      The journey of reading is an ongoing dialogue between author and reader. Continuing from page {currentPage}, the narrative deepens into new layers of exploration and reflection.
                    </p>
                  </div>

                  {/* Reader Footer */}
                  <div className="pt-6 border-t border-[rgba(201,162,39,0.12)] flex justify-between items-center text-[10px] font-display tracking-widest text-[#F7F5EE]/40">
                    <span>ISBN: {book.isbn || "N/A"}</span>
                    <span>AVELIS DIGITAL CODEX</span>
                    <span>{currentPage} / {totalPages}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
