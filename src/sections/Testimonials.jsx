import { motion } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, staggers } from "../utils/motion";
import { testimonials } from "../data/testimonials";
const TestimonialCard = ({ quote, name, title, img }) => {
    return (<motion.div variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
        }} initial="rest" whileHover="hover" animate="rest" className="glass-panel p-16 relative border-l-4 border-primary bg-surface/50 cursor-default">
      <motion.div variants={{
            rest: {
                boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                y: 0,
            },
            hover: {
                boxShadow: "0px 10px 30px -10px rgba(212,175,55,0.15)",
                y: -4,
            },
        }} transition={springs.smooth} className="absolute inset-0 z-0 pointer-events-none"/>
      <div className="relative z-10">
        <motion.p variants={{
            rest: { color: "rgba(255, 255, 255, 0.7)" },
            hover: { color: "rgba(255, 255, 255, 1)" },
        }} transition={springs.smooth} className="font-display text-2xl italic leading-relaxed mb-12">
          "{quote}"
        </motion.p>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
            <motion.img variants={{
            rest: { scale: 1 },
            hover: { scale: 1.03 },
        }} transition={springs.smooth} alt={name} className="w-full h-full object-cover" src={img}/>
          </div>
          <div>
            <p className="font-display text-lg">{name}</p>
            <p className="font-display text-[9px] tracking-[0.2em] text-primary uppercase">{title}</p>
          </div>
        </div>
      </div>
    </motion.div>);
};
export const Testimonials = () => {
    return (<AnimatedSection variant="B" className="py-section-padding bg-surface/20 border-y border-white/5 relative z-10">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="text-center mb-20">
          <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Reader Reflections</p>
          <h2 className="font-display text-4xl">Voices from the Study</h2>
        </div>
        
        <motion.div variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.medium } },
        }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {testimonials.map((t) => (<TestimonialCard key={t.id} quote={t.quote} name={t.name} title={t.title} img={t.img}/>))}
        </motion.div>
      </div>
    </AnimatedSection>);
};
