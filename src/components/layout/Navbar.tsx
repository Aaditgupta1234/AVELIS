import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 border-b border-white/5",
        scrolled ? "bg-background/80 backdrop-blur-xl py-4" : "py-6"
      )}
    >
      <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center">
        <div className="font-display text-2xl tracking-[0.2em] text-primary">AVELIS</div>
        <div className="hidden lg:flex gap-12 font-display text-[11px] tracking-[0.2em] uppercase">
          <a className="hover:text-primary transition-colors text-primary" href="#">Collections</a>
          <a className="hover:text-primary transition-colors" href="#">Library</a>
          <a className="hover:text-primary transition-colors" href="#">The Experience</a>
          <a className="hover:text-primary transition-colors" href="#">Journal</a>
        </div>
        <div className="flex items-center gap-8">
          <button className="material-symbols-outlined text-primary scale-90">search</button>
          <button className="bg-primary text-on-primary px-8 py-3 font-display text-[10px] tracking-[0.2em] uppercase hover:brightness-110 transition-all">
            Join the Circle
          </button>
        </div>
      </div>
    </nav>
  );
};
