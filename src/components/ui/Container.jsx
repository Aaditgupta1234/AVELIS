import { cn } from "../../utils/cn";
export const Container = ({ className, children, ...props }) => {
    return (<div className={cn("max-w-[1280px] mx-auto px-5 md:px-8 w-full", className)} {...props}>
      {children}
    </div>);
};
