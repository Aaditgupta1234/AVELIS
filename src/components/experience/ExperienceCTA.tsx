import { motion as motionFramer } from "framer-motion";
import { Link } from "react-router-dom";
import { springs } from "../../utils/motion";
import { AnimatedSection } from "../ui/AnimatedSection";

export const ExperienceCTA = () => {
  return (
    <AnimatedSection variant="A" className="py-section-padding relative overflow-hidden text-center px-gutter bg-surface-container-lowest/30 backdrop-blur-md border-t border-white/5">
      {/* Decorative background diamond */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-primary/5 text-[240px] pointer-events-none select-none z-0">
        ◆
      </div>

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">
        <h2 className="font-display text-4xl md:text-6xl text-on-background leading-tight">
          Your next unforgettable<br />story begins here.
        </h2>

        {/* Pure React Diamond Divider */}
        <div className="w-full h-[1px] bg-primary/20 relative my-12 flex justify-center items-center">
          <span className="text-primary text-sm bg-[#07111F] px-4 absolute select-none">
            ◆
          </span>
        </div>

        <p className="font-body text-base md:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed opacity-80 italic">
          Step into the AVELIS sanctuary. Whether you seek the wisdom of the ancients or the thrill of the modern era, your seat in the circle awaits.
        </p>

        <div className="pt-8 flex justify-center">
          <Link to="/library">
            <motionFramer.button
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0px 10px 30px -5px rgba(201, 162, 39, 0.4)",
                filter: "brightness(1.1)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="bg-primary text-on-primary px-12 py-5 rounded-xl font-body text-xs tracking-[0.2em] font-bold uppercase transition-all shadow-xl shadow-primary/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-[#07111F]"
            >
              EXPLORE THE LIBRARY
            </motionFramer.button>
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
};
