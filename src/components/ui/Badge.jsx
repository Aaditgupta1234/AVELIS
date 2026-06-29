import { cn } from "../../utils/cn";
export const Badge = ({ className, variant = "default", children, ...props }) => {
    return (<span className={cn("inline-flex items-center px-2.5 py-0.5 rounded font-inter text-xs font-semibold uppercase tracking-widest transition-colors", {
            "bg-gold-primary/10 text-gold-primary": variant === "default",
            "border border-white/20 text-text-secondary": variant === "outline",
        }, className)} {...props}>
      {children}
    </span>);
};
