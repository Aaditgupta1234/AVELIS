import { Search as SearchIcon } from "lucide-react";
import { Input, type InputProps } from "./Input";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export const Search = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative w-full max-w-md", className)}>
        <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
        <Input
          ref={ref}
          className="pl-8"
          placeholder="Search the archives..."
          {...props}
        />
      </div>
    );
  }
);

Search.displayName = "Search";
