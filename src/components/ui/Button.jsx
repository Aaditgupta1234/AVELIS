import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
export const Button = forwardRef(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (<motion.button ref={ref} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={cn("inline-flex items-center justify-center font-inter font-medium transition-colors rounded focus:outline-none focus:ring-2 focus:ring-gold-primary focus:ring-offset-2 focus:ring-offset-bg-primary", {
            "bg-gold-primary text-bg-primary hover:bg-gold-secondary": variant === "primary",
            "bg-transparent border border-gold-primary text-gold-primary hover:bg-gold-primary/10": variant === "secondary",
            "bg-transparent text-text-secondary hover:text-text-primary": variant === "ghost",
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
        }, className)} {...props}>
        {children}
      </motion.button>);
});
Button.displayName = "Button";
