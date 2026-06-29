import { AnimatedSection } from "../../components/ui/AnimatedSection";
export const ReadingQuote = () => {
    return (<AnimatedSection variant="A" className="py-section-padding bg-surface-variant/20 relative border-t border-white/5">
      <div className="px-gutter max-w-3xl mx-auto text-center relative z-10">
        <span className="material-symbols-outlined text-primary mb-8 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          format_quote
        </span>
        <blockquote className="font-display text-2xl md:text-3xl italic mb-10 leading-relaxed text-white">
          "A library is not merely a collection of books, but a collection of minds across generations."
        </blockquote>
        <div className="w-12 h-px bg-primary mx-auto mb-6"></div>
        <cite className="font-display text-[10px] text-white/50 uppercase tracking-[0.3em] not-italic">
          THE AVELIS ARCHIVE PHILOSOPHY
        </cite>
      </div>
    </AnimatedSection>);
};
