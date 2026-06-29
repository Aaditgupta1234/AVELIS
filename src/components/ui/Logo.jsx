import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
export const Logo = ({ className, ...props }) => {
    return (<motion.div whileHover={{ scale: 1.05 }} className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
      <div className="w-8 h-8 bg-gold-primary flex items-center justify-center rounded-sm">
        <span className="font-cinzel text-bg-primary font-bold text-xl leading-none">A</span>
      </div>
      <span className="font-cinzel text-xl font-semibold tracking-widest text-text-primary uppercase">
        Avelis
      </span>
    </motion.div>);
};
