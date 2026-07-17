import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LandingPage } from "./pages/LandingPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { LibraryPage } from "./pages/Library/LibraryPage";
import { BookDetailsPage } from "./pages/Library/BookDetailsPage";
import { ReadingJournalPage } from "./pages/ReadingJournal/ReadingJournalPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PageWrapper } from "./components/ui/PageWrapper";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { BooksProvider } from "./context/BooksContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
const AnimatedRoutes = () => {
    const location = useLocation();
    return (<AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>}/>
        <Route path="/collections" element={<PageWrapper><CollectionsPage /></PageWrapper>}/>
        <Route path="/library" element={<PageWrapper><LibraryPage /></PageWrapper>}/>
        <Route path="/book/:id" element={<PageWrapper><BookDetailsPage /></PageWrapper>}/>
        <Route path="/journal" element={<PageWrapper><ReadingJournalPage /></PageWrapper>}/>
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>}/>
        <Route path="/dashboard" element={<ProtectedRoute>
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            </ProtectedRoute>}/>
        <Route path="/dashboard/catalog" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            </ProtectedRoute>}/>
        <Route path="/authors" element={<PageWrapper><LandingPage /></PageWrapper>}/>
        <Route path="/about" element={<PageWrapper><LandingPage /></PageWrapper>}/>
      </Routes>
    </AnimatePresence>);
};
function App() {
    return (<AuthProvider>
      <BooksProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </BooksProvider>
    </AuthProvider>);
}
export default App;
