import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, staggers } from "../utils/motion";
import { PREMIUM_FEATURES } from "../utils/constants";

const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="glass-panel p-12 border border-primary/20 relative overflow-hidden group cursor-default"
    >
      <motion.div
        variants={{
          rest: { 
            borderColor: "rgba(212, 175, 55, 0.2)",
            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
          },
          hover: { 
            borderColor: "rgba(212, 175, 55, 1)",
            boxShadow: "0px 10px 30px -10px rgba(212,175,55,0.2)",
          },
        }}
        transition={springs.smooth}
        className="absolute inset-0 z-0 pointer-events-none"
      />
      <div className="relative z-10">
        <motion.span 
          variants={{
            rest: { y: 0, scale: 1 },
            hover: { y: -4, scale: 1.1 },
          }}
          transition={springs.bounce}
          className="material-symbols-outlined text-primary mb-8 text-4xl block transform-origin-bottom"
        >
          {icon}
        </motion.span>
        <h3 className="font-display text-2xl mb-4">{title}</h3>
        <p className="text-on-background/60 font-light leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export const PremiumFeatures = () => {
  return (
    <AnimatedSection variant="C" className="py-section-padding px-gutter relative z-10">
      <div className="max-w-container-max mx-auto">
        <h2 className="font-display text-4xl text-center mb-20 uppercase tracking-[0.2em]">The Patronage Benefits</h2>
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.fast } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {PREMIUM_FEATURES.map((feat, i) => (
            <FeatureCard key={i} icon={feat.icon} title={feat.title} description={feat.description} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
