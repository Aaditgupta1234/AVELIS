import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, staggers } from "../utils/motion";

const TestimonialCard = ({ quote, name, title, img }: { quote: string; name: string; title: string; img: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="glass-panel p-16 relative border-l-4 border-primary bg-surface/50 cursor-default"
    >
      <motion.div
        variants={{
          rest: { 
            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
            y: 0,
          },
          hover: { 
            boxShadow: "0px 10px 30px -10px rgba(212,175,55,0.15)",
            y: -4,
          },
        }}
        transition={springs.smooth}
        className="absolute inset-0 z-0 pointer-events-none"
      />
      <div className="relative z-10">
        <motion.p
          variants={{
            rest: { color: "rgba(255, 255, 255, 0.7)" },
            hover: { color: "rgba(255, 255, 255, 1)" },
          }}
          transition={springs.smooth}
          className="font-display text-2xl italic leading-relaxed mb-12"
        >
          "{quote}"
        </motion.p>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
            <motion.img 
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.03 },
              }}
              transition={springs.smooth}
              alt={name} 
              className="w-full h-full object-cover" 
              src={img}
            />
          </div>
          <div>
            <p className="font-display text-lg">{name}</p>
            <p className="font-display text-[9px] tracking-[0.2em] text-primary uppercase">{title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Testimonials = () => {
  return (
    <AnimatedSection variant="B" className="py-section-padding bg-surface/20 border-y border-white/5 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="text-center mb-20">
          <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Reader Reflections</p>
          <h2 className="font-display text-4xl">Voices from the Study</h2>
        </div>
        
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.medium } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <TestimonialCard 
            quote="AVELIS has transformed my relationship with digital reading. It no longer feels like a utility, but a ritual. The typography and dark environment are unparalleled."
            name="Clara Hemmingway"
            title="Literary Critic"
            img="https://lh3.googleusercontent.com/aida-public/AB6AXuA2b-KANMlJL4ie-hWzoBx6aV8QEfOqJZD0lrZitnvSyZWLlMebHMEz1fmmAxIPSizP8O_U0OsCN0sK8aNjd17tdJQOhGLxH00x0P3wqiN4UvN3WfuZyNLw3qbGX2Hz1JxML4k0ip1pGMjlReyKwyzj2bOGhpJlK2OlhoTIWIfUDxapzZNzEyWcDpXOfzhochGvc3qtUFCC4qOCpFkYKJ_TgjbfGtsRDAghaTsyTpx2TAts9GRg3SwxVVO_UXu6yeGFdLCpRy4oFo-U"
          />
          <TestimonialCard 
            quote="The archive of first editions is a scholar's dream. Being able to cross-reference physical rarity with digital convenience in such a beautiful interface is remarkable."
            name="Arthur Penhaligon"
            title="Archival Historian"
            img="https://lh3.googleusercontent.com/aida-public/AB6AXuC-6cn_FuVEPCaVWTXkKxuBXhbMhiEnZ7_A-4MbNp1EOrEuredN_GxJEznKkSeyVPIx4-MSrFb0gPGK54ZU1jEZ8ug7MKD38athBd8RCVnsJQplbg-rDHuBXoixkXizN_P31-8b50aCzJ-XnNhM722OJef9RT9_269D25h5DPMsMjWSLoNtIsdW8sC5rDiv84AMYpJLAOErPpRnLhpyzTt4Tw2boUPIrwlXCr0fqFpdJs17bD7bQ851NPI5Ivr1MD40Vm6mHlqR6v90"
          />
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
