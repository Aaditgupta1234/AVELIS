export const Footer = () => {
  return (
    <footer className="py-section-padding border-t border-white/5 bg-background">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-4 gap-20">
        <div className="lg:col-span-1">
          <div className="font-display text-4xl text-primary mb-8 tracking-[0.2em]">AVELIS</div>
          <p className="text-on-background/50 font-light text-sm leading-relaxed mb-8">
            An ecosystem dedicated to the preservation and elevation of the written word. Crafting digital sanctuaries for the discerning bibliophile.
          </p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer transition-colors">public</span>
            <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer transition-colors">terminal</span>
            <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer transition-colors">draw</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">The Sanctuary</h4>
          <ul className="space-y-4 text-xs font-display tracking-[0.1em] text-white/40 uppercase">
            <li><a className="hover:text-primary transition-colors" href="#">The Founders</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Bespoke Commissions</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Archival Access</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Journal</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">Governance</h4>
          <ul className="space-y-4 text-xs font-display tracking-[0.1em] text-white/40 uppercase">
            <li><a className="hover:text-primary transition-colors" href="#">Patron Rights</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Ethics Statement</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-10">The Newsletter</h4>
          <p className="text-on-background/50 text-xs mb-6 font-light">Receive rare updates from our archival scouts.</p>
          <div className="flex border-b border-primary/20 pb-2">
            <input 
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-full placeholder:text-white/20 uppercase tracking-widest" 
              placeholder="EMAIL ADDRESS" 
              type="email"
            />
            <button className="material-symbols-outlined text-primary">chevron_right</button>
          </div>
        </div>
      </div>
      
      <div className="max-w-container-max mx-auto px-gutter mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="font-display text-[9px] tracking-[0.4em] text-white/20 uppercase">
          © 2024 AVELIS. CRAFTED FOR THE DISCERNING BIBLIOPHILE.
        </p>
        <div className="flex gap-10">
          <span className="material-symbols-outlined text-white/20 text-sm">volume_up</span>
          <span className="material-symbols-outlined text-white/20 text-sm">visibility</span>
        </div>
      </div>
    </footer>
  );
};
