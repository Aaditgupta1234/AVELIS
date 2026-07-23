import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
export const Logo = ({ className, ...props }) => {
    return (<motion.div whileHover={{ scale: 1.05 }} className={cn("font-display text-2xl tracking-[0.2em] text-primary cursor-pointer uppercase", className)} {...props}>
      AVELIS
    </motion.div>);
};
