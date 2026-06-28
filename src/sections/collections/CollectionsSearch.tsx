import { useState } from "react";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { SEARCH_CATEGORIES, SORT_OPTIONS } from "../../utils/constants";

export const CollectionsSearch = ({ 
  query = "", 
  setQuery = (_q: string) => {}, 
  resultCount = 124 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AnimatedSection variant="B" className="px-gutter max-w-container-max mx-auto mb-24">
      <div className={`glass-panel border flex flex-col md:flex-row gap-4 items-center justify-between p-6 relative z-10 transition-all duration-300 ${isFocused ? 'border-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'border-white/10'}`}>
        
        <div className="relative w-full md:w-[65%] group">
          <span 
            className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-on-background/50'}`} 
            aria-hidden="true"
          >
            search
          </span>
          <input 
            className={`w-full bg-transparent border-b py-3 pl-12 pr-4 font-body text-on-background outline-none transition-all duration-300 ${isFocused ? 'border-primary placeholder:text-on-background/30' : 'border-white/10 placeholder:text-on-background/50'}`} 
            placeholder="Search the archive..." 
            type="text"
            aria-label="Search the archive"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select aria-label="Select Category" className="bg-transparent border-b border-white/10 focus:border-primary outline-none py-3 px-4 font-display text-[10px] uppercase tracking-[0.2em] text-on-background w-full md:w-40 appearance-none cursor-pointer transition-colors">
            <option className="bg-background">Categories</option>
            {SEARCH_CATEGORIES.map(cat => <option key={cat} className="bg-background">{cat}</option>)}
          </select>
          <select aria-label="Sort By" className="bg-transparent border-b border-white/10 focus:border-primary outline-none py-3 px-4 font-display text-[10px] uppercase tracking-[0.2em] text-on-background w-full md:w-40 appearance-none cursor-pointer transition-colors">
            <option className="bg-background">Sort By</option>
            {SORT_OPTIONS.map(opt => <option key={opt} className="bg-background">{opt}</option>)}
          </select>
        </div>
        
        <div className="font-display text-[10px] text-on-background/50 uppercase tracking-[0.2em] px-4 border-l border-white/10 hidden md:block w-32 text-right">
          {resultCount} Results
        </div>
        
      </div>
    </AnimatedSection>
  );
};
