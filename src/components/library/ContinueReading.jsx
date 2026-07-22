import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLoans } from "../../context/LoanContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { durations, easeOut } from "../../utils/motion";

export const ContinueReading = () => {
  const { isAuthenticated } = useAuth();
  const { activeLoans } = useLoans();

  if (!isAuthenticated || !activeLoans || activeLoans.length === 0) {
    return null;
  }

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

  const calculateTimeProgress = (borrowedAt, dueDate) => {
    const start = new Date(borrowedAt).getTime();
    const end = new Date(dueDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <section className="px-margin-mobile md:px-gutter max-w-container-max mx-auto mb-24 md:mb-40">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Continue Reading
          </h3>
          <p className="text-on-surface-variant/60 font-body text-sm md:text-base italic">
            Pick up exactly where you left off with your borrowed volumes
          </p>
        </div>
        <Link
          to="/dashboard"
          className="text-primary font-display text-[10px] tracking-[0.2em] uppercase border-b border-primary/30 pb-1 hover:text-white transition-colors"
        >
          VIEW ALL CHECKOUTS ({activeLoans.length})
        </Link>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {activeLoans.map((loan) => {
          const progress = calculateTimeProgress(loan.borrowedAt, loan.dueDate);
          return (
            <motion.div
              key={loan.id}
              variants={cardVariants}
              whileHover={{
                borderColor: "rgba(201, 162, 39, 0.3)",
                y: -4,
                boxShadow: "0 10px 30px -10px rgba(201, 162, 39, 0.15)",
              }}
              className="glass-card rounded-2xl p-6 flex gap-6 group transition-all duration-500 relative overflow-hidden"
            >
              {/* Cover Image */}
              <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 bg-surface-container-lowest border border-white/10">
                <img
                  alt={loan.title}
                  src={loan.coverImage}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col justify-between py-1 flex-1">
                <div>
                  <h4 className="font-display text-base md:text-lg text-[#F7F5EE] mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {loan.title}
                  </h4>
                  <p className="text-primary/70 text-xs tracking-[0.15em] uppercase font-semibold">
                    by {loan.author}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[9px] font-display font-semibold tracking-wider">
                    <span className="text-primary">{progress}% TIME EXPIRED</span>
                    <span
                      className={
                        loan.status === "OVERDUE"
                          ? "text-rose-400 font-semibold"
                          : "text-[#F7F5EE]/50"
                      }
                    >
                      {loan.status === "OVERDUE" ? "OVERDUE" : "ACTIVE LOAN"}
                    </span>
                  </div>

                  {/* Custom Progress Bar */}
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: easeOut }}
                      className={`h-full ${
                        loan.status === "OVERDUE" ? "bg-rose-500" : "bg-primary"
                      }`}
                    />
                  </div>

                  <Link
                    to="/dashboard"
                    className="text-primary font-body text-[10px] tracking-widest font-bold flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 w-fit"
                  >
                    Resume Reading{" "}
                    <span className="material-symbols-outlined text-[12px] block">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
