import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { springs, durations, easeOut } from "../../utils/motion";
import { useLoans } from "../../context/LoanContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useBooks } from "../../context/BooksContext.jsx";
import { BookOpen, CheckCircle2 } from "lucide-react";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80";

export const BookCard = ({
  id,
  image,
  title,
  author,
  variant = "featured",
  category,
  description,
  readingTime,
  tag,
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = React.useState(image || DEFAULT_COVER);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  React.useEffect(() => {
    setImgSrc(image || DEFAULT_COVER);
  }, [image]);

  const { isAuthenticated } = useAuth();
  const { borrowBook, activeLoans } = useLoans();
  const { books } = useBooks();
  const navigate = useNavigate();

  const isBorrowedByMe = activeLoans?.some(
    (l) => (id && l.bookId === id) || (title && l.title?.toLowerCase() === title.toLowerCase())
  );

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const handleQuickBorrow = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (isBorrowedByMe) {
      navigate("/dashboard");
      return;
    }

    setIsBorrowing(true);
    try {
      // Find matching book from context (exact title/ID or fallback to any available physical copy)
      let matched = books.find(
        (b) =>
          (id && b.id === id) ||
          b.title.toLowerCase() === title.toLowerCase()
      );

      if (!matched) {
        matched = books.find(
          (b) => b.isBorrowable && b.copies?.some((c) => c.status === "AVAILABLE")
        );
      }

      const availableCopy = matched?.copies?.find(
        (c) => c.status === "AVAILABLE"
      );

      if (availableCopy) {
        await borrowBook(availableCopy.id);
        setToastMessage(`"${title}" borrowed successfully!`);
        setTimeout(() => setToastMessage(""), 3500);
      } else {
        setToastMessage(`"${title}" is currently out of stock.`);
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to borrow book.");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setIsBorrowing(false);
    }
  };

  const spotlight = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.15), transparent 80%)`;
  const isLarge = variant === "featuredLarge";
  const isEditor = variant === "editor";

  return (
    <>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: durations.slow, ease: easeOut },
          },
        }}
        className={`group ${isLarge ? "lg:col-span-2" : ""} ${
          isEditor ? "flex flex-col h-full" : ""
        }`}
        whileHover="hover"
        initial="rest"
        animate="rest"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          variants={{
            rest: { y: 0, scale: 1, boxShadow: "0px 4px 20px rgba(0,0,0,0)" },
            hover: {
              y: -8,
              scale: 1.02,
              boxShadow:
                "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)",
              transition: springs.smooth,
            },
          }}
          className={`relative overflow-hidden bg-surface-variant/50 ${
            isLarge
              ? "aspect-[16/10]"
              : isEditor
              ? "aspect-[2/3] mb-6 rounded-lg"
              : "aspect-[3/4] mb-6 border border-white/10 rounded-lg"
          }`}
        >
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: spotlight }}
          />

          <motion.img
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: isLoaded ? 1 : 0 }}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              if (imgSrc !== DEFAULT_COVER) {
                setImgSrc(DEFAULT_COVER);
              }
              setIsLoaded(true);
            }}
            src={imgSrc}
            loading="lazy"
            variants={{
              rest: { scale: 1 },
              hover: {
                scale: 1.03,
                transition: { duration: durations.verySlow, ease: easeOut },
              },
            }}
          />

          {isLarge && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              <div className="absolute bottom-8 left-8 z-20">
                {tag && (
                  <motion.span
                    variants={{
                      rest: { opacity: 0.8, y: 0 },
                      hover: { opacity: 1, y: -4, transition: springs.smooth },
                    }}
                    className="bg-primary/20 backdrop-blur-md px-3 py-1 text-[8px] font-display text-primary tracking-widest uppercase border border-primary/30 mb-4 inline-block"
                  >
                    {tag}
                  </motion.span>
                )}
                <h3 className="font-display text-3xl mb-1 text-white">{title}</h3>
                <p className="font-display text-[10px] text-primary/70 tracking-widest">
                  {author}
                </p>
              </div>
            </>
          )}

          {variant === "featured" && (
            <motion.div
              onClick={handleQuickBorrow}
              variants={{
                rest: { opacity: 0, y: 10, scale: 0.8 },
                hover: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { ...springs.smooth, delay: 0.1 },
                },
              }}
              className={`absolute top-4 right-4 h-9 px-3 flex items-center gap-1.5 rounded-full border z-20 cursor-pointer transition-colors shadow-lg ${
                isBorrowedByMe
                  ? "bg-emerald-500 border-emerald-400 text-[#07111F]"
                  : "bg-[#07111F]/90 hover:bg-[#C9A227] hover:text-[#07111F] text-[#C9A227] border-[#C9A227]/40"
              }`}
              title={isBorrowedByMe ? "Currently borrowed by you" : "Borrow this book"}
            >
              {isBorrowedByMe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              <span className="font-display text-[9px] uppercase tracking-wider font-semibold">
                {isBorrowedByMe ? "Borrowed" : "Borrow"}
              </span>
            </motion.div>
          )}

          {isEditor && (
            <motion.div
              variants={{
                rest: { opacity: 0 },
                hover: { opacity: 1, transition: { duration: durations.fast } },
              }}
              className="absolute inset-0 bg-background/75 z-20 flex items-center justify-center gap-3 p-4"
            >
              <Link
                to={id ? `/book/${id}` : `/library?search=${encodeURIComponent(title)}`}
                aria-label="View Details"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20"
                title="View Details"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  visibility
                </span>
              </Link>
              <motion.button
                onClick={handleQuickBorrow}
                disabled={isBorrowing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Borrow Book"
                className={`px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors font-display text-[9px] uppercase tracking-widest font-semibold cursor-pointer shadow-lg ${
                  isBorrowedByMe
                    ? "bg-emerald-500 text-[#07111F]"
                    : "bg-[#C9A227] hover:bg-[#E5C16B] text-[#07111F]"
                }`}
                title={isBorrowedByMe ? "Currently borrowed" : "Borrow Book"}
              >
                {isBorrowedByMe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>{isBorrowing ? "Borrowing..." : isBorrowedByMe ? "Borrowed" : "Borrow"}</span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {variant === "featured" && (
          <motion.div
            variants={{
              rest: { y: 0 },
              hover: { y: -2, transition: springs.smooth },
            }}
          >
            <h3 className="font-display text-xl mb-1 text-white">{title}</h3>
            <p className="font-display text-[10px] text-primary/70 tracking-widest uppercase">
              {author}
            </p>
          </motion.div>
        )}

        {isEditor && (
          <div className="flex flex-col flex-grow">
            {category && (
              <span className="font-display text-[9px] text-primary uppercase tracking-widest mb-2">
                {category}
              </span>
            )}
            <h4 className="font-display text-lg mb-1 text-white">{title}</h4>
            <p className="font-body text-xs text-white/60 mb-4 italic">by {author}</p>
            <p className="font-body text-xs text-white/50 line-clamp-3 mb-6 flex-grow">
              {description}
            </p>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5 gap-2">
              <Link
                to={id ? `/book/${id}` : `/library?search=${encodeURIComponent(title)}`}
                className="font-display text-[10px] text-white/50 hover:text-white uppercase tracking-widest transition-colors"
              >
                Details
              </Link>
              <button
                onClick={handleQuickBorrow}
                disabled={isBorrowing}
                className="font-display text-[10px] text-[#C9A227] uppercase tracking-widest hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>{isBorrowing ? "Borrowing..." : "Borrow Book"}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-[#0D1626] border border-[#C9A227]/40 text-[#C9A227] px-6 py-4 rounded shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 flex items-center gap-3 font-body text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#C9A227] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
