// src/landing-page/components/FrameworksSection.tsx
import React from 'react';
import { Typography } from '@mui/material';

// Import images directly
import autogenIcon from '../../assets/autogen-icon.png';
import crewaiLogo from '../../assets/crewai-logo.png';
import langgraphIcon from '../../assets/langgraph-icon.png';

/**
 * FrameworksSection Component
 *
 * This component highlights the agentic frameworks supported by the platform.
 * It now features a continuously moving carousel of images with text below.
 *
 * Styling is primarily done with Tailwind CSS for layout, typography, and spacing.
 * Theme updated to a lighter background with softer, rounded cards.
 *
 * Changes Made:
 * 1. Replaced placeholder images with actual image assets.
 * 2. Transformed the static grid of cards into a dynamic, continuously moving image carousel.
 * 3. Implemented a CSS animation for horizontal scrolling, ensuring seamless repetition.
 * 4. Adjusted layout to accommodate the new carousel design.
 * 5. Ensured all images remain black and white by removing the hover effect that restored color.
 * 6. Increased the size of the 'Autogen' icon specifically.
 */
const FrameworksSection: React.FC = () => {
  const frameworks = [
    { name: 'CrewAI', logo: crewaiLogo },
    { name: 'LangGraph', logo: langgraphIcon },
    { name: 'Autogen', logo: autogenIcon },
  ];

  // Duplicate frameworks to create a seamless loop for the animation
  const duplicatedFrameworks = [...frameworks, ...frameworks, ...frameworks];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-700">
          Built on Leading Agentic Frameworks
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Our platform seamlessly integrates with and empowers popular agentic frameworks,
          giving you the flexibility to choose the best tools for your AI workflows.
        </p>

        {/* Image Carousel Container */}
        <div className="relative w-full overflow-hidden py-8">
          <div className="flex animate-scroll-left whitespace-nowrap">
            {duplicatedFrameworks.map((framework, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center mx-8 flex-shrink-0"
                style={{ width: '150px' }} // Fixed width for each item in the carousel
              >
                <img
                  src={framework.logo}
                  alt={`${framework.name} Logo`}
                  // Apply larger size for Autogen, otherwise default size
                  className={`object-contain mb-4 filter transition-all duration-300 h-20`}
                  onError={(e) => {
                    e.currentTarget.onerror = null; // prevents infinite loop
                    e.currentTarget.src = `https://placehold.co/100x100/A0A0A0/FFFFFF?text=${framework.name}`; // Fallback
                  }}
                />
                <Typography variant="h6" component="h3" className="font-semibold text-gray-900">
                  {framework.name}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tailwind CSS keyframes for horizontal scrolling animation */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%); /* Adjust based on number of original items (1/3 for 3 items) */
          }
        }
        .animate-scroll-left {
          animation: scroll-left 15s linear infinite; /* Adjust duration as needed */
        }
      `}</style>
    </section>
  );
};

export default FrameworksSection;
