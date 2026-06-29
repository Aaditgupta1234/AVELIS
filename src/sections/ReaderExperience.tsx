export const ReaderExperience = () => {
  return (
    <section id="reader-experience" className="py-section-padding px-gutter overflow-hidden relative z-10">
      <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        
        <div className="relative order-2 lg:order-1">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-150"></div>
          <img 
            alt="Device Showcase" 
            className="relative z-10 w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrfA7BAEvYVrXr4qH72poM_KTDMuM_FjnG8j-BhOA-KuNmFrqmbyFOixw49q0PMPgm73p02YcnZ1UZGAuzitReHb3uE0vPmtYoKkhT479waBDJRsx_I_3t27am1mAVCYq4Fygz33tpV4aQv1VqmSD9eMqQuSbenu840SVeuZL_MYT_IyMb1aoV4qhcV4ec8OYzVcbD0-BFnNvYSJ-W9AV531DuRhn4C-4MabTEgI4lpgYkBc3R-i_xHOnUzKqRx8Mm2WKwWF4JrugR"
          />
        </div>
        
        <div className="space-y-12 order-1 lg:order-2">
          <div className="space-y-4">
            <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase">Interface</p>
            <h2 className="font-display text-5xl leading-tight">Refined for the <br/>Modern Scholar</h2>
          </div>
          
          <div className="space-y-10">
            <div className="flex gap-8">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-primary/20 text-primary">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              <div>
                <h4 className="font-display text-xl mb-2">Digital Paper™ Experience</h4>
                <p className="text-on-background/60 font-light leading-relaxed">
                  Proprietary rendering engine that mimics the eye-comfort and texture of heavy cream paper.
                </p>
              </div>
            </div>
            
            <div className="flex gap-8">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-primary/20 text-primary">
                <span className="material-symbols-outlined">ink_highlighter</span>
              </div>
              <div>
                <h4 className="font-display text-xl mb-2">Gilded Annotations</h4>
                <p className="text-on-background/60 font-light leading-relaxed">
                  Capture your insights with a suite of analytical tools designed for deep reading and research.
                </p>
              </div>
            </div>
            
            <div className="flex gap-8">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-primary/20 text-primary">
                <span className="material-symbols-outlined">sync</span>
              </div>
              <div>
                <h4 className="font-display text-xl mb-2">Omni-Synchronicity</h4>
                <p className="text-on-background/60 font-light leading-relaxed">
                  Your library and progress, flawlessly preserved across every refined device you own.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};
