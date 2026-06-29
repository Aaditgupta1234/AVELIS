import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LandingPage } from "./pages/LandingPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { LibraryPage } from "./pages/Library/LibraryPage";
import { ReadingJournalPage } from "./pages/ReadingJournal/ReadingJournalPage";
import { LoginPage } from "./pages/LoginPage";
import { PageWrapper } from "./components/ui/PageWrapper";
import { ScrollToTop } from "./components/ui/ScrollToTop";

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/collections" element={<PageWrapper><CollectionsPage /></PageWrapper>} />
        <Route path="/library" element={<PageWrapper><LibraryPage /></PageWrapper>} />
        <Route path="/journal" element={<PageWrapper><ReadingJournalPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/authors" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><LandingPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
