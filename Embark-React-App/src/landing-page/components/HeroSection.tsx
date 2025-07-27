// src/landing-page/components/HeroSection.tsx
import React from 'react';
import { Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GitHubIcon from '@mui/icons-material/GitHub';

// Import the hero image
import heroImage from '../../assets/hero-image.jpg';
import { useNavigate } from 'react-router-dom';

/**
 * HeroSection Component
 *
 * This component serves as the main introductory section of the landing page.
 * It now features a two-column layout with project branding on the left
 * and a compelling image on the right, designed for a professional aesthetic.
 *
 */
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[50vh] flex items-center bg-white px-4 md:px-12 py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 w-full">
        {/* Left Side: Text Content and Buttons */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2 z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-800">
            Embark
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 font-light text-gray-700 max-w-lg">
            Your journey to intelligent automation begins here.
            Craft, visualize, and deploy powerful AI agent workflows with unparalleled ease and flexibility.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col my-12 gap-3 sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6 w-full">
            <Button
              variant="contained"
              size="large"
              className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
              startIcon={<PlayArrowIcon />}
              onClick={() =>  navigate('/workflow')}
              sx={{
                background: 'linear-gradient(45deg, #4F46E5 30%, #9333EA 90%)', // Indigo to Purple
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4338CA 30%, #7E22CE 90%)',
                  boxShadow: '0 6px 25px 0 rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
              startIcon={<GitHubIcon />}
              onClick={() => window.open('https://github.com/your-repo', '_blank')} // Replace with actual GitHub link
              sx={{
                borderColor: '#4F46E5', // Indigo
                color: '#4F46E5',
                '&:hover': {
                  backgroundColor: 'rgba(79, 70, 229, 0.08)', // Light indigo hover
                  borderColor: '#4338CA',
                  color: '#4338CA',
                },
              }}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Right Side: Hero Image */}
        <div className="md:w-1/2 flex justify-center md:justify-end z-10 mt-8 md:mt-0">
          <img
            src={heroImage}
            alt="Embark AI Agents"
            className="w-full md:w-full h-auto rounded-3xl" // Removed shadow and hover effects, increased size
            onError={(e) => {
              e.currentTarget.onerror = null; // prevents infinite loop
              e.currentTarget.src = 'https://placehold.co/600x400/E0E0E0/333333?text=Hero+Image'; // Fallback
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
