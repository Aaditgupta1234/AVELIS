import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, BookOpen, ChevronLeft, ChevronRight, Pencil, Trash2, StickyNote, Highlighter, Eraser, Undo2, Redo2, Type, AlignLeft, ExternalLink } from "lucide-react";

const PageCanvasOverlay = ({
  pageNum,
  activeTool,
  penColor,
  penWidth,
  inkOpacity = 35,
  highlightMode = "word",
  annotations,
  onAddStroke,
  onEraseStroke,
}) => {
  const canvasRef = useRef(null);
  const isPointerDown = useRef(false);
  const currentStrokeRef = useRef(null);
  const animFrameId = useRef(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const pageStrokes = annotations[pageNum] || [];
    const allStrokes = currentStrokeRef.current
      ? [...pageStrokes, currentStrokeRef.current]
      : pageStrokes;

    allStrokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.save();
      ctx.beginPath();

      const scale = width / 800;
      const baseWidth = (stroke.width || 3) * scale;

      if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color || "#FDE047";
        ctx.globalAlpha = (stroke.opacity || 35) / 100;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (stroke.mode === "line") {
          ctx.lineWidth = Math.max(26 * scale, baseWidth * 6);
        } else {
          ctx.lineWidth = Math.max(12 * scale, baseWidth * 3);
        }
      } else {
        // Pen tool
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color || "#C9A227";
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = baseWidth * 1.8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      const pts = stroke.points;
      if (pts.length === 1) {
        const x = pts[0].x * width;
        const y = pts[0].y * height;
        ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(pts[0].x * width, pts[0].y * height);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x * width + pts[i + 1].x * width) / 2;
          const yc = (pts[i].y * height + pts[i + 1].y * height) / 2;
          ctx.quadraticCurveTo(pts[i].x * width, pts[i].y * height, xc, yc);
        }
        ctx.lineTo(
          pts[pts.length - 1].x * width,
          pts[pts.length - 1].y * height
        );
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [pageNum, annotations]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const handleResize = () => {
      renderCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas]);

  const getNormalizedPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const performEraserHitTest = (normPos) => {
    const pageStrokes = annotations[pageNum] || [];
    if (pageStrokes.length === 0) return;

    const eraserThreshold = 0.04;
    let strokeErased = false;

    for (let i = pageStrokes.length - 1; i >= 0; i--) {
      const stroke = pageStrokes[i];
      const pts = stroke.points || [];
      for (let j = 0; j < pts.length - 1; j++) {
        const dist = distanceToSegment(
          normPos.x,
          normPos.y,
          pts[j].x,
          pts[j].y,
          pts[j + 1].x,
          pts[j + 1].y
        );
        if (dist < eraserThreshold) {
          onEraseStroke(pageNum, stroke.id);
          strokeErased = true;
          break;
        }
      }
      if (strokeErased) break;
    }
  };

  const handlePointerDown = (e) => {
    if (activeTool === "none") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isPointerDown.current = true;
    const pos = getNormalizedPos(e);

    if (activeTool === "eraser") {
      performEraserHitTest(pos);
      return;
    }

    currentStrokeRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tool: activeTool,
      color: activeTool === "highlighter" ? penColor || "#FDE047" : penColor || "#C9A227",
      width: penWidth,
      opacity: activeTool === "highlighter" ? inkOpacity : 100,
      mode: highlightMode,
      points: [pos],
    };

    renderCanvas();
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown.current || activeTool === "none") return;
    const pos = getNormalizedPos(e);

    if (activeTool === "eraser") {
      performEraserHitTest(pos);
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(pos);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      animFrameId.current = requestAnimationFrame(() => {
        renderCanvas();
      });
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (currentStrokeRef.current && activeTool !== "eraser") {
      const finishedStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;
      onAddStroke(pageNum, finishedStroke);
    }
  };

  const getCursorStyle = () => {
    if (activeTool === "none") return "pointer-events-none";
    if (activeTool === "pen") return "cursor-crosshair pointer-events-auto";
    if (activeTool === "highlighter") return "cursor-crosshair pointer-events-auto";
    if (activeTool === "eraser") return "cursor-pointer pointer-events-auto";
    return "pointer-events-none";
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`absolute inset-0 w-full h-full z-20 ${getCursorStyle()}`}
    />
  );
};

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
  const [zoom, setZoom] = useState(75);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPageVal, setInputPageVal] = useState("1");
  const [detectedPdfPages, setDetectedPdfPages] = useState(null);

  // Annotation & Highlighting State
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState("#FDE047");
  const [pageNotes, setPageNotes] = useState({});

  // Canvas Freehand Vector Drawing State
  const [activeTool, setActiveTool] = useState("none"); // 'pen' | 'highlighter' | 'eraser' | 'none'
  const [penColor, setPenColor] = useState("#C9A227");
  const [penWidth, setPenWidth] = useState(3);
  const [inkOpacity, setInkOpacity] = useState(35);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightMode, setHighlightMode] = useState("word"); // 'word' | 'line'

  // Vector Annotations Data Model: { [pageNumber]: [ { id, tool, color, width, opacity, mode, points } ] }
  const [annotations, setAnnotations] = useState(() => {
    if (book?.id) {
      try {
        const saved = localStorage.getItem(`avelis_annotations_${book.id}`);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return {};
  });

  // Per-page Undo and Redo Stack history
  const [undoStack, setUndoStack] = useState({});
  const [redoStack, setRedoStack] = useState({});

  // Restore & Save Annotations per Book ID
  useEffect(() => {
    if (book?.id) {
      try {
        const saved = localStorage.getItem(`avelis_annotations_${book.id}`);
        if (saved) {
          setAnnotations(JSON.parse(saved));
        } else {
          setAnnotations({});
        }
      } catch (_) {}
      setUndoStack({});
      setRedoStack({});
    }
  }, [book?.id]);

  useEffect(() => {
    if (book?.id) {
      try {
        localStorage.setItem(`avelis_annotations_${book.id}`, JSON.stringify(annotations));
      } catch (_) {}
    }
  }, [annotations, book?.id]);

  // Push current page state to Undo Stack
  const pushToUndo = useCallback(
    (pageNum) => {
      setUndoStack((prev) => {
        const pageUndo = prev[pageNum] || [];
        const currentStrokes = annotations[pageNum] || [];
        return {
          ...prev,
          [pageNum]: [...pageUndo, JSON.parse(JSON.stringify(currentStrokes))],
        };
      });
      setRedoStack((prev) => ({ ...prev, [pageNum]: [] }));
    },
    [annotations]
  );

  // Add new stroke
  const handleAddStroke = useCallback(
    (pageNum, stroke) => {
      pushToUndo(pageNum);
      setAnnotations((prev) => {
        const pageStrokes = prev[pageNum] || [];
        return {
          ...prev,
          [pageNum]: [...pageStrokes, stroke],
        };
      });
    },
    [pushToUndo]
  );

  // Erase stroke
  const handleEraseStroke = useCallback(
    (pageNum, strokeId) => {
      pushToUndo(pageNum);
      setAnnotations((prev) => {
        const pageStrokes = prev[pageNum] || [];
        return {
          ...prev,
          [pageNum]: pageStrokes.filter((s) => s.id !== strokeId),
        };
      });
    },
    [pushToUndo]
  );

  // Undo action
  const handleUndo = (pageNum) => {
    const targetPage = pageNum || currentPage;
    const pageUndo = undoStack[targetPage] || [];
    if (pageUndo.length === 0) return;

    const previousState = pageUndo[pageUndo.length - 1];
    const newUndo = pageUndo.slice(0, pageUndo.length - 1);

    setRedoStack((prev) => ({
      ...prev,
      [targetPage]: [...(prev[targetPage] || []), JSON.parse(JSON.stringify(annotations[targetPage] || []))],
    }));

    setUndoStack((prev) => ({
      ...prev,
      [targetPage]: newUndo,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [targetPage]: previousState,
    }));
  };

  // Redo action
  const handleRedo = (pageNum) => {
    const targetPage = pageNum || currentPage;
    const pageRedo = redoStack[targetPage] || [];
    if (pageRedo.length === 0) return;

    const nextState = pageRedo[pageRedo.length - 1];
    const newRedo = pageRedo.slice(0, pageRedo.length - 1);

    setUndoStack((prev) => ({
      ...prev,
      [targetPage]: [...(prev[targetPage] || []), JSON.parse(JSON.stringify(annotations[targetPage] || []))],
    }));

    setRedoStack((prev) => ({
      ...prev,
      [targetPage]: newRedo,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [targetPage]: nextState,
    }));
  };

  // Clear page drawings
  const handleClearPage = (pageNum) => {
    const targetPage = pageNum || currentPage;
    const pageStrokes = annotations[targetPage] || [];
    if (pageStrokes.length === 0) return;

    if (window.confirm(`Are you sure you want to clear all drawings and highlights on Page ${targetPage}?`)) {
      pushToUndo(targetPage);
      setAnnotations((prev) => ({
        ...prev,
        [targetPage]: [],
      }));
    }
  };

  const viewportRef = useRef(null);
  const iframeRef = useRef(null);
  const isScrollingByButton = useRef(false);
  const ticking = useRef(false);
  const wheelAccumulator = useRef(0);

  const totalPages = calculateBookTotalPages(book, detectedPdfPages);

  const addNoteToPage = (pageNum) => {
    const newNote = {
      id: Date.now(),
      text: "",
      color: activeHighlightColor,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPageNotes((prev) => ({
      ...prev,
      [pageNum]: [...(prev[pageNum] || []), newNote],
    }));
  };

  const updateNoteText = (pageNum, noteId, newText) => {
    setPageNotes((prev) => ({
      ...prev,
      [pageNum]: (prev[pageNum] || []).map((note) =>
        note.id === noteId ? { ...note, text: newText } : note
      ),
    }));
  };

  const deleteNoteFromPage = (pageNum, noteId) => {
    setPageNotes((prev) => ({
      ...prev,
      [pageNum]: (prev[pageNum] || []).filter((note) => note.id !== noteId),
    }));
  };

  const clearCurrentPageNotes = () => {
    setPageNotes((prev) => ({
      ...prev,
      [currentPage]: [],
    }));
  };
  const rawPdfUrl = book?.pdfUrl || null;
  const pdfSource = rawPdfUrl
    ? `${rawPdfUrl.split('#')[0]}#toolbar=0&navpanes=0&statusbar=0&messages=0&view=Fit&page=${currentPage}`
    : null;

  // Wheel / trackpad scroll listener to allow smooth scrolling and sync page count at boundaries
  const handleWheel = useCallback(
    (e) => {
      if (isScrollingByButton.current) return;
      const container = viewportRef.current;
      if (!container) return;

      const isAtTop = container.scrollTop <= 2;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;

      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        wheelAccumulator.current += e.deltaY;
        if (Math.abs(wheelAccumulator.current) > 350) {
          if (wheelAccumulator.current > 0) {
            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
          } else {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
          }
          wheelAccumulator.current = 0;
        }
      } else {
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
    setDetectedPdfPages(null);
    const rawUrl = book?.pdfUrl;
    if (!rawUrl) {
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
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
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
          if (counts.length > 0) {
            setDetectedPdfPages(Math.max(...counts));
            return;
          }
        }

        const pageObjMatches = binary.match(/\/Type\s*\/Page\b/g);
        if (pageObjMatches && pageObjMatches.length > 0) {
          setDetectedPdfPages(pageObjMatches.length);
          return;
        }

        const countMatches = binary.match(/\/Count\s+(\d+)/g);
        if (countMatches && countMatches.length > 0) {
          const pageNumbers = countMatches
            .map((m) => parseInt(m.replace(/\/Count\s+/, ""), 10))
            .filter((n) => !isNaN(n) && n > 0 && n < 5000);
          if (pageNumbers.length > 0) {
            setDetectedPdfPages(Math.max(...pageNumbers));
          }
        }
      })
      .catch(() => {});
  }, [book]);

  // Sync iframe src when page or zoom changes to navigate PDF view
  useEffect(() => {
    if (iframeRef.current && pdfSource) {
      try {
        iframeRef.current.contentWindow?.location?.replace(pdfSource);
      } catch (_) {
        iframeRef.current.src = pdfSource;
      }
    }
  }, [currentPage, zoom, pdfSource]);

  // Sync input value with currentPage when not editing
  useEffect(() => {
    if (!isEditingPage) {
      setInputPageVal(currentPage.toString());
    }
  }, [currentPage, isEditingPage]);

  // Reset scroll, active tools, and page when modal opens or book changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setActiveTool("none");
      setIsDropdownOpen(false);
      setIsAnnotating(false);
      document.body.style.overflow = "hidden";
      if (viewportRef.current) {
        viewportRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
          <div className="flex items-center gap-3">
            {isAnnotating && (
              <button
                onClick={() => addNoteToPage(pageNum)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#C9A227] text-[#07111F] font-display text-[9px] uppercase tracking-wider hover:bg-[#E5C16B] transition-all shadow-sm cursor-pointer"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>+ Add Note</span>
              </button>
            )}
            <span>{book.author || "AVELIS ARCHIVE"}</span>
          </div>
        </div>

        {/* Margin Notes Attached to Page */}
        {pageNotes[pageNum]?.length > 0 && (
          <div className="space-y-2 mb-4">
            {pageNotes[pageNum].map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-lg border bg-amber-50/90 text-neutral-900 font-serif text-xs shadow-sm relative transition-all"
                style={{
                  borderLeftColor: note.color || "#C9A227",
                  borderLeftWidth: "4px",
                  borderColor: "rgba(201,162,39,0.3)",
                }}
              >
                <div className="flex justify-between items-center mb-1 text-[9px] font-display uppercase tracking-wider text-[#8F6F19]">
                  <span className="flex items-center gap-1">
                    <Pencil className="w-2.5 h-2.5 text-[#C9A227]" />
                    Margin Note • {note.createdAt}
                  </span>
                  <button
                    onClick={() => deleteNoteFromPage(pageNum, note.id)}
                    className="text-rose-500 hover:text-rose-700 transition-colors p-0.5 cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={note.text}
                  onChange={(e) => updateNoteText(pageNum, note.id, e.target.value)}
                  placeholder="Write your note, highlight summary, or reflection..."
                  className="w-full bg-transparent border-none outline-none resize-none font-serif text-xs text-neutral-900 placeholder:text-neutral-400 leading-relaxed font-medium"
                  rows={2}
                  autoFocus={!note.text}
                />
              </div>
            ))}
          </div>
        )}

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-[#07111F] border border-[#C9A227]/30 rounded-none sm:rounded-xl w-full max-w-7xl h-full sm:h-[95vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
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
              <div className="relative">
                <button
                  onClick={() => {
                    if (isDropdownOpen) {
                      setIsDropdownOpen(false);
                      setActiveTool("none");
                      setIsAnnotating(false);
                    } else {
                      setIsDropdownOpen(true);
                      setIsAnnotating(true);
                    }
                  }}
                  className={`p-2 border rounded transition-all cursor-pointer flex items-center gap-2 px-3.5 ${
                    activeTool !== "none" || isDropdownOpen
                      ? "bg-[#C9A227] border-[#C9A227] text-[#07111F] font-semibold shadow-[0_0_15px_rgba(201,162,39,0.5)]"
                      : "border-[#C9A227]/30 hover:border-[#C9A227]/60 text-[#C9A227] hover:text-[#F7F5EE] bg-[#C9A227]/10"
                  }`}
                  title="Annotation Options: Pen, Highlight, Eraser"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="font-display text-[10px] uppercase tracking-wider hidden sm:inline">
                    {activeTool === "pen"
                      ? "Pen Mode"
                      : activeTool === "highlighter"
                      ? "Highlighter"
                      : activeTool === "eraser"
                      ? "Eraser"
                      : "Annotate / Highlight"}
                  </span>
                </button>

                {/* Dropdown Options Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-[#0D1626] border border-[#C9A227]/40 rounded-lg shadow-2xl p-4 z-50 text-xs font-display space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-white/10 pb-2 text-[10px] text-[#C9A227] uppercase tracking-wider font-semibold">
                        <span>Pen, Highlight & Eraser Tools</span>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setActiveTool("none");
                            setIsAnnotating(false);
                          }}
                          className="text-white/60 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tool Selectors */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setActiveTool("pen")}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded border transition-all cursor-pointer ${
                            activeTool === "pen"
                              ? "bg-[#C9A227] text-[#07111F] border-[#C9A227] font-semibold"
                              : "border-white/10 text-white/70 hover:border-[#C9A227]/40 hover:text-white"
                          }`}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-[9px] uppercase tracking-wider">Pen</span>
                        </button>

                        <button
                          onClick={() => setActiveTool("highlighter")}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded border transition-all cursor-pointer ${
                            activeTool === "highlighter"
                              ? "bg-yellow-400 text-[#07111F] border-yellow-400 font-semibold"
                              : "border-white/10 text-white/70 hover:border-yellow-400/40 hover:text-white"
                          }`}
                        >
                          <Highlighter className="w-4 h-4" />
                          <span className="text-[9px] uppercase tracking-wider">Highlight</span>
                        </button>

                        <button
                          onClick={() => setActiveTool("eraser")}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded border transition-all cursor-pointer ${
                            activeTool === "eraser"
                              ? "bg-rose-500 text-white border-rose-500 font-semibold"
                              : "border-white/10 text-white/70 hover:border-rose-500/40 hover:text-white"
                          }`}
                        >
                          <Eraser className="w-4 h-4" />
                          <span className="text-[9px] uppercase tracking-wider">Eraser</span>
                        </button>
                      </div>

                      {/* Color Picker (for Pen & Highlighter) */}
                      {activeTool !== "eraser" && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] text-white/50 uppercase tracking-wider block">Ink Color</span>
                          <div className="flex items-center gap-2">
                            {[
                              { color: "#C9A227", label: "Gold" },
                              { color: "#EF4444", label: "Red" },
                              { color: "#22C55E", label: "Green" },
                              { color: "#3B82F6", label: "Blue" },
                              { color: "#1E293B", label: "Dark" },
                            ].map((item) => (
                              <button
                                key={item.color}
                                onClick={() => setPenColor(item.color)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                                  penColor === item.color ? "border-white scale-110 shadow-md" : "border-transparent opacity-70"
                                }`}
                                style={{ backgroundColor: item.color }}
                                title={item.label}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stroke Size & Ink Opacity Controls */}
                      <div className="space-y-2 pt-1 border-t border-white/10">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-white/50 uppercase tracking-wider">
                            <span>Stroke Size</span>
                            <span className="text-[#C9A227] font-semibold">{penWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            value={penWidth}
                            onChange={(e) => setPenWidth(parseInt(e.target.value, 10))}
                            className="w-full accent-[#C9A227] cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-white/50 uppercase tracking-wider">
                            <span>Ink Opacity / Transparency</span>
                            <span className="text-[#C9A227] font-semibold">{inkOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={inkOpacity}
                            onChange={(e) => setInkOpacity(parseInt(e.target.value, 10))}
                            className="w-full accent-[#C9A227] cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Highlight Selection Target */}
                      {activeTool === "highlighter" && (
                        <div className="space-y-1.5 pt-1 border-t border-white/10">
                          <span className="text-[9px] text-white/50 uppercase tracking-wider block">Highlight Scope</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setHighlightMode("word")}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                                highlightMode === "word"
                                  ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227] font-semibold"
                                  : "border-white/10 text-white/60 hover:text-white"
                              }`}
                            >
                              <Type className="w-3.5 h-3.5" />
                              <span>Whole Word</span>
                            </button>

                            <button
                              onClick={() => setHighlightMode("line")}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                                highlightMode === "line"
                                  ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227] font-semibold"
                                  : "border-white/10 text-white/60 hover:text-white"
                              }`}
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                              <span>Entire Line</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Undo & Redo Actions */}
                      <div className="space-y-1.5 pt-1 border-t border-white/10">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider block">Canvas Actions</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUndo(currentPage)}
                            className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded border border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10 text-[9px] uppercase tracking-wider cursor-pointer"
                            title="Undo Stroke"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </button>

                          <button
                            onClick={() => handleRedo(currentPage)}
                            className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded border border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10 text-[9px] uppercase tracking-wider cursor-pointer"
                            title="Redo Stroke"
                          >
                            <Redo2 className="w-3.5 h-3.5" />
                            <span>Redo</span>
                          </button>
                        </div>
                      </div>

                      {/* Clear Actions */}
                      <div className="pt-2 border-t border-white/10 flex justify-between gap-2">
                        <button
                          onClick={() => handleClearPage(currentPage)}
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-950/30 text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Page Drawings</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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

          {/* Floating Annotation Toolbar */}
          <AnimatePresence>
            {isAnnotating && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0D1626] border-b border-[rgba(201,162,39,0.2)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20 text-xs font-display flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#C9A227] text-[10px] tracking-widest uppercase flex items-center gap-1.5 font-semibold">
                    <Highlighter className="w-3.5 h-3.5" />
                    Highlighter & Margin Notes Tool
                  </span>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#F7F5EE]/60 uppercase">Color:</span>
                    <button
                      onClick={() => setActiveHighlightColor("#FDE047")}
                      className={`w-5 h-5 rounded-full bg-yellow-300 border-2 transition-transform cursor-pointer ${
                        activeHighlightColor === "#FDE047" ? "border-white scale-110 shadow-sm" : "border-transparent opacity-60"
                      }`}
                      title="Yellow Highlighter"
                    />
                    <button
                      onClick={() => setActiveHighlightColor("#86EFAC")}
                      className={`w-5 h-5 rounded-full bg-emerald-300 border-2 transition-transform cursor-pointer ${
                        activeHighlightColor === "#86EFAC" ? "border-white scale-110 shadow-sm" : "border-transparent opacity-60"
                      }`}
                      title="Green Highlighter"
                    />
                    <button
                      onClick={() => setActiveHighlightColor("#93C5FD")}
                      className={`w-5 h-5 rounded-full bg-sky-300 border-2 transition-transform cursor-pointer ${
                        activeHighlightColor === "#93C5FD" ? "border-white scale-110 shadow-sm" : "border-transparent opacity-60"
                      }`}
                      title="Blue Highlighter"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 border border-white/10 rounded p-0.5 bg-black/20">
                    <button
                      onClick={() => handleUndo(currentPage)}
                      className="p-1 text-[#C9A227] hover:text-white transition-colors cursor-pointer"
                      title="Undo Page Drawing"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRedo(currentPage)}
                      className="p-1 text-[#C9A227] hover:text-white transition-colors cursor-pointer"
                      title="Redo Page Drawing"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-[1px] h-4 bg-white/10" />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHighlightMode("word")}
                      className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                        highlightMode === "word" ? "bg-[#C9A227] text-[#07111F] font-semibold" : "text-white/60 hover:text-white"
                      }`}
                      title="Highlight Whole Word on selection"
                    >
                      <Type className="w-3 h-3" />
                      <span>Word</span>
                    </button>
                    <button
                      onClick={() => setHighlightMode("line")}
                      className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                        highlightMode === "line" ? "bg-[#C9A227] text-[#07111F] font-semibold" : "text-white/60 hover:text-white"
                      }`}
                      title="Highlight Entire Line / Sentence on selection"
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Line</span>
                    </button>
                  </div>

                  <div className="w-[1px] h-4 bg-white/10" />

                  <button
                    onClick={() => addNoteToPage(currentPage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#C9A227]/20 hover:bg-[#C9A227]/40 border border-[#C9A227]/40 text-[#C9A227] hover:text-[#F7F5EE] transition-all text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>+ Add Margin Note (Page {currentPage})</span>
                  </button>

                  {pageNotes[currentPage]?.length > 0 && (
                    <button
                      onClick={clearCurrentPageNotes}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 transition-all text-[10px] tracking-wider uppercase cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Notes (Page {currentPage})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reader Viewport Area */}
          <div
            ref={viewportRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            className="flex-1 bg-[#07111F] overflow-y-auto flex flex-col items-center p-4 sm:p-8 gap-8 relative scroll-smooth h-full"
          >
            {rawPdfUrl ? (
              <div
                className="relative shadow-2xl rounded-lg overflow-hidden border border-[#C9A227]/30 flex-shrink-0 transition-all duration-200"
                style={{
                  width: `${Math.round(850 * (zoom / 100))}px`,
                  height: `${Math.round(1120 * (zoom / 100))}px`,
                }}
              >
                <PageCanvasOverlay
                  pageNum={currentPage}
                  activeTool={activeTool}
                  penColor={penColor}
                  penWidth={penWidth}
                  inkOpacity={inkOpacity}
                  highlightMode={highlightMode}
                  annotations={annotations}
                  onAddStroke={handleAddStroke}
                  onEraseStroke={handleEraseStroke}
                />
                <div
                  className="absolute inset-0 z-10"
                  style={{ pointerEvents: activeTool === "none" ? "auto" : "none" }}
                  onWheel={(e) => {
                    if (viewportRef.current) {
                      viewportRef.current.scrollTop += e.deltaY;
                    }
                  }}
                />
                <iframe
                  key={`${pdfSource}-${zoom}`}
                  ref={iframeRef}
                  src={pdfSource}
                  title={book.title || "PDF Document Reader"}
                  className="w-full h-full border-none bg-white relative z-0 pointer-events-auto overflow-hidden"
                  style={{ width: "100%", height: "100%", overflow: "hidden" }}
                  scrolling="no"
                />
              </div>
            ) : (
              Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  data-page={pageNum}
                  className="bg-[#FAF9F5] text-neutral-900 border border-[#C9A227]/30 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-200 flex flex-col overflow-hidden p-6 sm:p-10 flex-shrink-0 relative"
                  style={{
                    width: `${Math.round(800 * (zoom / 100))}px`,
                    minHeight: `${Math.round(1050 * (zoom / 100))}px`,
                  }}
                >
                  <PageCanvasOverlay
                    pageNum={pageNum}
                    activeTool={activeTool}
                    penColor={penColor}
                    penWidth={penWidth}
                    inkOpacity={inkOpacity}
                    highlightMode={highlightMode}
                    annotations={annotations}
                    onAddStroke={handleAddStroke}
                    onEraseStroke={handleEraseStroke}
                  />
                  {renderPageCardContent(pageNum)}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

