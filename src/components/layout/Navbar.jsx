import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { springs } from "../../utils/motion";
import { SearchModal } from "../ui/SearchModal";
import { NAVIGATION_LINKS } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";
import { ProfileDropdown } from "../auth/ProfileDropdown";
import { ChevronDown } from "lucide-react";
export const Navbar = () => {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const searchButtonRef = useRef(null);
    const prevSearchOpen = useRef(isSearchOpen);
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const navLinks = isAuthenticated
        ? [...NAVIGATION_LINKS, { name: "Dashboard", path: "/dashboard" }]
        : NAVIGATION_LINKS;
    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });
    useEffect(() => {
        if (prevSearchOpen.current && !isSearchOpen) {
            searchButtonRef.current?.focus();
        }
        prevSearchOpen.current = isSearchOpen;
    }, [isSearchOpen]);
    return (<>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}/>
      
      <motion.nav initial={{ backgroundColor: "rgba(10, 10, 10, 0)", backdropFilter: "blur(0px)", borderBottomColor: "rgba(255,255,255,0)" }} animate={{
            paddingTop: scrolled ? "1rem" : "1.5rem",
            paddingBottom: scrolled ? "1rem" : "1.5rem",
            backgroundColor: scrolled ? "rgba(10, 10, 10, 0.8)" : "rgba(10, 10, 10, 0)",
            backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
            borderBottomColor: scrolled ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0)",
        }} transition={springs.smooth} className="fixed top-0 w-full z-50 border-b border-white/5">
        <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center">
          <Link to="/">
            <motion.div whileHover={{ scale: 1.02 }} transition={springs.smooth} className="font-display text-2xl tracking-[0.2em] text-primary cursor-pointer">
              AVELIS
            </motion.div>
          </Link>
          <div className="hidden lg:flex gap-12 font-display text-[11px] tracking-[0.2em] uppercase">
            {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (<Link to={link.path} key={link.name}>
                  <div className="relative cursor-pointer group">
                    <span className={`transition-colors duration-300 ${isActive ? "text-primary" : "text-white/60 group-hover:text-primary"}`}>
                      {link.name}
                    </span>
                    {isActive && (<motion.div layoutId="navbar-underline" className="absolute -bottom-1 left-0 right-0 h-[1px] bg-primary" transition={springs.smooth}/>)}
                  </div>
                </Link>);
        })}
          </div>
          <div className="flex items-center gap-8">
            <motion.button ref={searchButtonRef} onClick={() => setIsSearchOpen(true)} whileHover={{ rotate: 5, color: "var(--color-primary)" }} transition={springs.smooth} className="material-symbols-outlined text-white/80 scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full cursor-pointer">
              search
            </motion.button>

            <AnimatePresence mode="wait">
              {isAuthenticated ? (<motion.div key="user-profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="relative">
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none cursor-pointer group" aria-expanded={isProfileOpen} aria-haspopup="true">
                    <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full border border-primary/30 group-hover:border-primary transition-colors"/>
                    <span className="hidden sm:inline font-display text-[10px] tracking-[0.2em] text-[#F7F5EE]/80 group-hover:text-primary uppercase transition-colors">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#F7F5EE]/50 group-hover:text-primary transition-colors"/>
                  </button>
                  <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}/>
                </motion.div>) : (<motion.div key="join-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Link to="/login">
                    <motion.button whileHover={{
                y: -2,
                boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.3)",
                background: "linear-gradient(45deg, rgba(212,175,55,1) 0%, rgba(230,195,85,1) 100%)"
            }} whileTap={{ scale: 0.98 }} transition={{ ...springs.buttonClick, y: springs.smooth }} className="bg-primary text-on-primary px-8 py-3 font-display text-[10px] tracking-[0.2em] uppercase transition-colors cursor-pointer">
                      Join the Circle
                    </motion.button>
                  </Link>
                </motion.div>)}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
    </>);
};
