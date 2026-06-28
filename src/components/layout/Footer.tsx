import { useState } from "react";
import { motion } from "framer-motion";
import { springs } from "../../utils/motion";

const FooterLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
  return (
    <li>
      <motion.a 
        href={href}
        className="relative inline-block text-white/40 hover:text-primary transition-colors duration-300"
        initial="rest"
        whileHover="hover"
      >
        {children}
        <motion.span
          variants={{
            rest: { scaleX: 0, opacity: 0 },
            hover: { scaleX: 1, opacity: 1, transition: springs.smooth },
          }}
          className="absolute -bottom-1 left-0 right-0 h-[1px] bg-primary origin-left"
        />
      </motion.a>
    </li>
  );
};

const SocialIcon = ({ icon }: { icon: string }) => {
  return (
    <motion.span 
      whileHover={{ y: -2, rotate: 3, color: "var(--color-primary)" }}
      transition={springs.smooth}
      className="material-symbols-outlined text-primary/60 cursor-pointer"
    >
      {icon}
    </motion.span>
  );
};

export const Footer = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <footer className="py-section-padding border-t border-white/5 bg-background">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-4 gap-20">
        <div className="lg:col-span-1">
          <div className="font-display text-4xl text-primary mb-8 tracking-[0.2em]">AVELIS</div>
          <p className="text-on-background/50 font-light text-sm leading-relaxed mb-8">
            An ecosystem dedicated to the preservation and elevation of the written word. Crafting digital sanctuaries for the discerning bibliophile.
          </p>
          <div className="flex gap-6">
            <SocialIcon icon="public" />
            <SocialIcon icon="terminal" />
            <SocialIcon icon="draw" />
          </div>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">The Sanctuary</h4>
          <ul className="space-y-4 text-xs font-display tracking-[0.1em] uppercase">
            <FooterLink href="#">The Founders</FooterLink>
            <FooterLink href="#">Bespoke Commissions</FooterLink>
            <FooterLink href="#">Archival Access</FooterLink>
            <FooterLink href="#">Journal</FooterLink>
          </ul>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">Governance</h4>
          <ul className="space-y-4 text-xs font-display tracking-[0.1em] uppercase">
            <FooterLink href="#">Patron Rights</FooterLink>
            <FooterLink href="#">Privacy Policy</FooterLink>
            <FooterLink href="#">Ethics Statement</FooterLink>
            <FooterLink href="#">Contact Us</FooterLink>
          </ul>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">The Newsletter</h4>
          <p className="text-on-background/50 text-xs mb-6 font-light">Receive rare updates from our archival scouts.</p>
          <motion.div 
            animate={{
              borderColor: isFocused ? "rgba(212, 175, 55, 0.8)" : "rgba(212, 175, 55, 0.2)",
              boxShadow: isFocused ? "0px 4px 12px rgba(212, 175, 55, 0.1)" : "0px 0px 0px rgba(0,0,0,0)"
            }}
            transition={springs.smooth}
            className="flex border-b pb-2"
          >
            <motion.input 
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              animate={{
                opacity: isFocused ? 1 : 0.6,
              }}
              className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs w-full text-white placeholder:text-white/20 uppercase tracking-widest transition-opacity duration-300" 
              placeholder={isFocused ? "" : "EMAIL ADDRESS"} 
              type="email"
            />
            <button className="material-symbols-outlined text-primary hover:text-white transition-colors">chevron_right</button>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-container-max mx-auto px-gutter mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="font-display text-[9px] tracking-[0.4em] text-white/20 uppercase">
          © 2024 AVELIS. CRAFTED FOR THE DISCERNING BIBLIOPHILE.
        </p>
        <div className="flex gap-10">
          <span className="material-symbols-outlined text-white/20 text-sm">volume_up</span>
          <span className="material-symbols-outlined text-white/20 text-sm">visibility</span>
        </div>
      </div>
    </footer>
  );
};
