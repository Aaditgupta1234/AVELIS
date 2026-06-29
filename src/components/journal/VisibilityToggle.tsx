import { motion } from "framer-motion";
import { springs } from "../../utils/motion";

interface VisibilityToggleProps {
  value: "private" | "public";
  onChange: (value: "private" | "public") => void;
}

export const VisibilityToggle = ({ value, onChange }: VisibilityToggleProps) => {
  return (
    <div 
      role="tablist"
      aria-label="Entry visibility"
      className="flex bg-surface-container/60 rounded-full p-1 border border-outline-variant/10 relative w-full h-[44px] items-center"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "private"}
        onClick={() => onChange("private")}
        className={`flex-1 h-full flex items-center justify-center gap-2 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          value === "private" ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span 
          className="material-symbols-outlined text-sm select-none" 
          style={{ fontVariationSettings: value === "private" ? "'FILL' 1" : "'FILL' 0" }}
        >
          lock
        </span>
        Private
        
        {value === "private" && (
          <motion.div
            layoutId="active-visibility-pill"
            className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/10"
            transition={springs.smooth}
          />
        )}
      </button>
      
      <button
        type="button"
        role="tab"
        aria-selected={value === "public"}
        onClick={() => onChange("public")}
        className={`flex-1 h-full flex items-center justify-center gap-2 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          value === "public" ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span 
          className="material-symbols-outlined text-sm select-none" 
          style={{ fontVariationSettings: value === "public" ? "'FILL' 1" : "'FILL' 0" }}
        >
          public
        </span>
        Public
        
        {value === "public" && (
          <motion.div
            layoutId="active-visibility-pill"
            className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/10"
            transition={springs.smooth}
          />
        )}
      </button>
    </div>
  );
};
export default VisibilityToggle;
