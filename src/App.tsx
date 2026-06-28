import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Placeholder routes for the nav links */}
        <Route path="/collections" element={<LandingPage />} />
        <Route path="/authors" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
