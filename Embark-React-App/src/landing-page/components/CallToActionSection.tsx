// src/landing-page/components/CallToActionSection.tsx
import React from 'react';
import { Button } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useNavigate } from 'react-router-dom';

/**
 * CallToActionSection Component
 *
 * This component serves as a prominent call-to-action, encouraging users
 * to begin using the platform. It features a compelling message and
 * a clear button.
 *
 * Styling is done using Tailwind CSS for layout and Material-UI Button
 * and Icon for the interactive element.
 * Theme updated to a lighter, more vibrant gradient.
 */
const CallToActionSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 text-gray-800 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
          Ready to Build Your Intelligent Workflows?
        </h2>
        <p className="text-xl md:text-2xl mb-10 opacity-90 font-light text-gray-700">
          Join the future of AI automation. Start creating, visualizing, and executing
          your agent workflows today.
        </p>
        <Button
          variant="contained"
          size="large"
          className="rounded-full px-10 py-4 text-xl font-semibold shadow-xl transition-transform transform hover:scale-105"
          startIcon={<RocketLaunchIcon />}
          onClick={() => navigate("/workflow")}
          sx={{
            background: 'linear-gradient(45deg, #6366F1 30%, #A855F7 90%)', // Indigo to Purple
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #4F46E5 30%, #9333EA 90%)',
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          Start Building Now
        </Button>
      </div>
    </section>
  );
};

export default CallToActionSection;
