import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../sections/Hero";
import { TrustedBy } from "../sections/TrustedBy";
import { FeaturedCollections } from "../sections/FeaturedCollections";
import { Categories } from "../sections/Categories";
import { ReaderExperience } from "../sections/ReaderExperience";
import { PremiumFeatures } from "../sections/PremiumFeatures";
import { Statistics } from "../sections/Statistics";
import { Testimonials } from "../sections/Testimonials";
import { FinalCTA } from "../sections/FinalCTA";
import { BackgroundShader } from "../components/ui/BackgroundShader";
import { ProgressBar } from "../components/ui/ProgressBar";

export const LandingPage = () => {
  return (
    <>
      <div className="paper-grain"></div>
      <ProgressBar />
      <BackgroundShader />
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <FeaturedCollections />
        <Categories />
        <ReaderExperience />
        <PremiumFeatures />
        <Statistics />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
};
