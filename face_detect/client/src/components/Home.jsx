import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: 'Emotion Detection',
      description: 'Detect facial emotions',
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
        <h1 className="text-4xl font-bold text-center mb-12 font-mono">
          <span className="text-green-500">GAME</span> FACE DASHBOARD
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className="block p-6 bg-gray-800 rounded-xl border-2 border-green-500 hover:border-green-400 transition-all duration-300 shadow-lg hover:shadow-green-500/20"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{feature.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-green-400 font-mono">{feature.title}</h2>
                  <p className="text-gray-400 mt-2">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p>Use our advanced facial analysis tools to enhance your gaming experience</p>
          <p className="mt-2">
            <span className="text-green-500">New!</span> Try our video analytics feature to understand viewer engagement
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
