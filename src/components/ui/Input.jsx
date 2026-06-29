import { forwardRef } from "react";
import { cn } from "../../utils/cn";
export const Input = forwardRef(({ className, error, ...props }, ref) => {
    return (<input ref={ref} className={cn("w-full bg-transparent border-b border-text-primary/20 py-2 text-text-primary placeholder:text-text-secondary/50 font-inter focus:outline-none focus:border-gold-primary transition-colors", error && "border-red-500 focus:border-red-500", className)} {...props}/>);
});
Input.displayName = "Input";
