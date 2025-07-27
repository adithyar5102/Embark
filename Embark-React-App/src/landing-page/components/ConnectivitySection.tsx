// src/landing-page/components/ConnectivitySection.tsx
import React from 'react';
import { Typography } from '@mui/material';
import { Cable, Stream, Code } from '@mui/icons-material';

/**
 * ConnectivitySection Component
 *
 * This component highlights the advanced connectivity features of the platform,
 * specifically mentioning Model Context Protocol (MCP) and support for
 * STDIO and SSE modes.
 *
 * Styling is handled by Tailwind CSS for layout and Material-UI Icons for visual representation.
 * Theme updated to a lighter background with more prominent, rounded cards.
 */
const ConnectivitySection: React.FC = () => {
  const connectivityFeatures = [
    {
      icon: <Code className="text-purple-500 text-5xl mb-4" />,
      title: 'STDIO Mode',
      description:
        'Robust support for standard input/output streams, ensuring compatibility with various execution environments.',
    },
    {
      icon: <Stream className="text-green-500 text-5xl mb-4" />,
      title: 'SSE Mode',
      description:
        'Server-Sent Events for real-time, efficient communication and live updates of agent execution status.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
          Seamless & Robust MCP Connectivity
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Our platform is engineered for high-performance and flexible communication,
          ensuring your AI agents can interact effortlessly with tools and data.
        </p>
        <div className="flex justify-center gap-8">
          {connectivityFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-xl
                         hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {feature.icon}
              <Typography variant="h5" component="h3" className="font-semibold text-gray-900 mb-3">
                {feature.title}
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                {feature.description}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConnectivitySection;
