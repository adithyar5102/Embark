// src/landing-page/components/FeaturesSection.tsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import {
  AccountTree,
  AutoAwesome,
  SettingsEthernet,
  Cloud,
} from '@mui/icons-material';

/**
 * FeaturesSection Component
 *
 * This component showcases the key features of the AI agent execution project.
 * It uses a grid layout with cards to present each feature clearly and attractively.
 *
 * Styling is handled by Tailwind CSS for layout and spacing, and Material-UI
 * Card, CardContent, Typography, and Icons for structured content and visual cues.
 * Theme updated to a lighter background with more prominent, rounded cards.
 */
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <AccountTree className="text-blue-500 text-5xl mb-4" />,
      title: 'Dynamic Workflow Creation',
      description:
        'Visually design and configure complex AI agent workflows with interconnected nodes and custom conditions.',
    },
    {
      icon: <AutoAwesome className="text-purple-500 text-5xl mb-4" />,
      title: 'Autonomous Agent Pools',
      description:
        'Deploy agents into intelligent pools where decision-making is autonomously managed by the agents themselves.',
    },
    {
      icon: <Cloud className="text-green-500 text-5xl mb-4" />,
      title: 'Model & LLM Agnostic',
      description:
        'Seamlessly integrate with any AI model or LLM provider. Your choice, our platform.',
    },
    {
      icon: <SettingsEthernet className="text-red-500 text-5xl mb-4" />,
      title: 'Advanced Connectivity',
      description:
        'Leverage Model Context Protocol (MCP) and support for both STDIO and SSE modes for robust agent communication.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
          Unlock the Power of AI Automation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white border border-gray-100"
              sx={{
                borderRadius: '1.5rem', // Tailwind's rounded-3xl
                boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 6px 12px -3px rgba(0, 0, 0, 0.05)', // Stronger shadow
                '&:hover': {
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.04)', // Even stronger on hover
                },
              }}
            >
              <CardContent className="p-8 flex flex-col items-center">
                {feature.icon}
                <Typography variant="h5" component="h3" className="font-semibold text-gray-900 mb-3">
                  {feature.title}
                </Typography>
                <Typography variant="body1" className="text-gray-600">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
