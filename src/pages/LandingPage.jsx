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
import { Helmet } from "react-helmet-async";

export const LandingPage = () => {
    return (<>
      <Helmet>
        <title>AVELIS | The Discerning Bibliophile's Sanctuary</title>
        <meta name="description" content="AVELIS is a premium digital library experience combining curated collections, intelligent discovery, reading journals, and immersive digital reading." />
        <link rel="canonical" href="https://avelis-alpha.vercel.app/" />
      </Helmet>
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
    </>);
};
