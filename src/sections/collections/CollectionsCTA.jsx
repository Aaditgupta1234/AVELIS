import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs } from "../../utils/motion";
export const CollectionsCTA = () => {
    return (<AnimatedSection variant="B" className="py-section-padding px-gutter max-w-container-max mx-auto text-center relative z-10 mb-20">
      <div className="border border-white/10 rounded-sm p-16 glass-panel flex flex-col items-center relative overflow-hidden">
        
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"/>
        
        <div className="relative z-10">
          <h2 className="font-display text-4xl md:text-5xl mb-6 text-white">Begin Your Reading Journey</h2>
          <p className="font-body text-white/60 mb-12 max-w-xl mx-auto leading-relaxed">
            Unlock full access to our curated archive and experience literature as it was meant to be: pure, immersive, and transformative.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/library">
              <motion.button whileHover={{
              y: -2,
              boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.4)",
              background: "linear-gradient(45deg, rgba(212,175,55,1) 0%, rgba(230,195,85,1) 100%)"
          }} whileTap={{ scale: 0.98 }} transition={{ ...springs.buttonClick, y: springs.smooth }} className="bg-primary text-on-primary px-10 py-4 font-display text-[10px] tracking-[0.2em] uppercase transition-colors cursor-pointer">
                Explore Books
              </motion.button>
            </Link>
            <Link to="/library">
              <motion.button whileHover={{
              y: -2,
              backgroundColor: "rgba(212,175,55,0.05)",
              borderColor: "rgba(230,195,85,1)"
          }} whileTap={{ scale: 0.98 }} transition={springs.smooth} className="border border-primary text-primary px-10 py-4 font-display text-[10px] tracking-[0.2em] uppercase transition-colors cursor-pointer">
                Start Reading
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </AnimatedSection>);
};
