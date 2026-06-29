import { motion } from "framer-motion";
import { authorsData } from "../../data/authors";
import { durations, easeOut } from "../../utils/motion";

export const AuthorSection = () => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.medium, ease: easeOut },
    },
  };

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40">
      <div className="flex items-end justify-between mb-16">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Featured Authors
          </h3>
          <p className="text-on-surface-variant/60 font-body text-sm md:text-base italic">
            The brilliant minds behind our collection
          </p>
        </div>
        <motion.button
          whileHover={{ color: "var(--color-on-background)", borderBottomColor: "var(--color-on-background)" }}
          className="text-primary font-display text-[10px] tracking-[0.2em] uppercase border-b border-primary/30 pb-1 transition-colors"
        >
          ALL AUTHORS
        </motion.button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12"
      >
        {authorsData.map((author) => (
          <motion.div
            key={author.id}
            variants={cardVariants}
            whileHover="hover"
            tabIndex={0}
            role="button"
            aria-label={`View works by ${author.name}`}
            className="text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl p-2 transition-all duration-300"
          >
            {/* Avatar Container */}
            <div className="relative w-full aspect-square rounded-full overflow-hidden mb-6 border border-outline-variant/10 group-hover:border-primary/50 group-hover:shadow-[0_0_25px_rgba(201,162,39,0.25)] transition-all duration-500 bg-surface-container-lowest shadow-lg">
              <motion.img
                alt={author.name}
                src={author.avatar}
                loading="lazy"
                variants={{
                  hover: { scale: 1.05 }
                }}
                transition={{ duration: 0.5, ease: easeOut }}
                className="w-full h-full object-cover"
              />
              
              {/* Subtle Gold Overlay on Hover */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Author Details */}
            <h5 className="font-display text-lg text-on-surface group-hover:text-primary transition-colors mb-1 line-clamp-1">
              {author.name}
            </h5>
            <p className="text-[10px] tracking-widest text-on-surface-variant/50 uppercase font-semibold">
              {author.category}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
