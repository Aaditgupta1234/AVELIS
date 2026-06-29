import { Fragment } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";
import { BackgroundShader } from "../../components/ui/BackgroundShader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ExperienceHero } from "../../components/experience/ExperienceHero";
import { ExperienceStep } from "../../components/experience/ExperienceStep";
import { ExperienceTimeline } from "../../components/experience/ExperienceTimeline";
import { ExperienceCTA } from "../../components/experience/ExperienceCTA";
import { experienceSteps } from "../../data/experienceData";

export const ExperiencePage = () => {
  return (
    <div className="min-h-screen bg-[#07111F] text-on-background relative flex flex-col overflow-hidden">
      {/* Paper Grain Texture */}
      <div className="paper-grain"></div>
      
      {/* Page Progress Indicator */}
      <ProgressBar />
      
      {/* Ambient Shader Canvas */}
      <BackgroundShader />
      
      {/* Global Navigation */}
      <Navbar />
      
      {/* Main Storytelling Flow */}
      <main className="flex-grow">
        {/* Centered Introduction */}
        <ExperienceHero />
        
        {/* Alternating Storytelling Steps */}
        {experienceSteps.map((step, index) => (
          <Fragment key={step.id}>
            {/* The Step Content */}
            <ExperienceStep step={step} />
            
            {/* Connector Timeline Line (except after the last step) */}
            {index < experienceSteps.length - 1 && <ExperienceTimeline />}
          </Fragment>
        ))}
        
        {/* Final Call To Action */}
        <ExperienceCTA />
      </main>
      
      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default ExperiencePage;
