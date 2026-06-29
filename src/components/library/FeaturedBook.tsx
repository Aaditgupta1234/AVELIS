import { motion } from "framer-motion";
import { featuredBook } from "../../data/featuredBook";
import { springs, revealVariants } from "../../utils/motion";

export const FeaturedBook = () => {
  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={revealVariants.A}
      className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40"
    >
      <div className="relative w-full aspect-[21/10] lg:aspect-[21/8] min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] rounded-2xl overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111F] via-[#07111F]/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/80 via-transparent to-transparent z-10" />
        
        <motion.img
          alt={`${featuredBook.title} cover`}
          className="absolute inset-0 w-full h-full object-cover"
          src={featuredBook.coverImage}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-center py-8 md:py-12 px-12 md:px-24 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary font-body text-[10px] tracking-[0.2em] border border-primary/30 font-semibold uppercase">
              EDITOR'S MASTERPIECE
            </span>
            <span className="text-on-surface-variant/40 text-sm">|</span>
            <span className="text-on-surface-variant/60 font-body text-[10px] tracking-[0.2em] uppercase font-semibold">
              {featuredBook.category}
            </span>
          </div>
          
          <h2 className="font-display text-5xl md:text-7xl text-on-surface mb-6 leading-none tracking-tight">
            The Gilded<br />Silence
          </h2>
          
          <div className="flex items-center gap-6 mb-8 text-on-surface-variant/80 font-body text-sm md:text-base">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="text-sm font-semibold ml-1">{featuredBook.rating}</span>
              <span className="text-[12px] opacity-60 ml-1">
                ({(featuredBook.reviewsCount || 0) / 1000}k reviews)
              </span>
            </div>
            <span className="text-on-surface-variant/30 font-light">·</span>
            <span>{featuredBook.year}</span>
            <span className="text-on-surface-variant/30 font-light">·</span>
            <span className="text-green-500/80 font-semibold uppercase tracking-widest text-[10px]">
              Available Now
            </span>
          </div>
          
          <p className="font-body text-lg text-on-surface-variant/90 mb-10 line-clamp-3 md:line-clamp-none max-w-2xl leading-relaxed">
            {featuredBook.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6">
            <motion.button 
              whileHover={{ 
                y: -2, 
                boxShadow: "0px 10px 30px -10px rgba(212, 175, 55, 0.4)",
                filter: "brightness(1.1)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="bg-primary text-on-primary px-10 py-4 rounded-xl font-body text-[12px] tracking-[0.05em] hover:brightness-110 transition-all flex items-center gap-3 shadow-lg shadow-primary/10 font-semibold"
            >
              <span className="material-symbols-outlined text-lg">auto_stories</span>
              Borrow Book
            </motion.button>
            
            <motion.button 
              whileHover={{ 
                y: -2,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: "rgba(255, 255, 255, 0.3)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.buttonClick}
              className="bg-surface-container/50 backdrop-blur-md border border-outline-variant/30 text-on-surface px-10 py-4 rounded-xl font-body text-[12px] tracking-[0.05em] transition-all flex items-center gap-3 font-semibold"
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              Read Preview
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05, color: "var(--color-primary)", borderColor: "rgba(201, 162, 39, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              transition={springs.buttonClick}
              className="p-4 rounded-full border border-outline-variant/30 text-on-surface hover:text-primary transition-all"
              aria-label="Bookmark featured book"
            >
              <span className="material-symbols-outlined text-xl">bookmark</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
