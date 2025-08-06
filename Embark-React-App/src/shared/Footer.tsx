// src/landing-page/components/Footer.tsx
import React from 'react';
import { Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        {/* Copyright Info */}
        <Typography variant="body2" className="mb-4 md:mb-0 text-gray-400">
          &copy; {new Date().getFullYear()} Project Embark. All rights reserved.
        </Typography>

        {/* Social Media Links */}
        <div className="flex space-x-6">
          <a
            href="https://github.com/your-repo" // Replace with actual GitHub link
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            aria-label="GitHub"
          >
            <GitHubIcon fontSize="large" />
          </a>
          <a
            href="https://twitter.com/your-twitter" // Replace with actual Twitter link
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            aria-label="Twitter"
          >
            <TwitterIcon fontSize="large" />
          </a>
          <a
            href="https://linkedin.com/company/your-company" // Replace with actual LinkedIn link
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            aria-label="LinkedIn"
          >
            <LinkedInIcon fontSize="large" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
