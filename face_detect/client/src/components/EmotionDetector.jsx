import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const EmotionDetector = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [expressions, setExpressions] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState('neutral');
  const [scanLinePosition, setScanLinePosition] = useState(0);

  // Emoji mapping with cyberpunk variants
  const emojiMap = {
    happy: '🟢',
    sad: '🔵',
    angry: '🔴',
    fearful: '🟣',
    disgusted: '🟤',
    surprised: '🟡',
    neutral: '⚪'
  };

  // Color mapping for emotions
  const colorMap = {
    happy: '#00ff00',
    sad: '#00a8ff',
    angry: '#ff0033',
    fearful: '#cc00ff',
    disgusted: '#ff6600',
    surprised: '#ffff00',
    neutral: '#ffffff'
  };

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('🔄 Loading face detection models...');
        
        // Configure face-api.js
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Configure detection parameters
        const minConfidence = 0.2;
        const inputSize = 224;
        const scoreThreshold = 0.5;

        // Load models from CDN
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        // Verify models are loaded
        const modelsLoaded = {
          ssd: faceapi.nets.ssdMobilenetv1.isLoaded,
          expression: faceapi.nets.faceExpressionNet.isLoaded,
          landmark: faceapi.nets.faceLandmark68Net.isLoaded
        };

        console.log('✅ Models loaded status:', modelsLoaded);

        if (!Object.values(modelsLoaded).every(loaded => loaded)) {
          throw new Error('Some models failed to load');
        }

        console.log('✨ All models loaded successfully, starting video...');
        startVideo();
      } catch (error) {
        console.error('❌ SYSTEM ERROR: Models failed to load:', error);
      }
    };

    loadModels();
  }, []);

  // Start webcam with HD resolution
  const startVideo = () => {
    console.log('📸 Starting video capture...');
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user' 
        } 
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('✅ Video stream started successfully');
        }
      })
      .catch(error => {
        console.error('❌ Error starting video:', error);
      });
  };

  // Get dominant emotion with improved detection
  const getDominantEmotion = (expressions) => {
    // Log raw expression values
    console.log('📊 Raw expression values:', 
      Object.entries(expressions)
        .map(([emotion, value]) => `${emotion}: ${(value * 100).toFixed(1)}%`)
        .join(', ')
    );

    // Get all emotions sorted by confidence
    const sortedEmotions = Object.entries(expressions)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📈 Sorted emotions:', 
      sortedEmotions
        .map(([emotion, value]) => `${emotion}: ${(value * 100).toFixed(1)}%`)
        .join(', ')
    );

    // Get the top two emotions
    const [topEmotion, secondEmotion] = sortedEmotions;
    
    // If the top emotion has significantly higher confidence (1.5x) than the second,
    // and it's not neutral, use it
    if (topEmotion && secondEmotion && 
        topEmotion[1] > secondEmotion[1] * 1.5 && 
        topEmotion[0] !== 'neutral') {
      console.log('✨ Selected emotion based on relative confidence:', topEmotion[0]);
      return topEmotion[0];
    }
    
    // If the top emotion is very confident (>40%), use it
    if (topEmotion && topEmotion[1] > 0.4) {
      console.log('✨ Selected emotion based on high confidence:', topEmotion[0]);
      return topEmotion[0];
    }
    
    console.log('😐 No clear emotion detected, defaulting to neutral');
    return 'neutral';
  };

  // Create a pulsing animation style
  const pulseAnimation = {
    animation: 'pulse 2s infinite'
  };

  // Create a keyframes style element once when component mounts
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Toggle detection with sound effect simulation
  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  // Scan line animation
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLinePosition(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    return () => clearInterval(scanInterval);
  }, []);

  // Detect face and emotion with enhanced visualization
  useEffect(() => {
    let interval;
    
    if (isDetecting) {
      console.log('🔍 Starting face detection...');
      interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused) {
          console.log('⚠️ Video not ready or paused');
          return;
        }

        try {
          // Configure detection options
          const options = new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.2,
            maxResults: 1
          });

          // Detect face with adjusted parameters
          const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          console.log('👤 Face detection result:', detections.length ? 'Face found' : 'No face detected');
          
          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            
            // Apply smoothing to expression values
            const smoothedExpressions = {};
            Object.entries(expressions).forEach(([emotion, value]) => {
              // Apply sigmoid function to make values more distinctive
              const sigmoid = x => 1 / (1 + Math.exp(-12 * (x - 0.5)));
              smoothedExpressions[emotion] = sigmoid(value);
            });

            // Normalize the smoothed values
            const total = Object.values(smoothedExpressions).reduce((sum, val) => sum + val, 0);
            Object.keys(smoothedExpressions).forEach(emotion => {
              smoothedExpressions[emotion] = smoothedExpressions[emotion] / total;
            });

            console.log('😀 Raw Expression scores:', expressions);
            console.log('🎯 Smoothed Expression scores:', smoothedExpressions);

            setExpressions(smoothedExpressions);
            setDominantEmotion(getDominantEmotion(smoothedExpressions));
          }

          // Clear and resize canvas
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          faceapi.matchDimensions(canvas, {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });

          // Draw detections with cyberpunk style
          const resized = faceapi.resizeResults(detections, {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });

          // Draw face landmarks with techy look
          if (resized[0]?.landmarks) {
            context.strokeStyle = '#00ffff';
            context.lineWidth = 1;
            faceapi.draw.drawFaceLandmarks(canvas, resized);
          }

          // Draw custom detection boxes
          resized.forEach(detection => {
            const box = detection.detection.box;
            const dominant = getDominantEmotion(detection.expressions);
            
            // Draw hexagon instead of rectangle
            context.strokeStyle = colorMap[dominant];
            context.lineWidth = 3;
            context.beginPath();
            
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            const radius = Math.max(box.width, box.height) / 2;
            
            for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI / 6) + (Math.PI / 6);
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              if (i === 0) {
                context.moveTo(x, y);
              } else {
                context.lineTo(x, y);
              }
            }
            context.closePath();
            context.stroke();
            
            // Add emotion label
            context.fillStyle = colorMap[dominant];
            context.font = 'bold 16px "Courier New", monospace';
            context.fillText(dominant.toUpperCase(), box.x, box.y - 10);
          });
        } catch (error) {
          console.error('❌ Error in face detection:', error);
        }
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isDetecting]);

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono">
      {/* CRT Screen Effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `linear-gradient(rgba(0, 255, 0, 0.1) 0 0 / 100% 2px, 
                    linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0 0 / 2px 100%)`,
        opacity: 0.3
      }}></div>
      
      {/* Scan Line Animation */}
      {isDetecting && (
        <div className="absolute left-0 right-0 h-1 bg-green-400 opacity-30 pointer-events-none" 
          style={{ top: `${scanLinePosition}%` }}></div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b border-green-400 pb-4">
          <h2 className="text-5xl font-bold text-green-400 mb-2 tracking-wider">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              NEUROSCAN
            </span>
          </h2>
          <p className="text-green-300 text-sm tracking-widest">REAL-TIME EMOTION ANALYSIS PROTOCOL v2.5.7</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Feed */}
          <div className="relative">
            <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden border-2 border-green-400 shadow-lg shadow-green-400/20">
              <video 
                ref={videoRef} 
                className="absolute top-0 left-0 w-full h-full object-cover"
                autoPlay 
                muted 
                playsInline
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full"
              />
              
              {!isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                  <div className="text-center p-4 border border-green-400 rounded-lg">
                    <div className="text-6xl mb-4">🔴</div>
                    <p className="text-green-400 tracking-wider">SCANNER OFFLINE</p>
                    <p className="text-green-300 text-xs mt-2">AWAITING ACTIVATION</p>
                  </div>
                </div>
              )}
              
              {/* HUD Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 text-xs text-green-400 flex justify-between">
                <span>RES: 1280x720</span>
                <span>FPS: 30</span>
                <span>STATUS: {isDetecting ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button 
                onClick={toggleDetection}
                className={`px-8 py-3 rounded-lg font-bold tracking-wider transition-all duration-200 border-2 ${
                  isDetecting 
                    ? 'bg-red-900/30 border-red-500 text-red-400 hover:bg-red-900/40 shadow-lg shadow-red-500/20' 
                    : 'bg-green-900/30 border-green-500 text-green-400 hover:bg-green-900/40 shadow-lg shadow-green-500/20'
                }`}
              >
                {isDetecting ? (
                  <>
                    <span className="animate-pulse">■</span> TERMINATE SCAN
                  </>
                ) : (
                  'INITIATE SCAN PROTOCOL'
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-black rounded-lg border-2 border-green-400 p-6 shadow-lg shadow-green-400/20">
            {expressions ? (
              <>
                <div className="flex justify-between items-center mb-6 border-b border-green-400 pb-4">
                  <h3 className="text-2xl font-bold text-green-400 tracking-wider">
                    EMOTION ANALYSIS
                  </h3>
                  <div className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-400">
                    LIVE DATA STREAM
                  </div>
                </div>
                
                {/* Dominant Emotion */}
                <div className="text-center mb-8">
                  <div className="text-8xl mb-4" style={{ 
                    ...pulseAnimation,
                    textShadow: `0 0 10px ${colorMap[dominantEmotion]}`
                  }}>
                    {emojiMap[dominantEmotion]}
                  </div>
                  <h4 className="text-xl font-bold uppercase tracking-wider" style={{ 
                    color: colorMap[dominantEmotion],
                    textShadow: `0 0 5px ${colorMap[dominantEmotion]}`
                  }}>
                    {dominantEmotion}
                  </h4>
                  <div className="mt-2 text-green-300 text-sm tracking-wider">
                    {(expressions[dominantEmotion] * 100).toFixed(1)}% CONFIDENCE
                  </div>
                </div>
                
                {/* Emotion Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-green-400 mb-3 tracking-wider border-b border-green-400 pb-2">
                    EMOTION SPECTRUM
                  </h4>
                  {Object.entries(expressions).map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center">
                      <span className="w-10 text-2xl mr-3" style={{ 
                        color: colorMap[emotion],
                        textShadow: emotion === dominantEmotion ? `0 0 5px ${colorMap[emotion]}` : 'none'
                      }}>
                        {emojiMap[emotion]}
                      </span>
                      <span className="w-24 text-gray-300 uppercase tracking-wider text-sm">
                        {emotion}
                      </span>
                      <div className="flex-1 bg-gray-900 h-2 rounded-full mx-2 border border-gray-700">
                        <div 
                          className={`h-full rounded-full`} 
                          style={{ 
                            width: `${value * 100}%`,
                            background: `linear-gradient(90deg, ${colorMap[emotion]}, ${colorMap[emotion]}80)`,
                            boxShadow: `0 0 3px ${colorMap[emotion]}`
                          }}
                        />
                      </div>
                      <span className="w-16 text-right text-green-300 text-sm tracking-wider">
                        {(value * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-6xl mb-6">🖥️</div>
                <h3 className="text-xl font-semibold text-green-400 mb-2 tracking-wider">
                  SYSTEM READY
                </h3>
                <p className="text-gray-500 text-sm tracking-wider">
                  INITIATE SCAN PROTOCOL TO BEGIN ANALYSIS
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-green-900 tracking-wider">
        NEUROSCAN TECHNOLOGY © 2023 | PROPRIETARY SOFTWARE v2.5.7
      </div>
    </div>
  );
};

export default EmotionDetector;