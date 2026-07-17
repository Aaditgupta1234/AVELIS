import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { BookCard } from "../components/ui/BookCard.jsx";
import { BookMarked, FileText, Clock, Compass, LogOut, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "../components/layout/Navbar.jsx";
import { ProfileView } from "../components/dashboard/ProfileView.jsx";
import { SettingsView } from "../components/dashboard/SettingsView.jsx";
import { CatalogManager } from "../components/dashboard/CatalogManager.jsx";
import { motion, AnimatePresence } from "framer-motion";
export const DashboardPage = () => {
    const { user, logout } = useAuth();
    const { hash, pathname } = useLocation();
    const [toastMessage, setToastMessage] = useState("");
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3000);
    };
    // Mock data matching the AVELIS aesthetic
    const stats = [
        { label: "Books Read", value: "18", change: "+2 this month", icon: BookMarked },
        { label: "Journal Entries", value: "43", change: "5 in progress", icon: FileText },
        { label: "Reading Time", value: "184h", change: "12.5h this week", icon: Clock },
    ];
    const currentBook = {
        title: "Meditations",
        author: "Marcus Aurelius",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
        progress: 74,
        lastRead: "2 hours ago",
        quote: "The happiness of your life depends upon the quality of your thoughts.",
    };
    const recommendations = [
        {
            title: "Beyond Good and Evil",
            author: "Friedrich Nietzsche",
            image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
            category: "Philosophy",
            readingTime: "12h",
        },
        {
            title: "The Republic",
            author: "Plato",
            image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80",
            category: "Philosophy",
            readingTime: "16h",
        },
        {
            title: "Dune",
            author: "Frank Herbert",
            image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
            category: "Sci-Fi",
            readingTime: "22h",
        },
    ];
    const recentlyViewed = [
        {
            title: "Letters from a Stoic",
            author: "Seneca",
            image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80",
        },
        {
            title: "Thus Spoke Zarathustra",
            author: "Friedrich Nietzsche",
            image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80",
        },
    ];
    return (<>
      <Navbar />
      <div className="min-h-screen bg-[#07111F] text-[#F7F5EE] pt-32 pb-24 relative overflow-hidden">
        {/* Paper grain and ambient glows */}
        <div className="paper-grain opacity-5 pointer-events-none"/>
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A227]/3 rounded-full blur-[130px] pointer-events-none"/>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-[#1A2E57]/10 rounded-full blur-[150px] pointer-events-none"/>
 
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 relative z-10">
          <AnimatePresence mode="wait">
            {pathname === "/dashboard/catalog" ? (<motion.div key="catalog" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <CatalogManager />
              </motion.div>) : hash === "#profile" ? (<motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <ProfileView showToast={showToast}/>
              </motion.div>) : hash === "#settings" ? (<motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <SettingsView showToast={showToast}/>
              </motion.div>) : (<motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-16">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-[rgba(201,162,39,0.1)] pb-8">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#C9A227]/20 rounded-full bg-[#C9A227]/5">
                      <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-full animate-pulse"></span>
                      <span className="font-display text-[8px] tracking-[0.3em] text-[#C9A227] uppercase font-semibold">THE STUDY</span>
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl tracking-[0.02em] leading-tight">
                      Welcome back, <span className="italic text-[#C9A227]">{user?.name}</span>.
                    </h1>
                  </div>
                  <div className="flex gap-4">
                    {pathname === "/dashboard/catalog" ? (
                      <Link to="/dashboard" className="flex items-center gap-2 border border-[#C9A227]/20 hover:border-[#C9A227]/50 text-[#C9A227] hover:text-[#F7F5EE] px-5 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all bg-[#C9A227]/5 cursor-pointer">
                        <span>Back to Study</span>
                      </Link>
                    ) : user?.role === "ADMIN" ? (
                      <Link to="/dashboard/catalog" className="flex items-center gap-2 border border-[#C9A227]/20 hover:border-[#C9A227]/50 text-[#C9A227] hover:text-[#F7F5EE] px-5 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all bg-[#C9A227]/5 cursor-pointer">
                        <span>Manage Catalog</span>
                      </Link>
                    ) : null}
                    <button onClick={logout} className="flex items-center gap-2 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 px-5 py-2.5 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all focus:outline-none focus:ring-1 focus:ring-red-500/50 bg-red-950/10 cursor-pointer">
                      <LogOut className="w-3.5 h-3.5"/>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* Hero Study Panel & Continue Reading */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Welcome Quote Panel */}
                  <div className="lg:col-span-5 bg-[#0D1626]/50 border border-[rgba(201,162,39,0.12)] rounded-lg p-8 flex flex-col justify-between min-h-[320px] shadow-[0_15px_35px_rgba(0,0,0,0.3)] relative overflow-hidden">
                    <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#C9A227]/3 rounded-full blur-2xl pointer-events-none"/>
                    <Compass className="w-8 h-8 text-[#C9A227]/40"/>
                    <div className="space-y-4">
                      <p className="font-display text-lg sm:text-xl italic text-[#F7F5EE]/80 leading-relaxed font-light">
                        "A sanctuary not for the collection of bindings, but for the cultivation of the mind."
                      </p>
                      <div className="w-12 h-[1px] bg-[#C9A227]/30"/>
                      <p className="font-display text-[10px] tracking-[0.2em] text-[#C9A227] uppercase">
                        AVELIS ARCHIVAL CODEX
                      </p>
                    </div>
                  </div>

                  {/* Continue Reading Panel */}
                  <div className="lg:col-span-7 bg-[#0D1626] border border-[rgba(201,162,39,0.18)] rounded-lg p-8 flex flex-col sm:flex-row gap-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.02)] relative overflow-hidden">
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C9A227]/3 rounded-full blur-3xl pointer-events-none"/>
                    
                    {/* Book Cover */}
                    <div className="w-full sm:w-1/3 flex-shrink-0 flex justify-center sm:justify-start">
                      <div className="relative w-[130px] h-[190px] rounded shadow-[0_15px_30px_rgba(0,0,0,0.4)] overflow-hidden border border-[#C9A227]/20">
                        <img src={currentBook.image} alt={currentBook.title} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/50 to-transparent"/>
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="w-full sm:w-2/3 flex flex-col justify-between space-y-6">
                      <div className="space-y-2">
                        <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                          Currently Reading
                        </span>
                        <h3 className="font-display text-2xl text-[#F7F5EE] tracking-[0.02em]">
                          {currentBook.title}
                        </h3>
                        <p className="font-body text-xs text-[#F7F5EE]/60">
                          by {currentBook.author}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-display tracking-[0.1em] text-[#F7F5EE]/55">
                          <span>Progress</span>
                          <span>{currentBook.progress}%</span>
                        </div>
                        <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A227] rounded-full" style={{ width: `${currentBook.progress}%` }}/>
                        </div>
                        <span className="block text-[9px] font-body text-[#F7F5EE]/40 italic">
                          Last read {currentBook.lastRead}
                        </span>
                      </div>

                      {/* Action */}
                      <button className="flex items-center gap-2 text-[#07111F] bg-[#C9A227] hover:bg-[#E5C16B] px-6 py-3 rounded font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_10px_20px_rgba(201,162,39,0.15)] hover:shadow-[0_10px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 cursor-pointer w-fit">
                        <span>Resume Reading</span>
                        <ArrowRight className="w-3 h-3"/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (<div key={i} className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 flex items-center gap-6 shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                      <div className="w-12 h-12 rounded bg-[#C9A227]/5 border border-[#C9A227]/20 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-5 h-5 text-[#C9A227]"/>
                      </div>
                      <div className="space-y-1">
                        <span className="block font-display text-[10px] tracking-[0.2em] text-[#F7F5EE]/50 uppercase">
                          {stat.label}
                        </span>
                        <div className="flex items-baseline gap-3">
                          <span className="font-display text-3xl font-semibold text-[#F7F5EE]">
                            {stat.value}
                          </span>
                          <span className="font-body text-[10px] text-emerald-400">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>))}
                </div>

                {/* Curated Recommendations */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-[rgba(201,162,39,0.1)] pb-4">
                    <h2 className="font-display text-xl tracking-[0.1em] text-[#F7F5EE] uppercase flex items-center gap-3">
                      <Compass className="w-4 h-4 text-[#C9A227]"/>
                      <span>Curated for your Taste</span>
                    </h2>
                    <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                      Updated Daily
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {recommendations.map((book, i) => (<BookCard key={i} title={book.title} author={book.author} image={book.image} category={book.category} readingTime={book.readingTime}/>))}
                  </div>
                </div>

                {/* Recently Viewed & Journal Entry */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Recently Viewed */}
                  <div className="lg:col-span-5 space-y-6">
                    <h3 className="font-display text-sm tracking-[0.2em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
                      Recently Visited
                    </h3>
                    <div className="flex flex-col gap-4">
                      {recentlyViewed.map((book, i) => (<div key={i} className="flex items-center gap-4 p-3 rounded bg-[#0D1626]/20 border border-transparent hover:border-[#C9A227]/20 hover:bg-[#0D1626]/40 transition-all duration-300">
                          <img src={book.image} alt={book.title} className="w-10 h-14 object-cover rounded shadow-md border border-white/5"/>
                          <div className="space-y-1">
                            <h4 className="font-display text-sm text-[#F7F5EE] tracking-wide">
                              {book.title}
                            </h4>
                            <p className="font-body text-[10px] text-[#F7F5EE]/50">
                              by {book.author}
                            </p>
                          </div>
                        </div>))}
                    </div>
                  </div>

                  {/* Recent Journal Entry Preview */}
                  <div className="lg:col-span-7 bg-[#0D1626]/30 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
                        Latest Reflection
                      </span>
                      <span className="font-body text-[10px] text-[#F7F5EE]/40">
                        June 28, 2026
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-display text-lg text-[#F7F5EE] tracking-wide">
                        On Seneca's "Letters from a Stoic"
                      </h4>
                      <p className="font-body text-xs text-[rgba(247,245,238,0.72)] leading-relaxed italic border-l-2 border-[#C9A227]/30 pl-4">
                        "We suffer more often in imagination than in reality."
                      </p>
                      <p className="font-body text-xs text-[rgba(247,245,238,0.6)] leading-relaxed">
                        Seneca reminds us that much of our anxiety stems from anticipating hardships that may never happen. In our modern reading, this is a vital anchor. The digital world is full of imaginary storms; stoicism provides the shelter.
                      </p>
                    </div>

                    <button className="flex items-center gap-1.5 text-[#C9A227] hover:text-[#E5C16B] font-display text-[9px] tracking-[0.2em] uppercase transition-colors focus:outline-none cursor-pointer">
                      <span>View Full Journal</span>
                      <ArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (<motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed bottom-8 right-8 bg-[#0D1626] border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded shadow-[0_15px_40px_rgba(0,0,0,0.5)] z-50 flex items-center gap-3 font-body text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0"/>
            <span>{toastMessage}</span>
          </motion.div>)}
      </AnimatePresence>
    </>);
};
