import { forwardRef } from "react";
import { cn } from "../../utils/cn";
export const AuthInput = forwardRef(({ className, label, error, id, type = "text", ...props }, ref) => {
    return (<div className="flex flex-col gap-2 w-full">
        {label && (<label htmlFor={id} className="font-display text-[10px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
            {label}
          </label>)}
        <input ref={ref} id={id} type={type} className={cn("w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] placeholder:text-[#F7F5EE]/30 font-body text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all duration-300 h-12", error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500", className)} aria-invalid={error ? "true" : "false"} aria-describedby={error ? `${id}-error` : undefined} {...props}/>
        {error && (<span id={`${id}-error`} className="text-red-400 text-xs mt-0.5 font-body" role="alert">
            {error}
          </span>)}
      </div>);
});
AuthInput.displayName = "AuthInput";
