import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { Link } from "react-router-dom";
export const CollectionsHero = () => {
    return (<AnimatedSection variant="A" className="relative px-gutter max-w-container-max mx-auto text-center pt-32 pb-20">
      <nav className="mb-8">
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-on-background/60">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link> / <span className="text-primary">Collections</span>
        </span>
      </nav>
      <h1 className="font-display text-4xl md:text-7xl mb-6 tracking-tight text-on-background">
        THE CURATED<br />COLLECTIONS
      </h1>
      <p className="font-body text-lg text-on-background/60 max-w-2xl mx-auto mb-12">
        Explore carefully curated literary collections spanning philosophy, business, science, history, fiction and timeless classics.
      </p>
      <div className="w-px h-24 bg-gradient-to-b from-primary/50 to-transparent mx-auto"></div>
    </AnimatedSection>);
};
