import { motion } from "framer-motion";
import { continueReadingData } from "../../data/continueReading";
import { durations, easeOut } from "../../utils/motion";

export const ContinueReading = () => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.medium, ease: easeOut },
    },
  };

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-32">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Continue Reading
          </h3>
          <p className="text-on-surface-variant/60 font-body text-sm md:text-base italic">
            Pick up exactly where you left off
          </p>
        </div>
        <motion.a
          whileHover={{ color: "var(--color-on-background)", borderBottomColor: "var(--color-on-background)" }}
          href="#"
          className="text-primary font-display text-[10px] tracking-[0.2em] uppercase border-b border-primary/30 pb-1 transition-colors"
        >
          VIEW ALL PROGRESS
        </motion.a>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {continueReadingData.map((item) => (
          <motion.div
            key={item.id}
            variants={cardVariants}
            whileHover={{
              borderColor: "rgba(201, 162, 39, 0.3)",
              y: -4,
              boxShadow: "0 10px 30px -10px rgba(201, 162, 39, 0.15)",
            }}
            className="glass-card rounded-2xl p-6 flex gap-6 group transition-all duration-500 relative overflow-hidden"
          >
            {/* Cover Image */}
            <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 bg-surface-container-lowest">
              <img
                alt={`${item.title} cover`}
                src={item.coverImage}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between py-1 flex-1">
              <div>
                <h4 className="font-display text-base md:text-lg text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-on-surface-variant/60 text-xs tracking-[0.15em] uppercase font-semibold">
                  {item.author}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-display font-semibold tracking-wider">
                  <span className="text-primary">{item.progress}% COMPLETE</span>
                  <span className="text-on-surface-variant/40">{item.pagesLeft} PAGES LEFT</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: easeOut }}
                    className="h-full bg-primary"
                  />
                </div>

                <motion.button
                  whileHover={{ x: 3 }}
                  className="text-primary font-display text-[9px] tracking-widest font-bold flex items-center gap-1.5 hover:text-white transition-colors uppercase"
                >
                  RESUME READING{" "}
                  <span className="material-symbols-outlined text-[12px] block">arrow_forward</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
