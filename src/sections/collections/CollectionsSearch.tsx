import { AnimatedSection } from "../../components/ui/AnimatedSection";

export const CollectionsSearch = () => {
  return (
    <AnimatedSection variant="B" className="px-gutter max-w-container-max mx-auto mb-24">
      <div className="glass-panel border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between p-6 relative z-10">
        
        <div className="relative w-full md:w-[65%]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-background/50">search</span>
          <input 
            className="w-full bg-transparent border-b border-white/10 focus:border-primary outline-none py-3 pl-12 pr-4 font-body text-on-background transition-all placeholder:text-on-background/50" 
            placeholder="Search the archive..." 
            type="text"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select className="bg-transparent border-b border-white/10 focus:border-primary outline-none py-3 px-4 font-display text-[10px] uppercase tracking-[0.2em] text-on-background w-full md:w-40 appearance-none cursor-pointer">
            <option className="bg-background">Categories</option>
            <option className="bg-background">Philosophy</option>
            <option className="bg-background">Business</option>
            <option className="bg-background">Science</option>
          </select>
          <select className="bg-transparent border-b border-white/10 focus:border-primary outline-none py-3 px-4 font-display text-[10px] uppercase tracking-[0.2em] text-on-background w-full md:w-40 appearance-none cursor-pointer">
            <option className="bg-background">Sort By</option>
            <option className="bg-background">Newest</option>
            <option className="bg-background">Most Read</option>
            <option className="bg-background">A-Z</option>
          </select>
        </div>
        
        <div className="font-display text-[10px] text-on-background/50 uppercase tracking-[0.2em] px-4 border-l border-white/10 hidden md:block">
          124 Results
        </div>
        
      </div>
    </AnimatedSection>
  );
};
