export const TrustedBy = () => {
  return (
    <section className="py-24 border-y border-white/5 bg-surface-variant/20 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter text-center">
        <p className="font-display text-[10px] tracking-[0.4em] text-primary/60 uppercase mb-12">
          Endorsed by the Global Literary Elite
        </p>
        <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
          <span className="font-display text-xl tracking-tighter text-white">Oxford Times</span>
          <span className="font-display text-xl tracking-tighter text-white">The Guardian</span>
          <span className="font-display text-xl tracking-tighter text-white">Literary Hub</span>
          <span className="font-display text-xl tracking-tighter text-white">Vogue Books</span>
          <span className="font-display text-xl tracking-tighter text-white">New Yorker</span>
        </div>
      </div>
    </section>
  );
};
