import { useState } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";
import { BackgroundShader } from "../../components/ui/BackgroundShader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { JournalHero } from "../../components/journal/JournalHero";
import { ReflectionEditor } from "../../components/journal/ReflectionEditor";
import { ReflectionGrid } from "../../components/journal/ReflectionGrid";
import { JournalPagination } from "../../components/journal/JournalPagination";
import { initialReflections } from "../../data/journalData";
export const ReadingJournalPage = () => {
    const [reflections, setReflections] = useState(initialReflections);
    const handleSave = (entry) => {
        const newReflection = {
            id: `ref-${Date.now()}`,
            title: entry.title,
            content: entry.content,
            bookTitle: entry.bookTitle || undefined,
            bookAuthor: entry.bookTitle ? "Archived Author" : undefined,
            visibility: entry.visibility,
            date: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
            readingTime: `${Math.max(3, Math.ceil(entry.content.split(/\s+/).length / 200))} min read`,
            appreciations: 0,
            saves: 0,
        };
        setReflections([newReflection, ...reflections]);
    };
    return (<div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col overflow-hidden">
      {/* Paper Grain Texture */}
      <div className="paper-grain"></div>
      
      {/* Page Progress Indicator */}
      <ProgressBar />
      
      {/* Ambient Shader Canvas */}
      <BackgroundShader />
      
      {/* Global Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 relative z-10">
        {/* Journal Header */}
        <JournalHero />
        
        {/* Reflection Writer Card */}
        <ReflectionEditor onSave={handleSave}/>
        
        {/* Bento Grid Reflections Feed */}
        <ReflectionGrid reflections={reflections}/>
        
        {/* Feed Pagination */}
        <JournalPagination />
      </main>
      
      {/* Global Footer */}
      <Footer />
    </div>);
};
export default ReadingJournalPage;
