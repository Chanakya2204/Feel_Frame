import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VideoAnalytics from './VideoAnalytics';

const VideoAnalyticsPage = () => {
  const [emotionData, setEmotionData] = useState([]);
  const [videoDuration, setVideoDuration] = useState(0);

  const handleEmotionDataUpdate = (data) => {
    setEmotionData(data);
  };

  const handleDurationUpdate = (duration) => {
    setVideoDuration(duration);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-400 font-mono">
            Video Emotion Analytics
          </h1>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-800 text-green-400 rounded-lg border border-green-500 hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Video Player with Emotion Detection */}
          <div className="bg-gray-800 rounded-xl border-2 border-green-500 overflow-hidden">
            <VideoAnalytics
              onEmotionUpdate={handleEmotionDataUpdate}
              onDurationUpdate={handleDurationUpdate}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-400">
          <p>Video Emotion Analytics - Powered by face-api.js</p>
          <p className="mt-2 text-sm">
            Track viewer emotions and engagement in real-time
          </p>
        </footer>
      </div>
    </div>
  );
};

export default VideoAnalyticsPage; 