export const Testimonials = () => {
  return (
    <section className="py-section-padding bg-surface/20 border-y border-white/5 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="text-center mb-20">
          <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Reader Reflections</p>
          <h2 className="font-display text-4xl">Voices from the Study</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="glass-panel p-16 relative border-l-4 border-primary">
            <p className="font-display text-2xl italic leading-relaxed text-white/90 mb-12">
              "AVELIS has transformed my relationship with digital reading. It no longer feels like a utility, but a ritual. The typography and dark environment are unparalleled."
            </p>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img 
                  alt="Clara Hemmingway" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2b-KANMlJL4ie-hWzoBx6aV8QEfOqJZD0lrZitnvSyZWLlMebHMEz1fmmAxIPSizP8O_U0OsCN0sK8aNjd17tdJQOhGLxH00x0P3wqiN4UvN3WfuZyNLw3qbGX2Hz1JxML4k0ip1pGMjlReyKwyzj2bOGhpJlK2OlhoTIWIfUDxapzZNzEyWcDpXOfzhochGvc3qtUFCC4qOCpFkYKJ_TgjbfGtsRDAghaTsyTpx2TAts9GRg3SwxVVO_UXu6yeGFdLCpRy4oFo-U"
                />
              </div>
              <div>
                <p className="font-display text-lg">Clara Hemmingway</p>
                <p className="font-display text-[9px] tracking-[0.2em] text-primary uppercase">Literary Critic</p>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-16 relative border-l-4 border-primary">
            <p className="font-display text-2xl italic leading-relaxed text-white/90 mb-12">
              "The archive of first editions is a scholar's dream. Being able to cross-reference physical rarity with digital convenience in such a beautiful interface is remarkable."
            </p>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img 
                  alt="Arthur Penhaligon" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-6cn_FuVEPCaVWTXkKxuBXhbMhiEnZ7_A-4MbNp1EOrEuredN_GxJEznKkSeyVPIx4-MSrFb0gPGK54ZU1jEZ8ug7MKD38athBd8RCVnsJQplbg-rDHuBXoixkXizN_P31-8b50aCzJ-XnNhM722OJef9RT9_269D25h5DPMsMjWSLoNtIsdW8sC5rDiv84AMYpJLAOErPpRnLhpyzTt4Tw2boUPIrwlXCr0fqFpdJs17bD7bQ851NPI5Ivr1MD40Vm6mHlqR6v90"
                />
              </div>
              <div>
                <p className="font-display text-lg">Arthur Penhaligon</p>
                <p className="font-display text-[9px] tracking-[0.2em] text-primary uppercase">Archival Historian</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
