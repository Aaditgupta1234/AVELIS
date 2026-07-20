import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs, staggers } from "../../utils/motion";

const CollectionCard = ({ item, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (<motion.div key={index} variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: springs.smooth },
        }} whileHover="hover" initial="rest" animate="rest" className="group relative overflow-hidden border border-white/10 glass-panel h-[500px] flex flex-col transition-colors duration-700 hover:border-primary/50 bg-surface/50">
      <motion.div variants={{
              rest: { y: 0, boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
              hover: {
                  y: -8,
                  boxShadow: "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)"
              },
          }} transition={springs.smooth} className="absolute inset-0 z-0 pointer-events-none"/>
      
      <motion.div variants={{
              rest: { y: 0 },
              hover: { y: -8 }
          }} transition={springs.smooth} className="flex flex-col h-full relative z-10">
        <div className="h-2/3 w-full overflow-hidden bg-surface-variant relative">
          <motion.img variants={{
              rest: { scale: 1, filter: "grayscale(100%)" },
              hover: { scale: 1.03, filter: "grayscale(0%)" },
          }} transition={springs.smooth} className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isLoaded ? 1 : 0 }} alt={item.title} src={item.image} loading="lazy" onLoad={() => setIsLoaded(true)}/>
        </div>
        
        <div className="p-8 flex flex-col justify-between flex-grow bg-surface/80 backdrop-blur-md border-t border-white/5 group-hover:border-primary/20 transition-colors">
          <div>
            <span className="font-display text-[10px] text-primary uppercase tracking-[0.2em] mb-2 block">{item.subtitle}</span>
            <h3 className="font-display text-2xl mb-2 text-white">{item.title}</h3>
            <p className="font-body text-white/60 text-sm mb-4">{item.description}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-display text-[10px] text-white/40 tracking-[0.1em]">{item.volumes}</span>
            <button className="font-display text-[10px] text-primary uppercase tracking-[0.2em] border-b border-primary/30 group-hover:border-primary pb-1 transition-all">Explore Collection</button>
          </div>
        </div>
      </motion.div>
    </motion.div>);
};

export const CollectionsGrid = ({ collections = [], isLoading = false }) => {
    return (<AnimatedSection variant="A" className="px-gutter max-w-container-max mx-auto mb-32 min-h-[500px]">
      
      {isLoading && (<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (<motion.div key={i} initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="border border-white/10 glass-panel h-[500px] flex flex-col bg-surface-variant/20">
              <div className="h-2/3 w-full bg-white/5"/>
              <div className="p-8 flex flex-col justify-between flex-grow">
                <div>
                  <div className="h-2 w-16 bg-white/10 rounded mb-4"/>
                  <div className="h-6 w-48 bg-white/10 rounded mb-4"/>
                  <div className="h-3 w-full bg-white/5 rounded mb-2"/>
                  <div className="h-3 w-3/4 bg-white/5 rounded"/>
                </div>
              </div>
            </motion.div>))}
        </div>)}

      {!isLoading && collections.length === 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center border border-white/5 glass-panel">
          <span className="material-symbols-outlined text-4xl text-primary/50 mb-6" aria-hidden="true">search_off</span>
          <h3 className="font-display text-2xl mb-4 text-white">No works were found within this collection.</h3>
          <p className="font-body text-white/60">Try broadening your search or explore another collection.</p>
        </motion.div>)}

      {!isLoading && collections.length > 0 && (<motion.div variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggers.fast } },
            }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((item, index) => (
            <CollectionCard key={index} item={item} index={index} />
          ))}
        </motion.div>)}
    </AnimatedSection>);
};
