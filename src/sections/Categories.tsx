import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, staggers } from "../utils/motion";

const categories = [
  { icon: "castle", label: "Fantasy" },
  { icon: "history_edu", label: "History" },
  { icon: "foundation", label: "Philosophy" },
  { icon: "rocket_launch", label: "Sci-Fi" },
  { icon: "palette", label: "Arts" },
  { icon: "terminal", label: "Technology" },
];

const CategoryCard = ({ icon, label }: { icon: string; label: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="rest"
      whileHover="hover"
      className="relative glass-panel p-10 cursor-pointer overflow-hidden border"
      animate="rest"
    >
      <motion.div
        variants={{
          rest: { 
            borderColor: "rgba(255, 255, 255, 0.05)",
            background: "rgba(255, 255, 255, 0)",
            y: 0,
            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
          },
          hover: { 
            borderColor: "rgba(212, 175, 55, 0.4)",
            background: "linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0) 100%)",
            y: -6,
            boxShadow: "0px 10px 20px -10px rgba(212,175,55,0.15)",
          },
        }}
        transition={springs.smooth}
        className="absolute inset-0 z-0"
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.span
          variants={{
            rest: { y: 0, opacity: 0.7, textShadow: "0px 0px 0px rgba(212,175,55,0)" },
            hover: { y: -2, opacity: 1, textShadow: "0px 4px 12px rgba(212,175,55,0.5)" },
          }}
          transition={springs.smooth}
          className="material-symbols-outlined text-primary mb-6 scale-150 block"
        >
          {icon}
        </motion.span>
        <motion.p
          variants={{
            rest: { color: "rgba(255, 255, 255, 0.7)" },
            hover: { color: "rgba(255, 255, 255, 1)" },
          }}
          transition={springs.smooth}
          className="font-display text-[11px] tracking-[0.3em] uppercase"
        >
          {label}
        </motion.p>
      </div>
    </motion.div>
  );
};

export const Categories = () => {
  return (
    <AnimatedSection variant="C" className="py-section-padding bg-surface/30 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter text-center">
        <h2 className="font-display text-4xl mb-20 uppercase tracking-widest">Curated Domains</h2>
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.fast } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {categories.map((cat, i) => (
            <CategoryCard key={i} icon={cat.icon} label={cat.label} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
