import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, staggers } from "../utils/motion";
import { categories } from "../data/collections";

const CategoryCard = ({ image, title }: { image: string; title: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group relative h-40 overflow-hidden border border-white/10 cursor-pointer"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <motion.div 
        className="absolute inset-0 bg-surface-variant z-0"
        variants={{
          rest: { opacity: 1 },
          hover: { opacity: 0 }
        }}
        transition={springs.smooth}
      />
      
      <motion.div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        variants={{
          rest: { opacity: 0, scale: 1 },
          hover: { opacity: 0.5, scale: 1.05 }
        }}
        transition={springs.smooth}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10" />
      
      <div className="relative z-20 h-full flex flex-col items-center justify-center p-6 text-center">
        <motion.h3 
          variants={{
            rest: { y: 0, color: "rgba(255,255,255,0.7)" },
            hover: { y: -4, color: "rgba(212,175,55,1)" }
          }}
          transition={springs.smooth}
          className="font-display text-lg tracking-wider"
        >
          {title}
        </motion.h3>
      </div>
    </motion.div>
  );
};

export const Categories = () => {
  return (
    <AnimatedSection variant="A" className="py-12 border-b border-white/5 relative z-10 px-gutter bg-background/50">
      <div className="max-w-container-max mx-auto">
        <motion.div 
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.fast } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.map((cat, i) => (
            <CategoryCard key={i} image={cat.image} title={cat.title} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
