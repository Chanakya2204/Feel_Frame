import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: 'Emotion Detection',
      description: 'Detect facial emotions in real time',
      path: '/emotion',
      icon: '😊'
    },
    {
      title: 'Video Analytics',
      description: 'Track viewer emotions during video playback',
      path: '/video-analytics',
      icon: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 font-mono tracking-wider">
          <span className="text-green-500">GAME</span> FACE DASHBOARD
        </h1>

        {/* Centering only two features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className="w-full max-w-md p-8 bg-gray-800/80 backdrop-blur-md rounded-2xl 
                         border-2 border-green-500 hover:border-green-400 
                         transition-all duration-300 shadow-lg hover:shadow-green-500/40
                         transform hover:scale-105"
            >
              <div className="flex items-center space-x-6">
                <span className="text-5xl">{feature.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-green-400 font-mono">{feature.title}</h2>
                  <p className="text-gray-300 mt-2">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center text-gray-400">
          <p className="text-lg">Enhance your gaming experience with real-time facial analysis</p>
          <p className="mt-3 text-xl font-mono">
            <span className="text-green-500">✨ New:</span> Video analytics for deeper engagement insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
