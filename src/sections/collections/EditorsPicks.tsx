import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs, durations, easeOut, staggers } from "../../utils/motion";
import { Link } from "react-router-dom";
import React from "react";

const books = [
  {
    category: "Philosophy",
    title: "The Silent Mind",
    author: "Marcus Aurelius",
    description: "A deep dive into the meditative practices of the ancient Stoics, presented in a modern context for the contemporary thinker.",
    readingTime: "8h Reading Time",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2187&auto=format&fit=crop"
  },
  {
    category: "Economics",
    title: "Foundations of Wealth",
    author: "Adam Smith",
    description: "A curated selection of Smith's most influential essays on market dynamics and the moral foundations of commerce.",
    readingTime: "12h Reading Time",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2112&auto=format&fit=crop"
  },
  {
    category: "Science",
    title: "Echoes of Eternity",
    author: "Carl Sagan",
    description: "A poetic exploration of cosmology and our place within the vast expanse of the cosmos, newly illustrated for the digital age.",
    readingTime: "6h Reading Time",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
  },
  {
    category: "Leadership",
    title: "The Art of Strategy",
    author: "Sun Tzu",
    description: "A fresh translation of the definitive guide to tactical excellence and the psychology of conflict resolution.",
    readingTime: "5h Reading Time",
    image: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?q=80&w=2187&auto=format&fit=crop"
  }
];

const EditorBookCard = ({ book }: { book: typeof books[0] }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const spotlight = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.15), transparent 80%)`;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeOut } },
      }}
      className="flex flex-col group h-full"
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
            boxShadow: "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)",
            transition: springs.smooth,
          },
        }}
        className="aspect-[2/3] w-full mb-6 relative overflow-hidden border border-white/10 bg-surface-variant/50"
      >
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: spotlight }}
        />
        
        <motion.img
          alt={book.title}
          className="w-full h-full object-cover"
          src={book.image}
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.05, transition: { duration: durations.verySlow, ease: easeOut } },
          }}
        />

        <motion.div 
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1, transition: { duration: durations.fast } }
          }}
          className="absolute inset-0 bg-background/60 z-20 flex items-center justify-center gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined">visibility</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined">bookmark</span>
          </motion.button>
        </motion.div>
      </motion.div>

      <div className="flex flex-col flex-grow">
        <span className="font-display text-[9px] text-primary uppercase tracking-widest mb-2">{book.category}</span>
        <h4 className="font-display text-lg mb-1 text-white">{book.title}</h4>
        <p className="font-body text-xs text-white/60 mb-4 italic">by {book.author}</p>
        <p className="font-body text-xs text-white/50 line-clamp-3 mb-6 flex-grow">{book.description}</p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <span className="font-display text-[9px] text-white/40 tracking-[0.1em]">{book.readingTime}</span>
          <button className="font-display text-[10px] text-primary uppercase tracking-widest hover:text-white transition-colors">Preview</button>
        </div>
      </div>
    </motion.div>
  );
};

export const EditorsPicks = () => {
  return (
    <AnimatedSection variant="C" className="bg-surface-variant/30 py-section-padding border-y border-white/5 relative z-10">
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
        
        <motion.div 
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.fast } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {books.map((book, idx) => (
            <EditorBookCard key={idx} book={book} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
