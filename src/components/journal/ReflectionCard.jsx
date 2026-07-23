import { motion } from "framer-motion";
import { easeOut } from "../../utils/motion";

export const ReflectionCard = ({ reflection, isFeatured = false, currentUserId, onEdit, onDelete }) => {
  if (!reflection) return null;

  const isPrivate = reflection.visibility === "private";
  const title = reflection.title || "Untitled Reflection";
  const content = reflection.content || "";
  const dateStr = reflection.date || "";
  const authorName = reflection.authorName || (isPrivate ? "Personal Note" : "Community Scholar");
  const isOwner = isPrivate || (currentUserId && reflection.userId === currentUserId);

  return (
    <motion.article
      tabIndex={0}
      role="article"
      aria-label={`Reflection: ${title}`}
      whileHover={{
        y: -4,
        borderColor: "rgba(201, 162, 39, 0.3)",
        boxShadow: "0 12px 30px -10px rgba(201, 162, 39, 0.08)",
      }}
      className={`card-hover focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300 rounded-2xl border h-full ${
        isFeatured
          ? "md:col-span-8 bg-surface-container/20 border-outline-variant/10 p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-10"
          : isPrivate
          ? "md:col-span-4 bg-surface-container/10 border-outline-variant/10 p-6 md:p-8 flex flex-col justify-between"
          : "md:col-span-4 bg-surface-container/20 border-outline-variant/10 p-6 md:p-8 flex flex-col justify-between"
      }`}
    >
      {isFeatured ? (
        <>
          {/* Featured Book Cover Image */}
          {reflection.coverImage && (
            <div className="w-full md:w-1/3 aspect-[3/4] relative overflow-hidden group rounded-xl border border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
              <div className="absolute inset-0 bg-primary/5 mix-blend-overlay group-hover:opacity-0 transition-opacity z-10" />
              <motion.img
                alt={`Cover of ${reflection.bookTitle || title}`}
                src={reflection.coverImage}
                loading="lazy"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.7, ease: easeOut }}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Featured Content */}
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-primary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm select-none">public</span>
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase font-bold">
                    Public Reflection ({authorName})
                  </span>
                  {reflection.readingTime && (
                    <>
                      <span className="text-outline-variant/40 select-none">•</span>
                      <span className="font-body text-[10px] text-on-surface-variant/70 tracking-wider font-semibold uppercase">
                        {reflection.readingTime}
                      </span>
                    </>
                  )}
                </div>

                {/* Edit & Delete Action Buttons */}
                {isOwner && (
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(reflection);
                        }}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-[#C9A227] text-[#C9A227] hover:text-[#07111F] font-display text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Reflection"
                      >
                        <span className="material-symbols-outlined text-xs select-none">edit</span>
                        <span>Edit</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(reflection);
                        }}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-rose-500 text-rose-400 hover:text-white font-display text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        title="Delete Reflection"
                      >
                        <span className="material-symbols-outlined text-xs select-none">delete</span>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {reflection.bookTitle && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] font-display text-[10px] uppercase font-bold tracking-widest mb-3">
                  <span className="material-symbols-outlined text-xs select-none">menu_book</span>
                  <span>Volume: {reflection.bookTitle} {reflection.bookAuthor ? `— by ${reflection.bookAuthor}` : ""}</span>
                </div>
              )}

              <h3 className="font-display text-2xl md:text-3xl text-on-surface mb-4 leading-snug">
                {title}
              </h3>

              <p className="font-body text-sm md:text-base text-on-surface-variant leading-relaxed opacity-90 italic line-clamp-4">
                {content}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-outline-variant/10 flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-6 text-on-surface-variant/60 font-body text-[10px] tracking-widest uppercase font-semibold">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary select-none">auto_awesome</span>
                  {reflection.appreciations || 0} Appreciations
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary select-none">bookmark</span>
                  {reflection.saves || 0} Saves
                </span>
              </div>
              <span className="font-body text-[10px] text-on-surface-variant/50 tracking-wider font-bold">
                {dateStr}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Standard Grid Card Content */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-sm select-none ${
                    isPrivate ? "text-on-surface-variant/60" : "text-primary"
                  }`}
                  style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isPrivate ? "lock" : "public"}
                </span>
                <span
                  className={`font-body text-[10px] tracking-[0.2em] uppercase font-bold ${
                    isPrivate ? "text-on-surface-variant/60" : "text-primary"
                  }`}
                >
                  {isPrivate ? "Private Entry" : `Public (${authorName})`}
                </span>
              </div>

              {/* Edit & Delete Action Buttons for Standard Card */}
              {isOwner && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(reflection);
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-[#C9A227]/20 text-[#C9A227] transition-colors cursor-pointer"
                      title="Edit Reflection"
                    >
                      <span className="material-symbols-outlined text-xs select-none">edit</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(reflection);
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                      title="Delete Reflection"
                    >
                      <span className="material-symbols-outlined text-xs select-none">delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {reflection.bookTitle && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] font-display text-[9px] uppercase font-bold tracking-widest mb-3">
                <span className="material-symbols-outlined text-xs select-none">menu_book</span>
                <span>{reflection.bookTitle} {reflection.bookAuthor ? `(${reflection.bookAuthor})` : ""}</span>
              </div>
            )}

            <h3 className="font-display text-lg md:text-xl text-on-surface mb-3 leading-snug">
              {title}
            </h3>

            <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-85 line-clamp-3">
              {content}
            </p>
          </div>

          {/* Standard Grid Card Footer */}
          <div className="pt-6 mt-6 border-t border-outline-variant/10 flex flex-col gap-3">
            {reflection.bookTitle && (
              <div className="flex items-center gap-2 text-on-surface-variant/50 font-body text-[10px] tracking-wider font-semibold uppercase">
                <span className="material-symbols-outlined text-sm select-none">menu_book</span>
                <span>
                  Linked: {reflection.bookTitle}{" "}
                  {reflection.bookAuthor ? `(${reflection.bookAuthor})` : ""}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              {!isPrivate && reflection.readingTime && (
                <span className="text-primary font-body text-[10px] tracking-wider font-bold uppercase">
                  {reflection.readingTime}
                </span>
              )}
              <span className="text-on-surface-variant/40 font-body text-[10px] tracking-wider font-bold ml-auto">
                {dateStr}
              </span>
            </div>
          </div>
        </>
      )}
    </motion.article>
  );
};

export default ReflectionCard;
