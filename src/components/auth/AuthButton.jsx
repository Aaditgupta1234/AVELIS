import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { springs } from "../../utils/motion";
export const AuthButton = ({ className, loading, disabled, children, variant = "primary", ...props }) => {
    return (<motion.button whileHover={disabled || loading ? {} : {
            y: -2,
            boxShadow: variant === "primary" ? "0px 10px 30px -10px rgba(201, 162, 39, 0.4)" : "none"
        }} whileTap={disabled || loading ? {} : { scale: 0.98 }} transition={springs.buttonClick} disabled={disabled || loading} className={cn("w-full h-12 flex items-center justify-center font-display text-[11px] tracking-[0.2em] uppercase transition-all duration-300 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none", {
            "bg-[#C9A227] text-[#07111F] hover:bg-[#E5C16B]": variant === "primary",
            "border border-[rgba(201,162,39,0.3)] text-[#F7F5EE] hover:bg-[rgba(201,162,39,0.05)]": variant === "secondary",
        }, className)} {...props}>
      {loading ? (<div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </div>) : (children)}
    </motion.button>);
};
