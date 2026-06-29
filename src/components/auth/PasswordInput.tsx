import { forwardRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Eye, EyeOff } from "lucide-react";
import type { AuthInputProps } from "./AuthInput";

export const PasswordInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-2 w-full relative">
        {label && (
          <label htmlFor={id} className="font-display text-[10px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn(
              "w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,162,39,0.18)] rounded pl-4 pr-12 py-3 text-[#F7F5EE] placeholder:text-[#F7F5EE]/30 font-body text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all duration-300 h-12",
              error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F7F5EE]/40 hover:text-[#C9A227] focus:outline-none focus:text-[#C9A227] transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <span id={`${id}-error`} className="text-red-400 text-xs mt-0.5 font-body" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
