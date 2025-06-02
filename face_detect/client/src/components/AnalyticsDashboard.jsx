import React, { useEffect, useState } from 'react';
import AnalyticsService from '../services/AnalyticsService';

const AnalyticsDashboard = ({ emotionData }) => {
  const [analytics, setAnalytics] = useState(null);
  const [hoveredEmotion, setHoveredEmotion] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (emotionData && emotionData.length > 0) {
      const stats = AnalyticsService.generateSummaryStats(emotionData);
      setAnalytics(stats);
    }
  }, [emotionData]);

  const emotionColors = {
    happy: '#00ff00',
    sad: '#00a8ff',
    angry: '#ff0033',
    fearful: '#cc00ff',
    disgusted: '#ff6600',
    surprised: '#ffff00',
    neutral: '#ffffff'
  };

  // Emoji mapping for emotions
  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😲',
    neutral: '😐'
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Format the data for the server
      const formattedData = emotionData.map(data => ({
        timestamp: data.timestamp,
        dominantEmotion: data.dominantEmotion,
        expressions: {
          happy: data.expressions.happy || 0,
          sad: data.expressions.sad || 0,
          angry: data.expressions.angry || 0,
          fearful: data.expressions.fearful || 0,
          disgusted: data.expressions.disgusted || 0,
          surprised: data.expressions.surprised || 0,
          neutral: data.expressions.neutral || 0
        }
      }));

      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionData: formattedData,
          videoTitle: 'Emotion Analysis Report'
        }),
      });

      // Check if the response is JSON (error) or PDF (success)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Handle error response
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      } else if (contentType && contentType.includes('application/pdf')) {
        // Handle successful PDF response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion-analysis-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Unexpected response type from server');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(error.message || 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!analytics) return null;

  // Sort emotions by percentage for better visualization
  const sortedEmotions = Object.entries(analytics.emotionDistribution)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="p-4 space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
        <button
          onClick={handleExportPDF}
          disabled={isExporting || !emotionData.length}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
            isExporting || !emotionData.length
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <span className="text-white">
            {isExporting ? '📄 Exporting...' : '📄 Export PDF'}
          </span>
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
          <h3 className="text-green-400 text-sm font-semibold">Dominant Emotion</h3>
          <p className="text-2xl text-white capitalize">{analytics.dominantEmotion}</p>
          <p className="text-green-400 text-sm">{analytics.dominantEmotionPercentage}% of time</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
          <h3 className="text-green-400 text-sm font-semibold">Engagement Score</h3>
          <p className="text-2xl text-white">{analytics.engagementScore}</p>
          <p className="text-green-400 text-sm">out of 100</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
          <h3 className="text-green-400 text-sm font-semibold">Emotional Changes</h3>
          <p className="text-2xl text-white">{analytics.numberOfTransitions}</p>
          <p className="text-green-400 text-sm">transitions</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
          <h3 className="text-green-400 text-sm font-semibold">Key Moments</h3>
          <p className="text-2xl text-white">{analytics.keyMomentsCount}</p>
          <p className="text-green-400 text-sm">significant reactions</p>
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
        <h3 className="text-green-400 text-sm font-semibold mb-6">Overall Emotion Distribution</h3>
        <div className="space-y-4">
          {sortedEmotions.map(([emotion, percentage]) => (
            <div 
              key={emotion}
              className="relative"
              onMouseEnter={() => setHoveredEmotion(emotion)}
              onMouseLeave={() => setHoveredEmotion(null)}
            >
              {/* Emotion Label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{emotionEmojis[emotion]}</span>
                <span className="text-white capitalize">{emotion}</span>
                <span className="text-green-400 ml-auto font-mono">
                  {Math.round(percentage)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: emotionColors[emotion],
                    boxShadow: hoveredEmotion === emotion ? `0 0 10px ${emotionColors[emotion]}` : 'none',
                    opacity: hoveredEmotion === emotion ? 1 : 0.8
                  }}
                />
              </div>

              {/* Grid lines */}
              <div className="absolute inset-0 flex justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-px h-full bg-gray-600"
                    style={{ left: `${i * 25}%`, opacity: 0.2 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Percentage Scale */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;