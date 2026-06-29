import { AnimatedSection } from "../ui/AnimatedSection";

export const JournalHero = () => {
  return (
    <AnimatedSection variant="A" className="text-center mb-16 max-w-container-max mx-auto">
      <h1 className="font-display text-5xl md:text-7xl mb-6 text-on-background tracking-tight">
        Reading Journal
      </h1>
      <p className="font-body text-base md:text-lg lg:text-xl text-on-surface-variant max-w-2xl mx-auto italic opacity-80">
        "A sanctuary for your literary reflections and quiet insights."
      </p>
      
      {/* Pure React Diamond Divider */}
      <div className="relative w-full h-[1px] bg-outline-variant/20 my-12 flex justify-center items-center">
        <span className="text-primary text-sm bg-[#07111F] px-4 absolute select-none">
          ◆
        </span>
      </div>
    </AnimatedSection>
  );
};
