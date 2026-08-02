import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { staggers } from "../../utils/motion";
import { Link } from "react-router-dom";
import { BookCard } from "../../components/ui/BookCard";
import { editorPicks as fallbackPicks } from "../../data/landingMockData.js";
import { getHeroApi } from "../../api/hero.api.js";

export const EditorsPicks = () => {
    const mapBookToCard = (b) => ({
        id: b.id,
        title: b.title,
        author: b.author || (b.authors && b.authors[0]?.author?.fullName) || "AVELIS Press",
        image: b.coverImage || b.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format,compress&fit=crop&w=400&q=75&fm=webp",
        category: b.category || (b.categories && b.categories[0]?.category?.name) || "Classic",
        description: b.description || "A masterfully curated selection for our distinguished readers."
    });

    const [picks, setPicks] = useState(() => {
        try {
            const saved = localStorage.getItem("avelis_editor_picks_books");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(mapBookToCard);
                }
            }
        } catch (_) {}
        return fallbackPicks;
    });

    const loadPicks = async () => {
        try {
            const localSaved = localStorage.getItem("avelis_editor_picks_books");
            if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPicks(parsed.map(mapBookToCard));
                }
            }

            const res = await getHeroApi();
            const payload = res?.data?.editorPicksBooks || res?.editorPicksBooks || res?.data?.data?.editorPicksBooks;
            if (Array.isArray(payload) && payload.length > 0) {
                const mapped = payload.map(mapBookToCard);
                setPicks(mapped);
                localStorage.setItem("avelis_editor_picks_books", JSON.stringify(payload));
            }
        } catch (err) {
            // Retain existing state on error
        }
    };

    useEffect(() => {
        loadPicks();
        window.addEventListener("avelis_editors_picks_updated", loadPicks);
        window.addEventListener("storage", loadPicks);
        return () => {
            window.removeEventListener("avelis_editors_picks_updated", loadPicks);
            window.removeEventListener("storage", loadPicks);
        };
    }, []);

    return (<AnimatedSection variant="C" className="bg-surface-variant/30 py-section-padding border-y border-white/5 relative z-10">
      <div className="px-gutter max-w-container-max mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-display text-[10px] text-primary uppercase tracking-[0.3em] mb-4 block">Selected for You</span>
            <h2 className="font-display text-3xl md:text-4xl text-white">EDITOR'S PICKS</h2>
          </div>
          <Link to="/collections" className="font-display text-[10px] text-white/50 hover:text-primary uppercase border-b border-transparent hover:border-primary pb-1 transition-all hidden md:block">
            View All Selections
          </Link>
        </div>
        
        <motion.div variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.fast } },
        }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {picks.map((book) => (<BookCard key={book.id} variant="editor" title={book.title} author={book.author} image={book.image} category={book.category || "Classic"} description={book.description || "A masterfully curated selection for our distinguished readers."} readingTime="10h Reading Time"/>))}
        </motion.div>
      </div>
    </AnimatedSection>);
};
