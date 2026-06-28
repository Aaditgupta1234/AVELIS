export const FinalCTA = () => {
  return (
    <section className="py-40 relative overflow-hidden text-center px-gutter z-10">
      <div className="max-w-4xl mx-auto space-y-12">
        <h2 className="font-display text-6xl md:text-8xl leading-tight">Your Next Story <br/> Starts Here.</h2>
        <div className="w-full h-[1px] bg-primary/20 relative divider-diamond mb-12"></div>
        <p className="text-on-background/60 text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Step into the AVELIS sanctuary. Whether you seek the wisdom of the ancients or the thrill of the modern era, your seat in the circle awaits.
        </p>
        <button className="bg-primary text-on-primary px-16 py-8 font-display text-[14px] tracking-[0.3em] uppercase hover:scale-105 transition-all shadow-2xl">
          Join the Collective
        </button>
      </div>
    </section>
  );
};
