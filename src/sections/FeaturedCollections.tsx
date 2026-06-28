export const FeaturedCollections = () => {
  return (
    <section className="py-section-padding px-gutter relative z-10">
      <div className="max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
          <div>
            <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Curated Selections</p>
            <h2 className="font-display text-4xl md:text-5xl">The Season's Anthology</h2>
          </div>
          <a className="font-display text-[11px] tracking-[0.2em] text-primary hover:text-white transition-colors border-b border-primary/20 pb-2" href="#">
            VIEW ALL ARCHIVES
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Book Card 1 (Large) */}
          <div className="lg:col-span-2 group">
            <div className="relative overflow-hidden aspect-[16/10] bg-surface-variant gold-border-hover">
              <img 
                alt="The Silent Library" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnTfko1oBkPcKBiPzij8xCRpy--PxCYJj60yN3yhd9JocIcU4ajGcb7xoDLYFhqTuuw2uyACszZ4cNzdqm53i8FOWf0lX2wxECQbx0OmwLCJKA0TD396WkiCbKrrnHuj_Ra37lOFohhuA3-3Pvr9ATiM4pmS6CXjbfnSqAsM6rR-O3d6zR8iLwwXD5KiLyHO_dLSCAb11OFn65HuEYIKm5uxixK4TQFwst7LX-QOwqLjtyezOTvEDsMAymuocG-Ylv-OiqvFV5a0zG"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              <div className="absolute bottom-8 left-8">
                <span className="bg-primary/20 backdrop-blur-md px-3 py-1 text-[8px] font-display text-primary tracking-widest uppercase border border-primary/30 mb-4 inline-block">
                  Editor's Pick
                </span>
                <h3 className="font-display text-3xl mb-1">The Silent Library</h3>
                <p className="font-display text-[10px] text-primary/70 tracking-widest">JULIAN VANCE • 2024</p>
              </div>
            </div>
          </div>

          {/* Book Card 2 */}
          <div className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-variant gold-border-hover mb-6">
              <img 
                alt="Echoes of Gold" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU52ijSLmU_qjFNUOAerhdUpQteDYp-nWFtLh4voF6DSU1RngPE1bZDKVyFE_Ins5b-fhz-TrYm1qt2hcbhLpWVUW1zU0TLNCasw1eIY670L4VxFWnA8DGthNY8apX-Nf1Ls_wAuTQxzX7InGTYZnEji853jaJRGQYDVe7t5YnSOk0BI2sZOjGwDI8Tpg5qAOGSvPMJiv5XPUzIbspiXhX-LrfHMNLuTOH7BCEvrDngvT9YzV3GVjAVcQC74f7I0WGgk3DAT2cOk2Q"
              />
              <div className="absolute top-4 right-4 h-8 w-8 bg-background/80 flex items-center justify-center rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-sm">bookmark</span>
              </div>
            </div>
            <h3 className="font-display text-xl mb-1">Echoes of Gold</h3>
            <p className="font-display text-[10px] text-primary/70 tracking-widest uppercase">ELARA STERLING</p>
          </div>

          {/* Book Card 3 */}
          <div className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-variant gold-border-hover mb-6">
              <img 
                alt="The Botanical Guild" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeJgiCbSFFXnJYQlPQxoJEuc8uvF07iNbjx-4cy6obuU8uvCGy3KQy9GNov2qUFPpcCDfUJKsHpYE98S1FGQdL_x6aPw5ggWqUjDsSA8Zg1nrW492CEsPwHTtmxZ5YCXYnMpikOx-nMFlq3o8EMnARZTUflvpm3mF2XZ2tk_WsDnSESEjfECww2PB_aIa-OqpQZEZdsLySkc9vg1OmwQo6Ur9Weo_TEnBQtm69GnBidXM2wk4ZgU8cXW70NmOJlkyP7RF70rIzmt9z"
              />
              <div className="absolute top-4 right-4 h-8 w-8 bg-background/80 flex items-center justify-center rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-sm">bookmark</span>
              </div>
            </div>
            <h3 className="font-display text-xl mb-1">The Botanical Guild</h3>
            <p className="font-display text-[10px] text-primary/70 tracking-widest uppercase">DR. ARIS THORNE</p>
          </div>

        </div>
      </div>
    </section>
  );
};
