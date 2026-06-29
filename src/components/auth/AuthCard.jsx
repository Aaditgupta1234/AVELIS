import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
export const AuthCard = ({ children, className }) => {
    return (<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className={cn("w-full max-w-[440px] bg-[#0D1626] border border-[rgba(201,162,39,0.18)] rounded-lg p-8 sm:p-10 relative overflow-hidden", "shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.03)]", className)}>
      {/* Ambient gold glow decoration inside card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none"/>
      
      <div className="relative z-10 flex flex-col gap-6 w-full">
        {children}
      </div>
    </motion.div>);
};
