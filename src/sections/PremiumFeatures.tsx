export const PremiumFeatures = () => {
  return (
    <section className="py-section-padding px-gutter relative z-10">
      <div className="max-w-container-max mx-auto">
        <h2 className="font-display text-4xl text-center mb-20 uppercase tracking-[0.2em]">The Patronage Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">workspace_premium</span>
            <h3 className="font-display text-2xl mb-4">The Circle Access</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              Exclusive entry to author salons, private archives, and early access to bespoke physical commissions.
            </p>
          </div>
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">inventory_2</span>
            <h3 className="font-display text-2xl mb-4">Physical Inheritance</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              A seamless bridge between digital ownership and handcrafted hardcover first editions for your physical library.
            </p>
          </div>
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">psychology</span>
            <h3 className="font-display text-2xl mb-4">The Oracle AI</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              A proprietary recommendation engine that understands the nuances of your literary taste through semantic analysis.
            </p>
          </div>
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">history</span>
            <h3 className="font-display text-2xl mb-4">Immutable Archives</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              Your collection is preserved forever on a decentralized ledger, ensuring your digital heritage remains yours.
            </p>
          </div>
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">menu_book</span>
            <h3 className="font-display text-2xl mb-4">Curated Journals</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              Receive quarterly editorial journals featuring essays and long-form reviews from today's leading critics.
            </p>
          </div>
          
          <div className="glass-panel p-12 border border-primary/20 group hover:border-primary transition-all">
            <span className="material-symbols-outlined text-primary mb-8 scale-150 block">support_agent</span>
            <h3 className="font-display text-2xl mb-4">Archival Concierge</h3>
            <p className="text-on-background/60 font-light leading-relaxed">
              Dedicated assistance for finding rare texts, managing commissions, and navigating our vast archives.
            </p>
          </div>
          
        </div>
      </div>
    </section>
  );
};
