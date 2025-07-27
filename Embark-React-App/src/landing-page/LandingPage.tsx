// src/landing-page/LandingPage.tsx
import React from 'react';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import FrameworksSection from './components/FrameworksSection';
import ConnectivitySection from './components/ConnectivitySection';
import CallToActionSection from './components/CallToActionSection';

/**
 * LandingPage Component
 *
 * This is the main component for the project's landing page.
 * It orchestrates and renders all the individual sections
 * (Hero, Features, Frameworks, Connectivity, CTA, Footer)
 * to form a complete and attractive single-page experience.
 * The overall theme is now more vibrant and gradient-focused.
 */
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <HeroSection />
      <FeaturesSection />
      <FrameworksSection />
      <ConnectivitySection />
      <CallToActionSection />
    </div>
  );
};

export default LandingPage;
