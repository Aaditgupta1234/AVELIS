import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  hoverable?: boolean;
  children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { scale: 1.02 } : undefined}
        className={cn(
          "bg-surface-card rounded-lg overflow-hidden border border-white/10 relative transition-colors duration-300",
          hoverable && "hover:border-gold-primary/30",
          className
        )}
        {...props}
      >
        {/* Subtle inner top-left highlight border */}
        <div className="absolute inset-0 border-t border-l border-white/5 pointer-events-none rounded-lg" />
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
