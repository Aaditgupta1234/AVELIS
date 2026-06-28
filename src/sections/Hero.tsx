import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Hero3DScene } from "../components/ui/Hero3DScene";
import { springs, durations, easeOut, staggers } from "../utils/motion";

const Particles = () => {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;

  // Max 8 particles as per spec
  const particles = Array.from({ length: 8 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 30 + Math.random() * 30, // 30-60s loop
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export const Hero = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, springs.smooth);
  const smoothY = useSpring(mouseY, springs.smooth);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // max movement 3-5px
    const x = ((clientX / innerWidth) - 0.5) * 8; 
    const y = ((clientY / innerHeight) - 0.5) * 8;
    mouseX.set(x);
    mouseY.set(y);
  };

  const titleLines = [
    { text: "EVERY STORY", italic: false },
    { text: "BEGINS WITH", italic: true },
    { text: "A CHOICE.", italic: false },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggers.slow,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeOut } },
  };

  return (
    <section 
      className="min-h-screen flex items-center pt-20 overflow-hidden px-gutter relative z-10"
      onMouseMove={handleMouseMove}
    >
      <Particles />
      <div className="max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-4 px-4 py-1.5 border border-primary/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            <span className="font-display text-[10px] tracking-[0.3em] text-primary uppercase">The Definitive Digital Library</span>
          </motion.div>
          
          <h1 className="font-display text-6xl md:text-8xl leading-[1.1] text-white">
            {titleLines.map((line, i) => (
              <motion.div key={i} variants={itemVariants}>
                {line.italic ? <span className="italic text-primary">{line.text}</span> : line.text}
              </motion.div>
            ))}
          </h1>
          
          <motion.p variants={itemVariants} className="text-on-background/70 text-lg max-w-xl font-light leading-relaxed">
            Step into a curated sanctuary where the art of literature meets modern refinement. Discover, collect, and experience the world's most significant works in an environment designed for the discerning mind.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-wrap gap-8">
            <motion.button 
              whileHover={{ 
                y: -2,
                boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="bg-primary text-on-primary px-12 py-6 font-display text-[12px] tracking-[0.2em] uppercase transition-colors"
            >
              Explore Archives
            </motion.button>
            <motion.button 
              whileHover={{ 
                y: -2,
                backgroundColor: "rgba(212,175,55,0.05)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="border border-primary/30 text-white px-12 py-6 font-display text-[12px] tracking-[0.2em] uppercase transition-colors"
            >
              The Experience
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ x: smoothX, y: smoothY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.slow, ease: easeOut, delay: 0.5 }}
          className="relative flex justify-center items-center"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.01, 1],
              y: [0, -3, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full relative flex justify-center items-center"
          >
            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full"></div>
            <Hero3DScene />
          </motion.div>
        </motion.div>
        
      </div>
    </section>
  );
};
