import { useState } from "react";
import { motion } from "framer-motion";
import { ReflectionCard } from "./ReflectionCard";
import { AnimatedSection } from "../ui/AnimatedSection";
import { springs } from "../../utils/motion";

export const ReflectionGrid = ({ reflections = [], currentUserId, onEdit, onDelete }) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const safeReflections = Array.isArray(reflections) ? reflections.filter(Boolean) : [];

  const filteredReflections = safeReflections.filter((ref) => {
    if (!ref) return false;
    if (activeFilter === "public") {
      return ref.visibility === "public";
    }
    if (activeFilter === "private") {
      return (
        ref.visibility === "private" &&
        (ref.userId === currentUserId || !ref.userId || currentUserId === undefined)
      );
    }
    // "all" tab: show all public entries + current user's private entries
    if (ref.visibility === "private") {
      return ref.userId === currentUserId || !ref.userId || currentUserId === undefined;
    }
    return true;
  });

  return (
    <AnimatedSection variant="A" className="max-w-container-max mx-auto px-gutter mb-24">
      {/* Feed Header */}
      <div className="flex justify-between items-end border-b border-outline-variant/25 pb-4 mb-12">
        <h2 className="font-display text-2xl md:text-3xl text-on-surface">
          Recent Reflections
        </h2>

        <div className="flex gap-6 font-body text-[10px] tracking-[0.2em] uppercase">
          {["all", "public", "private"].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`pb-2 relative transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-2 -mx-2 cursor-pointer ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant/60 hover:text-on-surface font-semibold"
                }`}
              >
                <span>{filter}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-journal-filter"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                    transition={springs.smooth}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento Grid Feed */}
      {filteredReflections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {filteredReflections.map((ref, index) => {
            const isFeatured = index === 0 && (activeFilter === "all" || ref.visibility === "public");
            return (
              <div key={ref.id || `ref-${index}`} className={isFeatured ? "md:col-span-8" : "md:col-span-4"}>
                <ReflectionCard
                  reflection={ref}
                  isFeatured={isFeatured}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-4 select-none">
            inbox
          </span>
          <p className="font-body text-sm text-on-surface-variant/50 uppercase tracking-widest font-semibold">
            {activeFilter === "private"
              ? "No private reflections in your journal yet."
              : activeFilter === "public"
              ? "No public reflections published yet."
              : "No reflections found in this folder."}
          </p>
        </div>
      )}
    </AnimatedSection>
  );
};

export default ReflectionGrid;
