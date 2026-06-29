import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "../../utils/motion";
import { VisibilityToggle } from "./VisibilityToggle";
export const ReflectionEditor = ({ onSave }) => {
    const [bookTitle, setBookTitle] = useState("");
    const [visibility, setVisibility] = useState("private");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim())
            return;
        onSave({
            title,
            content,
            bookTitle,
            visibility,
        });
        // Reset Form
        setTitle("");
        setContent("");
        setBookTitle("");
        setVisibility("private");
    };
    return (<section className="mb-24 max-w-4xl mx-auto px-gutter">
      <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 rounded-2xl shadow-2xl relative border border-outline-variant/10">
        {/* Metadata Inputs */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Linked Volume Search */}
          <div className="flex-grow">
            <label className="font-body text-[10px] text-primary mb-2 block uppercase tracking-[0.2em] font-bold">
              Linked Volume
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary transition-colors select-none">
                book
              </span>
              <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="w-full bg-transparent border-b border-outline-variant/20 py-3 pl-8 text-on-surface focus:border-primary focus:ring-0 transition-all outline-none font-body text-sm placeholder:text-on-surface-variant/30 caret-primary" placeholder="Search the archives..."/>
            </div>
          </div>

          {/* Visibility Selector */}
          <div className="w-full md:w-64">
            <label className="font-body text-[10px] text-primary mb-2 block uppercase tracking-[0.2em] font-bold">
              Visibility
            </label>
            <VisibilityToggle value={visibility} onChange={setVisibility}/>
          </div>
        </div>

        {/* Writing Area */}
        <div className="mb-12">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-none text-2xl md:text-3xl font-display text-on-surface placeholder:text-on-surface-variant/30 mb-4 focus:ring-0 px-0 outline-none caret-primary" placeholder="Title of Reflection..." required/>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="writing-area w-full bg-transparent border-none text-base md:text-lg font-body text-on-surface-variant placeholder:text-on-surface-variant/20 focus:ring-0 px-0 leading-relaxed resize-none outline-none caret-primary" placeholder="Begin your meditation here..." rows={8} required/>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center pt-8 border-t border-outline-variant/10">
          {/* Formatting buttons */}
          <div className="flex gap-4">
            <button type="button" aria-label="Insert bullet list" className="text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg">
              <span className="material-symbols-outlined select-none">format_list_bulleted</span>
            </button>
            <button type="button" aria-label="Insert blockquote" className="text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg">
              <span className="material-symbols-outlined select-none">format_quote</span>
            </button>
          </div>

          {/* Submit Button with Dynamic AnimatePresence Text */}
          <motion.button type="submit" whileHover={{
            scale: 1.02,
            boxShadow: "0px 10px 25px -5px rgba(201, 162, 39, 0.3)",
            filter: "brightness(1.1)"
        }} whileTap={{ scale: 0.98 }} transition={springs.buttonClick} className="bg-primary text-on-primary font-body text-xs tracking-[0.2em] font-bold px-8 py-4 uppercase transition-all shadow-lg shadow-primary/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-[#07111F] min-w-[200px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span key={visibility} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }} className="inline-block">
                {visibility === "private" ? "Save Reflection" : "Publish Reflection"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </section>);
};
export default ReflectionEditor;
