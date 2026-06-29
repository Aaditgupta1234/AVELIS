import React, { useState } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { springs, durations, easeOut } from "../../utils/motion";
export const BookCard = ({ image, title, author, variant = "featured", category, description, readingTime, tag, }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };
    const spotlight = useMotionTemplate `radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.15), transparent 80%)`;
    const isLarge = variant === "featuredLarge";
    const isEditor = variant === "editor";
    return (<motion.div variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeOut } },
        }} className={`group ${isLarge ? "lg:col-span-2" : ""} ${isEditor ? "flex flex-col h-full" : ""}`} whileHover="hover" initial="rest" animate="rest">
      <motion.div onMouseMove={handleMouseMove} variants={{
            rest: { y: 0, scale: 1, boxShadow: "0px 4px 20px rgba(0,0,0,0)" },
            hover: {
                y: -8,
                scale: 1.02,
                boxShadow: "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)",
                transition: springs.smooth,
            },
        }} className={`relative overflow-hidden bg-surface-variant/50 ${isLarge ? "aspect-[16/10]" : isEditor ? "aspect-[2/3] mb-6" : "aspect-[3/4] mb-6 border border-white/10"}`}>
        <motion.div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: spotlight }}/>
        
        <motion.img alt={title} className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isLoaded ? 1 : 0 }} onLoad={() => setIsLoaded(true)} src={image} loading="lazy" variants={{
            rest: { scale: 1 },
            hover: { scale: 1.03, transition: { duration: durations.verySlow, ease: easeOut } },
        }}/>

        {isLarge && (<>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
            <div className="absolute bottom-8 left-8 z-20">
              {tag && (<motion.span variants={{
                    rest: { opacity: 0.8, y: 0 },
                    hover: { opacity: 1, y: -4, transition: springs.smooth },
                }} className="bg-primary/20 backdrop-blur-md px-3 py-1 text-[8px] font-display text-primary tracking-widest uppercase border border-primary/30 mb-4 inline-block">
                  {tag}
                </motion.span>)}
              <h3 className="font-display text-3xl mb-1 text-white">{title}</h3>
              <p className="font-display text-[10px] text-primary/70 tracking-widest">{author}</p>
            </div>
          </>)}

        {variant === "featured" && (<motion.div variants={{
                rest: { opacity: 0, y: 10, scale: 0.8 },
                hover: { opacity: 1, y: 0, scale: 1, transition: { ...springs.smooth, delay: 0.1 } },
            }} className="absolute top-4 right-4 h-8 w-8 bg-background/80 flex items-center justify-center rounded-full border border-white/10 z-20">
            <motion.span variants={{
                hover: { y: [0, -3, 0], transition: { duration: 0.4, ease: "easeInOut" } }
            }} className="material-symbols-outlined text-primary text-sm">
              bookmark
            </motion.span>
          </motion.div>)}

        {isEditor && (<motion.div variants={{
                rest: { opacity: 0 },
                hover: { opacity: 1, transition: { duration: durations.fast } }
            }} className="absolute inset-0 bg-background/60 z-20 flex items-center justify-center gap-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} aria-label="Preview Book" className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center transition-colors shadow-lg">
              <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.9 }} aria-label="Bookmark" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/10">
              <span className="material-symbols-outlined" aria-hidden="true">bookmark</span>
            </motion.button>
          </motion.div>)}
      </motion.div>

      {variant === "featured" && (<motion.div variants={{
                rest: { y: 0 },
                hover: { y: -2, transition: springs.smooth },
            }}>
          <h3 className="font-display text-xl mb-1 text-white">{title}</h3>
          <p className="font-display text-[10px] text-primary/70 tracking-widest uppercase">{author}</p>
        </motion.div>)}

      {isEditor && (<div className="flex flex-col flex-grow">
          {category && <span className="font-display text-[9px] text-primary uppercase tracking-widest mb-2">{category}</span>}
          <h4 className="font-display text-lg mb-1 text-white">{title}</h4>
          <p className="font-body text-xs text-white/60 mb-4 italic">by {author}</p>
          <p className="font-body text-xs text-white/50 line-clamp-3 mb-6 flex-grow">{description}</p>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
            {readingTime && <span className="font-display text-[9px] text-white/40 tracking-[0.1em]">{readingTime}</span>}
            <button className="font-display text-[10px] text-primary uppercase tracking-widest hover:text-white transition-colors">Preview</button>
          </div>
        </div>)}
    </motion.div>);
};
