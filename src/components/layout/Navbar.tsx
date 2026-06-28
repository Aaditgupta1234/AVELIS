import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { springs } from "../../utils/motion";
import { SearchModal } from "../ui/SearchModal";

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("Collections");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const prevSearchOpen = useRef(isSearchOpen);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  useEffect(() => {
    // If search modal just closed, return focus to search button
    if (prevSearchOpen.current && !isSearchOpen) {
      searchButtonRef.current?.focus();
    }
    prevSearchOpen.current = isSearchOpen;
  }, [isSearchOpen]);

  const links = ["Collections", "Library", "The Experience", "Journal"];

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      <motion.nav
        initial={{ backgroundColor: "rgba(10, 10, 10, 0)", backdropFilter: "blur(0px)", borderBottomColor: "rgba(255,255,255,0)" }}
        animate={{
          paddingTop: scrolled ? "1rem" : "1.5rem",
          paddingBottom: scrolled ? "1rem" : "1.5rem",
          backgroundColor: scrolled ? "rgba(10, 10, 10, 0.8)" : "rgba(10, 10, 10, 0)",
          backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
          borderBottomColor: scrolled ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0)",
        }}
        transition={springs.smooth}
        className="fixed top-0 w-full z-50 border-b border-white/5"
      >
        <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={springs.smooth}
            className="font-display text-2xl tracking-[0.2em] text-primary cursor-pointer"
          >
            AVELIS
          </motion.div>
          <div className="hidden lg:flex gap-12 font-display text-[11px] tracking-[0.2em] uppercase">
            {links.map((link) => (
              <div
                key={link}
                className="relative cursor-pointer"
                onMouseEnter={() => setActiveLink(link)}
              >
                <span className={`transition-colors duration-300 ${activeLink === link ? "text-primary" : "text-white/60 hover:text-primary"}`}>
                  {link}
                </span>
                {activeLink === link && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute -bottom-1 left-0 right-0 h-[1px] bg-primary"
                    transition={springs.smooth}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-8">
            <motion.button
              ref={searchButtonRef}
              onClick={() => setIsSearchOpen(true)}
              whileHover={{ rotate: 5, color: "var(--color-primary)" }}
              transition={springs.smooth}
              className="material-symbols-outlined text-white/80 scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
            >
              search
            </motion.button>
            <motion.button
              whileHover={{ 
                y: -2, 
                boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.3)",
                background: "linear-gradient(45deg, rgba(212,175,55,1) 0%, rgba(230,195,85,1) 100%)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ ...springs.buttonClick, y: springs.smooth }}
              className="bg-primary text-on-primary px-8 py-3 font-display text-[10px] tracking-[0.2em] uppercase transition-colors"
            >
              Join the Circle
            </motion.button>
          </div>
        </div>
      </motion.nav>
    </>
  );
};
