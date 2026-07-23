import { AnimatedSection } from "../../components/ui/AnimatedSection";
export const CollectionsHero = () => {
    return (<AnimatedSection variant="A" className="relative px-gutter max-w-container-max mx-auto text-center pt-8 pb-6">
      <h1 className="font-display text-4xl md:text-7xl mb-6 tracking-tight text-on-background">
        THE CURATED<br />COLLECTIONS
      </h1>
      <p className="font-body text-lg text-on-background/60 max-w-2xl mx-auto mb-4">
        Explore carefully curated literary collections spanning philosophy, business, science, history, fiction and timeless classics.
      </p>
    </AnimatedSection>);
};
