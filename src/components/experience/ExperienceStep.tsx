import { motion } from "framer-motion";
import type { ExperienceStepData } from "../../data/experienceData";
import { easeOut } from "../../utils/motion";
import { AnimatedSection } from "../ui/AnimatedSection";

interface ExperienceStepProps {
  step: ExperienceStepData;
}

export const ExperienceStep = ({ step }: ExperienceStepProps) => {
  const isRtl = step.layoutDirection === "rtl";
  const isDashboard = step.visualType === "dashboard";

  return (
    <AnimatedSection variant="A" className="max-w-container-max mx-auto px-gutter py-section-padding">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        
        {/* Text Content Block */}
        <div className={`space-y-6 ${isRtl ? "order-1 md:order-2" : "order-1"}`}>
          <h2 className="font-display text-4xl md:text-5xl text-primary tracking-wide uppercase">
            {step.title}
          </h2>
          
          <p className="font-body text-base md:text-lg text-on-surface-variant leading-relaxed opacity-90">
            {step.description}
          </p>
          
          {/* Custom List Items (e.g. in the "Read" section) */}
          {step.listItems && (
            <div className="pt-4 space-y-4">
              {step.listItems.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <span 
                    className="material-symbols-outlined text-primary text-xl select-none" 
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {idx === 0 ? "auto_stories" : "light_mode"}
                  </span>
                  <span className="font-body text-sm md:text-base text-on-surface-variant font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Link / Button */}
          {step.linkText && (
            <div className="pt-4">
              <motion.a
                href="#"
                whileHover={{ x: 4 }}
                className="inline-flex items-center gap-3 border-b border-primary/25 pb-2 font-body text-xs tracking-[0.15em] font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all duration-300 uppercase group focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2 py-1 -ml-2"
              >
                <span>{step.linkText}</span>
                <span className="material-symbols-outlined text-sm text-primary transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </motion.a>
            </div>
          )}
        </div>

        {/* Visual Media Block */}
        <div className={`relative group ${isRtl ? "order-2 md:order-1" : "order-2"}`}>
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-110 pointer-events-none -z-10 opacity-60" />

          {isDashboard ? (
            /* Custom Stats Dashboard (for the "Grow" section) */
            <motion.div 
              whileHover={{ 
                y: -4,
                borderColor: "rgba(201, 162, 39, 0.3)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
              }}
              transition={{ duration: 0.5 }}
              className="glass-card p-8 rounded-2xl border border-outline-variant/16 h-[400px] flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-body text-[10px] tracking-[0.2em] text-primary uppercase font-semibold">
                      INTELLECTUAL REACH
                    </h3>
                    <p className="font-display text-2xl md:text-3xl text-on-surface mt-1">84th Percentile</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-body text-[10px] tracking-[0.2em] text-primary uppercase font-semibold">
                      ARCHIVES
                    </h3>
                    <p className="font-display text-2xl md:text-3xl text-on-surface mt-1">2.4k</p>
                  </div>
                </div>

                {/* Custom Bar Chart Graphic */}
                <div className="w-full h-32 bg-white/5 rounded-lg relative overflow-hidden flex items-end p-1 gap-2 border border-white/5">
                  <div className="w-1/3 h-full bg-primary/25 border border-primary/40 rounded-sm relative group/bar">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                  </div>
                  <div className="w-1/4 h-[75%] bg-primary/15 border border-primary/30 rounded-sm relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  </div>
                  <div className="w-1/5 h-[50%] bg-primary/5 border border-primary/20 rounded-sm relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                  </div>
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex gap-2.5">
                <span className="px-3 py-1.5 bg-primary text-on-primary font-body text-[10px] tracking-wider font-semibold rounded uppercase">
                  PHILOSOPHY
                </span>
                <span className="px-3 py-1.5 bg-white/5 border border-outline-variant/20 text-on-surface-variant font-body text-[10px] tracking-wider font-semibold rounded uppercase">
                  HISTORY
                </span>
                <span className="px-3 py-1.5 bg-white/5 border border-outline-variant/20 text-on-surface-variant font-body text-[10px] tracking-wider font-semibold rounded uppercase">
                  SCIENCE
                </span>
              </div>
            </motion.div>
          ) : (
            /* Image Panel (for Discover, Borrow, Read sections) */
            <div className="glass-card p-1.5 rounded-2xl border border-outline-variant/16 overflow-hidden shadow-2xl">
              <div className="overflow-hidden rounded-xl aspect-[4/3] bg-surface-container-lowest">
                <motion.img
                  alt={step.title}
                  src={step.image}
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.7, ease: easeOut }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Info Badge (e.g. in the "Discover" section) */}
              {step.badge && (
                <div className="absolute -bottom-4 -left-4 glass-card p-4 md:p-5 rounded-xl border border-outline-variant/16 shadow-xl hidden sm:block">
                  <p className="font-body text-[10px] text-primary tracking-wider font-bold uppercase mb-1">
                    {step.badge.title}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {step.badge.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AnimatedSection>
  );
};
