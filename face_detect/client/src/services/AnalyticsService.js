class AnalyticsService {
  // Calculate emotion percentages for a given time period
  calculateEmotionDistribution(emotionData) {
    if (!emotionData || emotionData.length === 0) return {};

    const emotionCounts = emotionData.reduce((acc, data) => {
      Object.entries(data.expressions).forEach(([emotion, value]) => {
        if (!acc[emotion]) acc[emotion] = 0;
        acc[emotion] += value;
      });
      return acc;
    }, {});

    const total = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(emotionCounts).reduce((acc, [emotion, count]) => {
      acc[emotion] = (count / total) * 100;
      return acc;
    }, {});
  }

  // Calculate engagement score based on emotional intensity
  calculateEngagementScore(emotionData) {
    if (!emotionData || emotionData.length === 0) return 0;

    const engagementWeights = {
      happy: 1.0,
      surprised: 0.8,
      angry: 0.7,
      fearful: 0.6,
      disgusted: 0.5,
      sad: 0.4,
      neutral: 0.2
    };

    const scores = emotionData.map(data => {
      return Object.entries(data.expressions).reduce((score, [emotion, value]) => {
        return score + (value * (engagementWeights[emotion] || 0));
      }, 0);
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.min(Math.round(averageScore * 100), 100); // Convert to 0-100 scale
  }

  // Identify key emotional moments
  identifyKeyMoments(emotionData, threshold = 0.7) {
    if (!emotionData || emotionData.length === 0) return [];

    return emotionData
      .filter(data => {
        const maxEmotion = Object.entries(data.expressions)
          .reduce((max, [emotion, value]) => value > max.value ? { emotion, value } : max, 
            { emotion: '', value: 0 });
        return maxEmotion.value >= threshold;
      })
      .map(data => ({
        timestamp: data.timestamp,
        dominantEmotion: data.dominantEmotion,
        intensity: Math.round(Object.entries(data.expressions)
          .reduce((max, [_, value]) => Math.max(max, value), 0) * 100)
      }));
  }

  // Track emotional transitions
  analyzeEmotionalTransitions(emotionData) {
    if (!emotionData || emotionData.length < 2) return [];

    const transitions = [];
    for (let i = 1; i < emotionData.length; i++) {
      const prevEmotion = emotionData[i - 1].dominantEmotion;
      const currentEmotion = emotionData[i].dominantEmotion;

      if (prevEmotion !== currentEmotion) {
        transitions.push({
          from: prevEmotion,
          to: currentEmotion,
          timestamp: emotionData[i].timestamp,
          intensity: Math.round(emotionData[i].expressions[currentEmotion] * 100)
        });
      }
    }
    return transitions;
  }

  // Generate summary statistics
  generateSummaryStats(emotionData) {
    if (!emotionData || emotionData.length === 0) return null;

    const emotionDistribution = this.calculateEmotionDistribution(emotionData);
    const engagementScore = this.calculateEngagementScore(emotionData);
    const keyMoments = this.identifyKeyMoments(emotionData);
    const transitions = this.analyzeEmotionalTransitions(emotionData);

    const dominantEmotion = Object.entries(emotionDistribution)
      .reduce((max, [emotion, percentage]) => 
        percentage > max.percentage ? { emotion, percentage } : max, 
        { emotion: '', percentage: 0 }
      );

    return {
      dominantEmotion: dominantEmotion.emotion,
      dominantEmotionPercentage: Math.round(dominantEmotion.percentage),
      engagementScore,
      emotionDistribution,
      numberOfTransitions: transitions.length,
      keyMomentsCount: keyMoments.length,
      totalDuration: emotionData[emotionData.length - 1].timestamp,
      averageEmotionIntensity: Math.round(
        keyMoments.reduce((sum, moment) => sum + moment.intensity, 0) / 
        (keyMoments.length || 1)
      )
    };
  }

  // Calculate minute-by-minute emotion trends
  calculateEmotionTrends(emotionData, intervalSeconds = 60) {
    if (!emotionData || emotionData.length === 0) return [];

    const trends = [];
    let currentInterval = 0;
    const maxTime = emotionData[emotionData.length - 1].timestamp;

    while (currentInterval * intervalSeconds <= maxTime) {
      const startTime = currentInterval * intervalSeconds;
      const endTime = (currentInterval + 1) * intervalSeconds;

      const intervalData = emotionData.filter(data => 
        data.timestamp >= startTime && data.timestamp < endTime
      );

      if (intervalData.length > 0) {
        const distribution = this.calculateEmotionDistribution(intervalData);
        trends.push({
          timeStart: startTime,
          timeEnd: endTime,
          emotions: distribution,
          dominantEmotion: Object.entries(distribution)
            .reduce((max, [emotion, value]) => 
              value > max.value ? { emotion, value } : max, 
              { emotion: '', value: 0 }
            ).emotion
        });
      }

      currentInterval++;
    }

    return trends;
  }
}

export default new AnalyticsService(); 