import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { durations } from "../../utils/motion";
export const PageWrapper = ({ children }) => {
    const shouldReduceMotion = useReducedMotion();
    const variants = {
        initial: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 20
        },
        enter: {
            opacity: 1,
            y: 0,
            transition: {
                duration: durations.medium,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : -20,
            transition: {
                duration: durations.fast,
                ease: "easeIn"
            }
        }
    };
    return (<motion.div variants={variants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>);
};
