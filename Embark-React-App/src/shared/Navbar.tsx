// src/landing-page/components/Navbar.tsx
import React from 'react';

/**
 * Navbar Component
 *
 * This component provides a professional top navigation bar for the landing page.
 * It includes the project logo/name and navigation links.
 *
 * Styling is achieved using Tailwind CSS for layout and aesthetics.
 */
const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center">
      {/* Project Logo/Name */}
      <div className="flex items-center">
        <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
          Embark
        </span>
      </div>

      {/* Navigation Links (for larger screens) */}
      <div className="hidden md:flex space-x-8">

      </div>

      {/* Action Buttons (for larger screens) */}
      <div className="hidden md:flex space-x-4">
        <button className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md">
          Get Started
        </button>
      </div>

      {/* Mobile Menu Icon (Hamburger) - Not implemented for brevity, but would go here */}
      <div className="md:hidden">
        {/* You would typically add a hamburger icon here for mobile navigation */}
        <button className="text-gray-600 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
