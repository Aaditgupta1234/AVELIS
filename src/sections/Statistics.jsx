import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useReducedMotion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
const AnimatedCounter = ({ value, suffix = "" }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });
    const shouldReduceMotion = useReducedMotion();
    const [isDone, setIsDone] = useState(false);
    useEffect(() => {
        if (shouldReduceMotion) {
            if (ref.current)
                ref.current.textContent = `${value}${suffix}`;
            setIsDone(true);
            return;
        }
        if (inView && ref.current) {
            const controls = animate(0, value, {
                duration: 1.5,
                ease: "easeOut",
                onUpdate(value) {
                    if (ref.current) {
                        // format with K or M if needed, but since we pass numeric part
                        // wait, original strings were "100K+", "50K+", "1.2M+", "99%"
                        // it's better to pass formatting fn.
                        // Since value here is numeric, I can just use toFixed based on decimal
                        const formatted = value % 1 !== 0 ? value.toFixed(1) : Math.floor(value);
                        ref.current.textContent = `${formatted}${suffix}`;
                    }
                },
                onComplete() {
                    setIsDone(true);
                }
            });
            return () => controls.stop();
        }
    }, [inView, value, suffix, shouldReduceMotion]);
    return (<motion.div animate={isDone && !shouldReduceMotion ? { y: [0, -4, 0] } : { y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="inline-block">
      <span ref={ref} className="font-display text-5xl text-primary mb-2">0</span>
    </motion.div>);
};
export const Statistics = () => {
    return (<AnimatedSection variant="B" className="py-24 bg-surface-variant/40 border-y border-white/5 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-2 lg:grid-cols-4 gap-16 text-center">
        
        <motion.div whileHover={{ textShadow: "0px 0px 20px rgba(212,175,55,0.4)" }} className="cursor-default">
          <AnimatedCounter value={100} suffix="K+"/>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase mt-2">Global Readers</p>
        </motion.div>
        
        <motion.div whileHover={{ textShadow: "0px 0px 20px rgba(212,175,55,0.4)" }} className="cursor-default">
          <AnimatedCounter value={50} suffix="K+"/>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase mt-2">First Editions</p>
        </motion.div>
        
        <motion.div whileHover={{ textShadow: "0px 0px 20px rgba(212,175,55,0.4)" }} className="cursor-default">
          <AnimatedCounter value={1.2} suffix="M+"/>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase mt-2">Archival Downloads</p>
        </motion.div>
        
        <motion.div whileHover={{ textShadow: "0px 0px 20px rgba(212,175,55,0.4)" }} className="cursor-default">
          <AnimatedCounter value={99} suffix="%"/>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase mt-2">Scholastic Rating</p>
        </motion.div>
        
      </div>
    </AnimatedSection>);
};
