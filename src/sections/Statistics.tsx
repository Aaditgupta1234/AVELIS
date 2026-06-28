export const Statistics = () => {
  return (
    <section className="py-24 bg-surface-variant/40 border-y border-white/5 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-2 lg:grid-cols-4 gap-16 text-center">
        <div>
          <p className="font-display text-5xl text-primary mb-2">100K+</p>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase">Global Readers</p>
        </div>
        <div>
          <p className="font-display text-5xl text-primary mb-2">50K+</p>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase">First Editions</p>
        </div>
        <div>
          <p className="font-display text-5xl text-primary mb-2">1.2M+</p>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase">Archival Downloads</p>
        </div>
        <div>
          <p className="font-display text-5xl text-primary mb-2">99%</p>
          <p className="font-display text-[10px] tracking-[0.3em] text-white/50 uppercase">Scholastic Rating</p>
        </div>
      </div>
    </section>
  );
};
