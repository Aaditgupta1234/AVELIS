import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { revealVariants } from "../../utils/motion";
export const AnimatedSection = ({ children, variant = "A", className = "", }) => {
    const shouldReduceMotion = useReducedMotion();
    if (shouldReduceMotion) {
        return (<motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }} className={className}>
        {children}
      </motion.div>);
    }
    return (<motion.div variants={revealVariants[variant]} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className={className}>
      {children}
    </motion.div>);
};
