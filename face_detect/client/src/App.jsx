import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import FaceCapture from './components/FaceCapture';
import FaceRecognition from './components/FaceRecognition';
import AgeGenderAnalysis from './components/AgeGenderAnalysis';
import EmotionDetector from './components/EmotionDetector';
import VideoAnalyticsPage from './components/VideoAnalyticsPage';
import EmotionTimeline from './components/EmotionTimeline';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/face-capture" element={<FaceCapture />} />
        <Route path="/face-recognition" element={<FaceRecognition />} />
        <Route path="/age-gender" element={<AgeGenderAnalysis />} />
        <Route path="/emotion" element={<EmotionDetector />} />
        <Route path="/video-analytics" element={<VideoAnalyticsPage />} />
      </Routes>
    </Router>
  );
}

export default App;

