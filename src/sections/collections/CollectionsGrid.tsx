import { motion } from "framer-motion";
import { AnimatedSection } from "../../components/ui/AnimatedSection";
import { springs, staggers } from "../../utils/motion";

const collections = [
  {
    title: "Modern Classics",
    subtitle: "Featured Series",
    description: "Revisiting the 20th century's most profound literary achievements.",
    volumes: "42 Volumes",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2228&auto=format&fit=crop"
  },
  {
    title: "Business Strategy",
    subtitle: "The Vault",
    description: "The fundamental theories that shaped the modern economic landscape.",
    volumes: "28 Volumes",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop"
  },
  {
    title: "Artificial Intelligence",
    subtitle: "Emergent Tech",
    description: "Understanding the evolution of digital consciousness and ethics.",
    volumes: "15 Volumes",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
  }
];

export const CollectionsGrid = () => {
  return (
    <AnimatedSection variant="A" className="px-gutter max-w-container-max mx-auto mb-32">
      <motion.div 
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: staggers.fast } },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {collections.map((item, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: springs.smooth },
            }}
            whileHover="hover"
            initial="rest"
            animate="rest"
            className="group relative overflow-hidden border border-white/10 glass-panel h-[500px] flex flex-col transition-colors duration-700 hover:border-primary/50"
          >
            <motion.div
              variants={{
                rest: { boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
                hover: { boxShadow: "0px 10px 40px -10px rgba(212,175,55,0.15)" },
              }}
              transition={springs.smooth}
              className="absolute inset-0 z-0 pointer-events-none"
            />
            
            <div className="h-2/3 w-full overflow-hidden">
              <motion.img 
                variants={{
                  rest: { scale: 1, filter: "grayscale(100%)" },
                  hover: { scale: 1.05, filter: "grayscale(0%)" },
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full h-full object-cover" 
                alt={item.title} 
                src={item.image}
              />
            </div>
            
            <div className="p-8 flex flex-col justify-between flex-grow relative z-10 bg-surface/80 backdrop-blur-md">
              <div>
                <span className="font-display text-[10px] text-primary uppercase tracking-[0.2em] mb-2 block">{item.subtitle}</span>
                <h3 className="font-display text-2xl mb-2 text-white">{item.title}</h3>
                <p className="font-body text-white/60 text-sm mb-4">{item.description}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-display text-[10px] text-white/40 tracking-[0.1em]">{item.volumes}</span>
                <button className="font-display text-[10px] text-primary uppercase tracking-[0.2em] border-b border-primary/30 hover:border-primary pb-1 transition-all">Explore Collection</button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatedSection>
  );
};
