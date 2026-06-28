export const Categories = () => {
  return (
    <section className="py-section-padding bg-surface/30 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter text-center">
        <h2 className="font-display text-4xl mb-20 uppercase tracking-widest">Curated Domains</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">castle</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">Fantasy</p>
          </div>
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">history_edu</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">History</p>
          </div>
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">foundation</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">Philosophy</p>
          </div>
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">rocket_launch</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">Sci-Fi</p>
          </div>
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">palette</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">Arts</p>
          </div>
          
          <div className="glass-panel p-10 hover:bg-primary/10 transition-all group cursor-pointer border border-white/5">
            <span className="material-symbols-outlined text-primary mb-6 scale-150 block opacity-70 group-hover:opacity-100">terminal</span>
            <p className="font-display text-[11px] tracking-[0.3em] uppercase">Technology</p>
          </div>
          
        </div>
      </div>
    </section>
  );
};
