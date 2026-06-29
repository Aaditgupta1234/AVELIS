import React from "react";
import { Logo } from "../ui/Logo";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export const AuthLayout = ({ children }) => {
    return (<div className="min-h-screen bg-[#07111F] text-[#F7F5EE] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Paper grain overlay */}
      <div className="paper-grain opacity-5 pointer-events-none"/>

      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A227]/3 rounded-full blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-[#1A2E57]/10 rounded-full blur-[150px] pointer-events-none"/>

      {/* Left Branding Panel (45%) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 lg:p-20 relative z-10 border-b lg:border-b-0 lg:border-r border-[rgba(201,162,39,0.08)]">
        {/* Top: Logo & Back Link */}
        <div className="flex justify-between items-center w-full">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/" className="flex items-center gap-2 font-display text-[10px] tracking-[0.2em] text-[#F7F5EE]/60 hover:text-[#C9A227] uppercase transition-colors">
            <ArrowLeft className="w-3.5 h-3.5"/>
            <span>Back to sanctuary</span>
          </Link>
        </div>

        {/* Middle: Branding Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="my-16 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#C9A227]/20 rounded-full bg-[#C9A227]/5">
            <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-full animate-pulse"></span>
            <span className="font-display text-[8px] tracking-[0.3em] text-[#C9A227] uppercase font-semibold">THE CIRCLE</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.15] text-[#F7F5EE]">
            A Sanctuary <br />
            for the <br />
            <span className="italic text-[#C9A227]">Discerning Mind.</span>
          </h1>
          <div className="w-24 h-[1px] bg-[#C9A227]/30"></div>
          <p className="font-body text-sm sm:text-base text-[rgba(247,245,238,0.72)] leading-relaxed font-light">
            Step back into your personal archive. Continue your journey through the world's most significant works, curated collections, and immersive reading journals.
          </p>
        </motion.div>

        {/* Bottom: Footer note */}
        <div className="hidden lg:block">
          <p className="font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/40 uppercase">
            © {new Date().getFullYear()} AVELIS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right/Center Authentication Panel (55%) */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative z-10 min-h-[60vh] lg:min-h-screen bg-[#07111F]">
        <div className="w-full flex justify-center items-center">
          {children}
        </div>
        {/* Mobile footer note */}
        <div className="block lg:hidden mt-12 text-center">
          <p className="font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/40 uppercase">
            © {new Date().getFullYear()} AVELIS. All rights reserved.
          </p>
        </div>
      </div>
    </div>);
};
