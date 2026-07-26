import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { staggers } from "../utils/motion";
import { BookCard } from "../components/ui/BookCard";
import { useBooks } from "../context/BooksContext";
import { featuredBooks as defaultLandingBooks } from "../data/landingMockData.js";
import { getHeroApi } from "../api/hero.api.js";

export const FeaturedCollections = () => {
    const { books } = useBooks();
    const [savedHeroBooks, setSavedHeroBooks] = useState(() => {
        try {
            const saved = localStorage.getItem("avelis_hero_books");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            return [];
        } catch {
            return [];
        }
    });

    const [heroIds, setHeroIds] = useState(() => {
        try {
            const saved = localStorage.getItem("avelis_hero_book_ids");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            return [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const handleHeroUpdate = () => {
            getHeroApi()
              .then((res) => {
                if (res?.success && res?.data) {
                  if (Array.isArray(res.data.heroBooks) && res.data.heroBooks.length > 0) {
                    setSavedHeroBooks(res.data.heroBooks);
                    localStorage.setItem("avelis_hero_books", JSON.stringify(res.data.heroBooks));
                  }
                  if (Array.isArray(res.data.heroBookIds) && res.data.heroBookIds.length > 0) {
                    setHeroIds(res.data.heroBookIds);
                    localStorage.setItem("avelis_hero_book_ids", JSON.stringify(res.data.heroBookIds));
                  }
                }
              })
              .catch(() => {
                try {
                  const savedBooksStr = localStorage.getItem("avelis_hero_books");
                  if (savedBooksStr) setSavedHeroBooks(JSON.parse(savedBooksStr));
                  const saved = localStorage.getItem("avelis_hero_book_ids");
                  if (saved) setHeroIds(JSON.parse(saved));
                } catch {}
              });
        };
        handleHeroUpdate();
        window.addEventListener("avelis_hero_updated", handleHeroUpdate);
        window.addEventListener("storage", handleHeroUpdate);
        window.addEventListener("focus", handleHeroUpdate);
        return () => {
            window.removeEventListener("avelis_hero_updated", handleHeroUpdate);
            window.removeEventListener("storage", handleHeroUpdate);
            window.removeEventListener("focus", handleHeroUpdate);
        };
    }, []);

    const resolvedBooks = (savedHeroBooks && savedHeroBooks.length > 0)
        ? savedHeroBooks.map((sb) => {
            const liveMatch = Array.isArray(books) ? books.find((b) => String(b.id) === String(sb.id)) : null;
            return liveMatch ? { ...sb, ...liveMatch } : sb;
          })
        : (heroIds && heroIds.length > 0)
        ? heroIds.map((id) => {
            const liveMatch = Array.isArray(books) ? books.find((b) => String(b.id) === String(id)) : null;
            return liveMatch || null;
          }).filter(Boolean)
        : defaultLandingBooks;

    const displayList = resolvedBooks.length > 0 ? resolvedBooks : defaultLandingBooks;

    return (
      <AnimatedSection variant="B" className="py-section-padding px-gutter relative z-10">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
            <div>
              <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Curated Selections</p>
              <h2 className="font-display text-4xl md:text-5xl text-white">The Season's Anthology</h2>
            </div>
            <Link className="font-display text-[11px] tracking-[0.2em] text-primary hover:text-white transition-colors border-b border-primary/20 hover:border-primary pb-2" to="/library">
              VIEW ALL ARCHIVES
            </Link>
          </div>

          <motion.div variants={{
              hidden: {},
              visible: { transition: { staggerChildren: staggers.medium } },
          }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {displayList.slice(0, 4).map((book, idx) => (
              <BookCard
                key={book.id || idx}
                variant={idx === 0 ? "featuredLarge" : "featured"}
                title={book.title}
                author={book.author || book.authorsList?.[0]?.name || "AVELIS Press"}
                tag={book.category || book.tag || "CURATED ARCHIVE"}
                image={book.coverImage || book.image}
              />
            ))}
          </motion.div>
        </div>
      </AnimatedSection>
    );
};
