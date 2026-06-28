import { Hero3DScene } from "../components/ui/Hero3DScene";

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center pt-20 overflow-hidden px-gutter relative z-10">
      <div className="max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <div className="space-y-12 animate-fade-in">
          <div className="inline-flex items-center gap-4 px-4 py-1.5 border border-primary/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            <span className="font-display text-[10px] tracking-[0.3em] text-primary uppercase">The Definitive Digital Library</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl leading-[1.1] text-white">
            EVERY STORY <br/>
            <span className="italic text-primary">BEGINS WITH</span> <br/>
            A CHOICE.
          </h1>
          
          <p className="text-on-background/70 text-lg max-w-xl font-light leading-relaxed">
            Step into a curated sanctuary where the art of literature meets modern refinement. Discover, collect, and experience the world's most significant works in an environment designed for the discerning mind.
          </p>
          
          <div className="flex flex-wrap gap-8">
            <button className="bg-primary text-on-primary px-12 py-6 font-display text-[12px] tracking-[0.2em] uppercase hover:scale-105 transition-transform shadow-2xl">
              Explore Archives
            </button>
            <button className="border border-primary/30 text-white px-12 py-6 font-display text-[12px] tracking-[0.2em] uppercase hover:bg-primary/5 transition-colors">
              The Experience
            </button>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full"></div>
          <Hero3DScene />
        </div>
        
      </div>
    </section>
  );
};
