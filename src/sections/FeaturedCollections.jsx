import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { staggers } from "../utils/motion";
import { BookCard } from "../components/ui/BookCard";
import { featuredBooks } from "../data/landingMockData.js";
export const FeaturedCollections = () => {
    return (<AnimatedSection variant="B" className="py-section-padding px-gutter relative z-10">
      <div className="max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
          <div>
            <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Curated Selections</p>
            <h2 className="font-display text-4xl md:text-5xl text-white">The Season's Anthology</h2>
          </div>
          <a className="font-display text-[11px] tracking-[0.2em] text-primary hover:text-white transition-colors border-b border-primary/20 hover:border-primary pb-2" href="#">
            VIEW ALL ARCHIVES
          </a>
        </div>

        <motion.div variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.medium } },
        }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {featuredBooks.map((book, idx) => (<BookCard key={book.id} variant={idx === 0 ? "featuredLarge" : "featured"} title={book.title} author={book.author} tag={book.tag} image={book.image}/>))}
        </motion.div>
      </div>
    </AnimatedSection>);
};
