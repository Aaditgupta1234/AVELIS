import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { staggers } from "../../utils/motion";
import { Link } from "react-router-dom";
import { BookCard } from "../../components/ui/BookCard";
import { editorPicks } from "../../data/landingMockData.js";
export const EditorsPicks = () => {
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
          {editorPicks.map((book) => (<BookCard key={book.id} variant="editor" title={book.title} author={book.author} image={book.image} category="Classic" description="A masterfully curated selection for our distinguished readers." readingTime="10h Reading Time"/>))}
        </motion.div>
      </div>
    </AnimatedSection>);
};
