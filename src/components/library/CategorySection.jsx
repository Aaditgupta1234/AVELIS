import { motion } from "framer-motion";
import { categoriesData } from "../../data/categories";
import { springs, durations, easeOut } from "../../utils/motion";
export const CategorySection = ({ activeFilters = [], onCategoryClick }) => {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: durations.medium, ease: easeOut },
        },
    };
    return (<section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40">
      <h3 className="font-display text-2xl md:text-3xl text-primary mb-12 text-center uppercase tracking-[0.1em]">
        Luxurious Collections
      </h3>
      
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categoriesData.map((cat) => {
            // Normalize category title matching (e.g. "Science" matches "Science & Tech" in filter logic)
            const isActive = activeFilters.includes(cat.title);
            return (<motion.div key={cat.id} variants={cardVariants} whileHover="hover" onClick={() => onCategoryClick?.(cat.title)} onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCategoryClick?.(cat.title);
                    }
                }} tabIndex={0} role="button" aria-label={`Filter by ${cat.title} collection`} className={`category-card aspect-square rounded-2xl group cursor-pointer border relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 ${isActive
                    ? "border-primary shadow-[0_0_20px_rgba(201,162,39,0.2)]"
                    : "border-outline-variant/10"}`}>
              {/* Background Image */}
              <motion.img alt={cat.title} src={cat.image} loading="lazy" variants={{
                    hover: { scale: 1.05 }
                }} transition={{ duration: 0.7, ease: easeOut }} className="absolute inset-0 w-full h-full object-cover"/>
              
              {/* Content */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                <h4 className="font-display text-2xl text-on-surface mb-2">
                  {cat.title}
                </h4>
                
                {/* Volume Count - slides up on hover */}
                <motion.p variants={{
                    hover: { y: 0, opacity: 1 },
                }} initial={isActive ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }} transition={springs.smooth} className="text-on-surface-variant/70 text-[10px] tracking-[0.2em] uppercase font-semibold">
                  {cat.volumesCount} VOLUMES
                </motion.p>
                
                {/* Expanding Underline */}
                <motion.div variants={{
                    hover: { width: "100%" }
                }} initial={{ width: isActive ? "100%" : "0%" }} animate={{ width: isActive ? "100%" : undefined }} transition={{ duration: 0.5, ease: easeOut }} className="h-[2px] bg-primary mt-4"/>
              </div>
            </motion.div>);
        })}
      </motion.div>
    </section>);
};
export default CategorySection;
