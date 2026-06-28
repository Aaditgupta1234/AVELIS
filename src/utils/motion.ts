import type { Variants } from "framer-motion";

// Core Easings
export const easeOut = [0.25, 0.1, 0.25, 1];
export const easeInOut = [0.4, 0, 0.2, 1];

// Durations
export const durations = {
  fast: 0.3,
  medium: 0.5,
  slow: 0.8,
  verySlow: 1.0,
};

// Springs
export const springs = {
  buttonClick: {
    type: "spring",
    stiffness: 400,
    damping: 25,
  },
  smooth: {
    type: "spring",
    stiffness: 100,
    damping: 20,
    mass: 1,
  },
};

// Global Reveal Variants (A, B, C)
export const revealVariants: Record<"A" | "B" | "C", Variants> = {
  A: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.slow, ease: easeOut },
    },
  },
  B: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.verySlow, ease: easeOut },
    },
  },
  C: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: durations.slow, ease: easeOut },
    },
  },
};

// Stagger Timing
export const staggers = {
  fast: 0.05,
  medium: 0.1,
  slow: 0.2,
};
