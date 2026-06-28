
import { cn } from "../../utils/cn";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface SectionTitleProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
}

export const SectionTitle = ({
  title,
  subtitle,
  align = "center",
  className,
  ...props
}: SectionTitleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={cn(
        "flex flex-col gap-4",
        {
          "text-left": align === "left",
          "text-center items-center": align === "center",
          "text-right items-end": align === "right",
        },
        className
      )}
      {...props}
    >
      {subtitle && (
        <span className="text-gold-primary uppercase tracking-[0.15em] font-semibold text-xs font-inter">
          {subtitle}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl text-text-primary font-cinzel leading-[1.3]">
        {title}
      </h2>
      <div className="w-12 h-[1px] bg-gold-primary/50 mt-2 relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border border-gold-primary/50 bg-bg-primary"></div>
      </div>
    </motion.div>
  );
};
