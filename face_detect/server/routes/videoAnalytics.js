import express from 'express';
const router = express.Router();

// In-memory storage for video analytics data
// In a production environment, this should be replaced with a proper database
const analyticsStorage = new Map();

// Store video analytics data
router.post('/store', (req, res) => {
  const { videoId, emotionData, duration } = req.body;

  if (!videoId || !emotionData || !duration) {
    return res.status(400).json({
      error: 'Missing required fields: videoId, emotionData, or duration'
    });
  }

  const timestamp = new Date().toISOString();
  const analyticsData = {
    videoId,
    emotionData,
    duration,
    timestamp,
    summary: generateSummary(emotionData)
  };

  analyticsStorage.set(videoId, analyticsData);

  res.json({
    success: true,
    message: 'Analytics data stored successfully',
    timestamp
  });
});

// Retrieve video analytics data
router.get('/:videoId', (req, res) => {
  const { videoId } = req.params;
  const analyticsData = analyticsStorage.get(videoId);

  if (!analyticsData) {
    return res.status(404).json({
      error: 'No analytics data found for the specified video'
    });
  }

  res.json(analyticsData);
});

// Get summary of all videos
router.get('/summary/all', (req, res) => {
  const summaries = [];
  analyticsStorage.forEach((data, videoId) => {
    summaries.push({
      videoId,
      timestamp: data.timestamp,
      duration: data.duration,
      summary: data.summary
    });
  });

  res.json(summaries);
});

// Helper function to generate summary statistics
function generateSummary(emotionData) {
  const emotionCounts = emotionData.reduce((acc, data) => {
    acc[data.dominantEmotion] = (acc[data.dominantEmotion] || 0) + 1;
    return acc;
  }, {});

  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
  const distribution = {};

  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    distribution[emotion] = (count / total) * 100;
  });

  // Calculate engagement score
  const engagementScore = emotionData.reduce((score, data) => {
    const positiveEmotions = ['happy', 'surprised'];
    if (positiveEmotions.includes(data.dominantEmotion)) {
      score += Object.values(data.expressions).reduce((a, b) => a + b, 0);
    }
    return score;
  }, 0) / emotionData.length;

  // Find emotional peaks (transitions)
  const peaks = emotionData.reduce((acc, data, index) => {
    if (index === 0) return acc;
    const prevEmotion = emotionData[index - 1].dominantEmotion;
    if (data.dominantEmotion !== prevEmotion) {
      acc.push({
        time: data.timestamp,
        from: prevEmotion,
        to: data.dominantEmotion
      });
    }
    return acc;
  }, []).slice(0, 5); // Keep only top 5 transitions

  return {
    distribution,
    engagementScore,
    peaks,
    totalDataPoints: emotionData.length
  };
}

export default router; 