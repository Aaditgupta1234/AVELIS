import { motion } from "framer-motion";
import { AnimatedSection } from "../ui/AnimatedSection";

export const ExperienceHero = () => {
  return (
    <AnimatedSection variant="A" className="min-h-screen flex flex-col items-center justify-center text-center px-gutter py-section-padding relative z-10">
      <div className="max-w-4xl space-y-8">
        <span className="font-display text-xs md:text-sm text-primary tracking-[0.3em] font-semibold block uppercase">
          AUTHENTIC HERITAGE
        </span>
        
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-on-background tracking-tight">
          The Reading Experience,<br />Reimagined
        </h1>
        
        <p className="font-body text-base md:text-lg lg:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed opacity-80 italic">
          Step into a digital sanctuary where literature meets artistry. Avelis transcends the conventional, offering a curated path through human knowledge with immersive precision.
        </p>
        
        <div className="pt-16 flex justify-center">
          <motion.button
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight * 0.9,
                behavior: "smooth",
              });
            }}
            aria-label="Scroll down to explore"
            className="material-symbols-outlined text-primary text-4xl hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl p-2"
          >
            expand_more
          </motion.button>
        </div>
      </div>
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full max-w-4xl mx-auto pointer-events-none -z-10" />
    </AnimatedSection>
  );
};
