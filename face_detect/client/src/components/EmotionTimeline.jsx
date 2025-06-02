import React from 'react';

const EmotionTimeline = ({ emotionData, duration }) => {
  // Calculate emotion percentages for each time segment
  const calculateEmotionStats = () => {
    if (!emotionData.length) return [];

    const timeSegments = [];
    const segmentDuration = duration / 10; // Split video into 10 segments

    for (let i = 0; i < 10; i++) {
      const startTime = i * segmentDuration;
      const endTime = (i + 1) * segmentDuration;

      const segmentEmotions = emotionData.filter(
        data => data.timestamp >= startTime && data.timestamp < endTime
      );

      if (segmentEmotions.length > 0) {
        const emotionCounts = {
          happy: 0,
          sad: 0,
          angry: 0,
          fearful: 0,
          disgusted: 0,
          surprised: 0,
          neutral: 0
        };

        segmentEmotions.forEach(data => {
          emotionCounts[data.dominantEmotion]++;
        });

        const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
        const percentages = {};

        Object.entries(emotionCounts).forEach(([emotion, count]) => {
          percentages[emotion] = (count / total) * 100;
        });

        timeSegments.push({
          startTime,
          endTime,
          percentages
        });
      }
    }

    return timeSegments;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const timeSegments = calculateEmotionStats();

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Detailed Emotion Analysis</h2>
      
      <div className="grid grid-cols-10 gap-1">
        {timeSegments.map((segment, index) => (
          <div key={index} className="flex flex-col">
            <div className="h-40 flex flex-col-reverse">
              {Object.entries(segment.percentages).map(([emotion, percentage]) => (
                <div
                  key={emotion}
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: getEmotionColor(emotion),
                    opacity: 0.7
                  }}
                  title={`${emotion}: ${percentage.toFixed(1)}%`}
                  className="w-full transition-all duration-200 hover:opacity-100"
                />
              ))}
            </div>
            <div className="text-xs mt-1 text-center text-gray-300">
              {formatTime(segment.startTime)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {Object.entries(getEmotionColor()).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm capitalize text-gray-300">{emotion}</span>
          </div>
        ))}
      </div>

      {emotionData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2 text-white">Key Insights</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded border border-gray-700">
              <h4 className="font-semibold mb-2 text-gray-300">Most Common Emotion</h4>
              {getMostCommonEmotion(emotionData)}
            </div>
            <div className="p-4 bg-gray-800 rounded border border-gray-700">
              <h4 className="font-semibold mb-2 text-gray-300">Peak Engagement</h4>
              <span className="text-gray-400">
                {getPeakEngagementTime(emotionData, duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get color for emotion
const getEmotionColor = (emotion) => {
  const colors = {
    happy: '#00ff00',
    sad: '#0000ff',
    angry: '#ff0000',
    fearful: '#800080',
    disgusted: '#ffa500',
    surprised: '#ffff00',
    neutral: '#808080'
  };
  return emotion ? colors[emotion] || '#808080' : colors;
};

// Helper function to get most common emotion
const getMostCommonEmotion = (emotionData) => {
  const emotionCounts = emotionData.reduce((acc, data) => {
    acc[data.dominantEmotion] = (acc[data.dominantEmotion] || 0) + 1;
    return acc;
  }, {});

  const mostCommon = Object.entries(emotionCounts).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded"
        style={{ backgroundColor: getEmotionColor(mostCommon[0]) }}
      />
      <span className="capitalize text-gray-300">{mostCommon[0]}</span>
      <span className="text-gray-500">
        ({((mostCommon[1] / emotionData.length) * 100).toFixed(1)}% of time)
      </span>
    </div>
  );
};

// Helper function to get peak engagement time
const getPeakEngagementTime = (emotionData, duration) => {
  const engagingEmotions = ['happy', 'surprised'];
  const peakMoment = emotionData.reduce((peak, current) => {
    const isEngaging = engagingEmotions.includes(current.dominantEmotion);
    const currentScore = isEngaging ? 
      Object.values(current.expressions).reduce((a, b) => a + b, 0) : 0;
    
    return currentScore > peak.score ? 
      { time: current.timestamp, score: currentScore } : peak;
  }, { time: 0, score: 0 });

  const minutes = Math.floor(peakMoment.time / 60);
  const seconds = Math.floor(peakMoment.time % 60);
  
  return (
    <span>
      {minutes}:{seconds.toString().padStart(2, '0')} 
      {' '}({((peakMoment.time / duration) * 100).toFixed(1)}% through video)
    </span>
  );
};

export default EmotionTimeline; 