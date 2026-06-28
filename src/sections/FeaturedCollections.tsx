import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { springs, durations, easeOut, staggers } from "../utils/motion";
import React from "react";

const BookCard = ({
  image,
  title,
  author,
  tag,
  large = false,
}: {
  image: string;
  title: string;
  author: string;
  tag?: string;
  large?: boolean;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const spotlight = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.15), transparent 80%)`;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeOut } },
      }}
      className={large ? "lg:col-span-2 group" : "group"}
      whileHover="hover"
      initial="rest"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        variants={{
          rest: { y: 0, scale: 1, boxShadow: "0px 4px 20px rgba(0,0,0,0)" },
          hover: {
            y: -8,
            scale: 1.02,
            boxShadow: "0px 20px 40px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(212, 175, 55, 0.3)",
            transition: springs.smooth,
          },
        }}
        className={`relative overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[3/4] mb-6"} bg-surface-variant`}
      >
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: spotlight }}
        />
        
        <motion.img
          alt={title}
          className="w-full h-full object-cover"
          src={image}
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.02, transition: { duration: durations.verySlow, ease: easeOut } },
          }}
        />

        {large ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
            <div className="absolute bottom-8 left-8 z-20">
              {tag && (
                <motion.span
                  variants={{
                    rest: { opacity: 0.8, y: 0 },
                    hover: { opacity: 1, y: -4, transition: springs.smooth },
                  }}
                  className="bg-primary/20 backdrop-blur-md px-3 py-1 text-[8px] font-display text-primary tracking-widest uppercase border border-primary/30 mb-4 inline-block"
                >
                  {tag}
                </motion.span>
              )}
              <h3 className="font-display text-3xl mb-1">{title}</h3>
              <p className="font-display text-[10px] text-primary/70 tracking-widest">{author}</p>
            </div>
          </>
        ) : (
          <motion.div
            variants={{
              rest: { opacity: 0, y: 10, scale: 0.8 },
              hover: { opacity: 1, y: 0, scale: 1, transition: { ...springs.smooth, delay: 0.1 } },
            }}
            className="absolute top-4 right-4 h-8 w-8 bg-background/80 flex items-center justify-center rounded-full border border-white/10 z-20"
          >
            <motion.span
              variants={{
                hover: { y: [0, -3, 0], transition: { duration: 0.4, ease: "easeInOut" } }
              }}
              className="material-symbols-outlined text-primary text-sm"
            >
              bookmark
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {!large && (
        <motion.div
          variants={{
            rest: { y: 0 },
            hover: { y: -2, transition: springs.smooth },
          }}
        >
          <h3 className="font-display text-xl mb-1">{title}</h3>
          <p className="font-display text-[10px] text-primary/70 tracking-widest uppercase">{author}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export const FeaturedCollections = () => {
  return (
    <AnimatedSection variant="B" className="py-section-padding px-gutter relative z-10">
      <div className="max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
          <div>
            <p className="font-display text-primary text-[11px] tracking-[0.4em] uppercase mb-4">Curated Selections</p>
            <h2 className="font-display text-4xl md:text-5xl">The Season's Anthology</h2>
          </div>
          <a className="font-display text-[11px] tracking-[0.2em] text-primary hover:text-white transition-colors border-b border-primary/20 pb-2" href="#">
            VIEW ALL ARCHIVES
          </a>
        </div>

        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggers.medium } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
        >
          <BookCard
            large
            title="The Silent Library"
            author="JULIAN VANCE • 2024"
            tag="Editor's Pick"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBnTfko1oBkPcKBiPzij8xCRpy--PxCYJj60yN3yhd9JocIcU4ajGcb7xoDLYFhqTuuw2uyACszZ4cNzdqm53i8FOWf0lX2wxECQbx0OmwLCJKA0TD396WkiCbKrrnHuj_Ra37lOFohhuA3-3Pvr9ATiM4pmS6CXjbfnSqAsM6rR-O3d6zR8iLwwXD5KiLyHO_dLSCAb11OFn65HuEYIKm5uxixK4TQFwst7LX-QOwqLjtyezOTvEDsMAymuocG-Ylv-OiqvFV5a0zG"
          />
          <BookCard
            title="Echoes of Gold"
            author="ELARA STERLING"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBU52ijSLmU_qjFNUOAerhdUpQteDYp-nWFtLh4voF6DSU1RngPE1bZDKVyFE_Ins5b-fhz-TrYm1qt2hcbhLpWVUW1zU0TLNCasw1eIY670L4VxFWnA8DGthNY8apX-Nf1Ls_wAuTQxzX7InGTYZnEji853jaJRGQYDVe7t5YnSOk0BI2sZOjGwDI8Tpg5qAOGSvPMJiv5XPUzIbspiXhX-LrfHMNLuTOH7BCEvrDngvT9YzV3GVjAVcQC74f7I0WGgk3DAT2cOk2Q"
          />
          <BookCard
            title="The Botanical Guild"
            author="DR. ARIS THORNE"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDeJgiCbSFFXnJYQlPQxoJEuc8uvF07iNbjx-4cy6obuU8uvCGy3KQy9GNov2qUFPpcCDfUJKsHpYE98S1FGQdL_x6aPw5ggWqUjDsSA8Zg1nrW492CEsPwHTtmxZ5YCXYnMpikOx-nMFlq3o8EMnARZTUflvpm3mF2XZ2tk_WsDnSESEjfECww2PB_aIa-OqpQZEZdsLySkc9vg1OmwQo6Ur9Weo_TEnBQtm69GnBidXM2wk4ZgU8cXW70NmOJlkyP7RF70rIzmt9z"
          />
        </motion.div>
      </div>
    </AnimatedSection>
  );
};
