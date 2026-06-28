import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { staggers } from "../../utils/motion";
import { Link } from "react-router-dom";
import { authorBooks } from "../../data/books";

export const FeaturedAuthor = () => {
  return (
    <AnimatedSection variant="B" className="py-section-padding px-gutter max-w-container-max mx-auto overflow-hidden relative z-10">
      <div className="flex flex-col md:flex-row gap-16 items-center">
        <div className="w-full md:w-1/2 relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-10 -left-10 w-40 h-40 border border-primary/20 rounded-full"
          />
          <div className="border border-white/10 glass-panel overflow-hidden aspect-square relative z-10 group">
            <motion.img 
              whileHover={{ scale: 1.05, filter: "grayscale(0%)" }}
              initial={{ filter: "grayscale(100%)" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-full h-full object-cover" 
              alt="Albert Camus" 
              src="/albert-camus.png"
              loading="lazy"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <span className="font-display text-[10px] text-primary uppercase tracking-[0.3em] mb-4 block">Author in Focus</span>
          <h2 className="font-display text-4xl md:text-5xl mb-6 text-white">ALBERT CAMUS</h2>
          <p className="font-body text-white/60 mb-8 leading-relaxed">
            A Nobel Prize-winning novelist, philosopher, and journalist, Camus is best known for his exploration of the human condition and the concept of 'the absurd'. His work continues to resonate with readers seeking meaning in a complex, often indifferent universe.
          </p>
          
          <motion.div 
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: staggers.fast } }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2"
          >
            {authorBooks.map((book, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <Link to="#" className="flex justify-between items-center py-4 border-b border-white/5 group hover:border-primary/50 transition-colors">
                  <span className="font-display text-lg text-white group-hover:text-primary transition-colors">{book}</span>
                  <span className="material-symbols-outlined text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    arrow_forward
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
};
