import { motion, useReducedMotion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, easeOut } from "../utils/motion";

export const FinalCTA = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedSection variant="A" className="py-40 relative overflow-hidden text-center px-gutter z-10">
      
      {!shouldReduceMotion && (
        <motion.div
          animate={{
            x: ["-20%", "20%", "-20%"],
            y: ["-20%", "20%", "-20%"],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)",
          }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <h2 className="font-display text-6xl md:text-8xl leading-tight">Your Next Story <br/> Starts Here.</h2>
        <div className="w-full h-[1px] bg-primary/20 relative divider-diamond mb-12"></div>
        <p className="text-on-background/60 text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Step into the AVELIS sanctuary. Whether you seek the wisdom of the ancients or the thrill of the modern era, your seat in the circle awaits.
        </p>
        <motion.button 
          whileHover={{ 
            y: -2, 
            boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.4)",
            background: "linear-gradient(45deg, rgba(212,175,55,1) 0%, rgba(230,195,85,1) 100%)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ ...springs.buttonClick, y: springs.smooth }}
          className="bg-primary text-on-primary px-16 py-8 font-display text-[14px] tracking-[0.3em] uppercase transition-colors"
        >
          Join the Collective
        </motion.button>
      </div>
    </AnimatedSection>
  );
};
