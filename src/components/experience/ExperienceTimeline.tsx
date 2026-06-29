import { motion } from "framer-motion";
import { easeOut } from "../../utils/motion";

export const ExperienceTimeline = () => {
  return (
    <div className="relative h-[120px] w-full flex justify-center items-center overflow-hidden pointer-events-none">
      {/* Vertical connector line */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.8, ease: easeOut }}
        className="w-[1px] h-full bg-gradient-to-b from-transparent via-primary to-transparent origin-top"
      />
      
      {/* Center diamond glyph */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 100 }}
        className="absolute text-[8px] text-primary select-none bg-[#07111F] px-3 py-1"
      >
        ◆
      </motion.div>
    </div>
  );
};
