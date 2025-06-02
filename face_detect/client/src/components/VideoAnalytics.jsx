import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import AnalyticsDashboard from './AnalyticsDashboard';
import EmotionTimeline from './EmotionTimeline';

const VideoAnalytics = ({ onEmotionUpdate }) => {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [emotionData, setEmotionData] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [detectionInterval, setDetectionInterval] = useState(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        console.log('Face detection models loaded');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
        setCameraError('Failed to load face detection models');
      }
    };
    loadModels();
  }, []);

  // Process webcam frame
  const processWebcamFrame = async () => {
    // Check all prerequisites
    if (!modelsLoaded) {
      console.log('⚠️ Skipping frame - models not loaded');
      return;
    }
    if (!webcamRef.current?.video) {
      console.log('⚠️ Skipping frame - webcam not initialized');
      return;
    }
    if (!canvasRef.current) {
      console.log('⚠️ Skipping frame - canvas not initialized');
      return;
    }
    if (!webcamRef.current.video.readyState === 4) {
      console.log('⚠️ Skipping frame - video not ready');
      return;
    }

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      // Match canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Detect face and emotions
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detection) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw face detection box
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);
        
        // Draw face landmarks and expressions
        faceapi.draw.drawDetections(canvas, [resizedDetection]);
        faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);

        // Store emotion data with video timestamp
        const emotionEntry = {
          timestamp: videoRef.current.currentTime,
          expressions: detection.expressions,
          dominantEmotion: Object.entries(detection.expressions)
            .reduce((a, b) => (b[1] > a[1] ? b : a))[0]
        };
        
        setEmotionData(prev => [...prev, emotionEntry]);
        onEmotionUpdate(emotionEntry);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  };

  // Handle video state changes
  const handleVideoStateChange = (isVideoPlaying) => {
    if (isVideoPlaying) {
      // Start emotion detection when video plays
      const interval = setInterval(processWebcamFrame, 100);
      setDetectionInterval(interval);
      setIsAnalyzing(true);
    } else {
      // Stop emotion detection when video pauses/ends
      if (detectionInterval) {
        clearInterval(detectionInterval);
        setDetectionInterval(null);
      }
      setIsAnalyzing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [detectionInterval]);

  // Toggle video playback
  const togglePlayback = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        handleVideoStateChange(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
        handleVideoStateChange(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Video Player */}
        <div className="lg:w-3/4">
          <div className="mb-4">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Stop any existing analysis when new video is loaded
                  handleVideoStateChange(false);
                  setVideoUrl(URL.createObjectURL(file));
                  setEmotionData([]);
                  setCurrentTime(0);
                }
              }}
              className="w-full p-2 rounded border border-gray-600 text-white bg-gray-800"
            />
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
              onPlay={() => handleVideoStateChange(true)}
              onPause={() => handleVideoStateChange(false)}
              onEnded={() => handleVideoStateChange(false)}
            />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={togglePlayback}
              disabled={!videoUrl || !modelsLoaded}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span className="text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            {isAnalyzing && (
              <div className="flex items-center gap-2 ml-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 text-sm">Recording emotions...</span>
              </div>
            )}
          </div>
        </div>

        {/* Webcam Feed */}
        <div className="lg:w-1/4">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">Emotion Detection</h3>
              <div className="text-xs text-gray-400 mt-1">
                {isAnalyzing ? 'Active' : 'Waiting for video playback...'}
              </div>
            </div>
            <div className="relative aspect-video">
              <Webcam
                ref={webcamRef}
                mirrored
                className={`w-full h-full object-cover transition-opacity duration-300 ${!isAnalyzing ? 'opacity-50' : ''}`}
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: 'user'
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
              {!isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-gray-400 p-4 text-center">
                  <div>
                    <div className="text-4xl mb-2">📹</div>
                    <p className="text-sm">
                      {cameraError || 'Camera will activate when video plays'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Timeline */}
      <div className="mt-8">
        <h2 className="text-xl text-white mb-4">Emotion Timeline</h2>
        <EmotionTimeline 
          emotionData={emotionData} 
          duration={duration}
          currentTime={currentTime}
        />
      </div>

      {/* Analytics Dashboard */}
      <div className="mt-8">
        <AnalyticsDashboard emotionData={emotionData} />
      </div>
    </div>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default VideoAnalytics;