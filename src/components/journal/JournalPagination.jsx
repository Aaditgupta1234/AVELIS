import { AnimatedSection } from "../ui/AnimatedSection";
export const JournalPagination = () => {
    return (<AnimatedSection variant="C" className="mt-24 flex justify-center items-center gap-12 max-w-container-max mx-auto px-gutter">
      <button type="button" className="text-on-surface-variant/30 hover:text-primary transition-all duration-300 flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl px-4 py-2">
        <span className="material-symbols-outlined select-none text-xl">arrow_back</span>
        <span className="font-display text-sm uppercase tracking-wider font-semibold">Previous</span>
      </button>
      
      <div className="w-[1px] h-8 bg-outline-variant/20"></div>
      
      <button type="button" className="text-on-surface hover:text-primary transition-all duration-300 flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl px-4 py-2">
        <span className="font-display text-sm uppercase tracking-wider font-semibold">Next</span>
        <span className="material-symbols-outlined select-none text-xl">arrow_forward</span>
      </button>
    </AnimatedSection>);
};
export default JournalPagination;
