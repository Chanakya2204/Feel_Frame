import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const FaceRecognition = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
          faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
          faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`),
          faceapi.nets.ageGenderNet.loadFromUri(`${MODEL_URL}/age_gender_model`),
          faceapi.nets.faceExpressionNet.loadFromUri(`${MODEL_URL}/face_expression`)
        ]);
        setModelsLoaded(true);
        // Get geolocation after models are loaded
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              console.error('Geolocation error:', error);
              setStatus('⚠️ Location access denied. Some features may be limited.');
            }
          );
        }
      } catch (error) {
        console.error('Model loading failed:', error);
        setStatus('❌ Failed to load models.');
      }
    };
    loadModels();
  }, []);

  // Get dominant emotion
  const getDominantEmotion = (expressions) => {
    return Object.entries(expressions).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
  };

  // Draw face box with gaming-style effects
  const drawBox = useCallback((detection) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    const context = canvas.getContext('2d');

    faceapi.matchDimensions(canvas, {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    const resized = faceapi.resizeResults(detection, {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detection box with gaming-style effects
    if (resized && resized.detection) {
      const box = resized.detection.box;
      const emotion = getDominantEmotion(resized.expressions);
      
      // Set color based on emotion
      const emotionColors = {
        happy: '#00ff00',
        sad: '#00a8ff',
        angry: '#ff0033',
        fearful: '#cc00ff',
        disgusted: '#ff6600',
        surprised: '#ffff00',
        neutral: '#ffffff'
      };
      
      context.strokeStyle = emotionColors[emotion] || '#00ff00';
      context.lineWidth = 3;
      context.strokeRect(box.x, box.y, box.width, box.height);
      
      // Add corner marks
      const cornerSize = 15;
      context.beginPath();
      
      // Top-left
      context.moveTo(box.x, box.y + cornerSize);
      context.lineTo(box.x, box.y);
      context.lineTo(box.x + cornerSize, box.y);
      
      // Top-right
      context.moveTo(box.x + box.width - cornerSize, box.y);
      context.lineTo(box.x + box.width, box.y);
      context.lineTo(box.x + box.width, box.y + cornerSize);
      
      // Bottom-right
      context.moveTo(box.x + box.width, box.y + box.height - cornerSize);
      context.lineTo(box.x + box.width, box.y + box.height);
      context.lineTo(box.x + box.width - cornerSize, box.y + box.height);
      
      // Bottom-left
      context.moveTo(box.x + cornerSize, box.y + box.height);
      context.lineTo(box.x, box.y + box.height);
      context.lineTo(box.x, box.y + box.height - cornerSize);
      
      context.stroke();
      
      // Add pulsing glow effect
      const glowIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 300);
      context.shadowColor = emotionColors[emotion] || '#00ff00';
      context.shadowBlur = 10 * glowIntensity;
      context.strokeRect(box.x, box.y, box.width, box.height);
      context.shadowBlur = 0;

      // Draw emotion label
      context.fillStyle = emotionColors[emotion] || '#00ff00';
      context.font = 'bold 16px "Courier New", monospace';
      context.fillText(emotion.toUpperCase(), box.x, box.y - 10);
    }
  }, []);

  // Face Recognition Handler
  const recognizeFace = async () => {
    setStatus('');
    setLoading(true);

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withAgeAndGender()
        .withFaceExpressions();

      if (!detection) {
        setStatus('⚠️ No player detected. Remove your headset?');
        setLoading(false);
        return;
      }

      drawBox(detection);

      const descriptor = Array.from(detection.descriptor);
      const gender = detection.gender;
      const genderProbability = detection.genderProbability;
      const emotion = getDominantEmotion(detection.expressions);
      const timestamp = new Date().toISOString();

      const res = await fetch('http://localhost:3001/api/recognize-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descriptor,
          gender,
          genderProbability,
          emotion,
          timestamp,
          location: location || null
        }),
      });

      const data = await res.json();

      if (data.recognized) {
        const attendanceTime = new Date(timestamp).toLocaleTimeString();
        setStatus(
          `✅ PLAYER: ${data.name.toUpperCase()} | ` +
          `GENDER: ${gender.toUpperCase()} (${Math.round(genderProbability * 100)}%) | ` +
          `MOOD: ${emotion.toUpperCase()} | ` +
          `TIME: ${attendanceTime}`
        );
      } else {
        setStatus('❌ UNKNOWN PLAYER. REGISTER FIRST.');
      }
      setCameraOn(false);
    } catch (error) {
      console.error(error);
      setStatus('❌ SYSTEM ERROR. TRY AGAIN.');
      setCameraOn(false);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/20">
        <h2 className="text-3xl font-bold text-center mb-6 text-green-400 font-mono tracking-wider">
          <span className="text-green-500">GAMER</span> IDENTIFICATION SYSTEM
        </h2>

        {location && (
          <div className="mb-4 text-xs text-center text-green-300 font-mono">
            📍 LAT: {location.latitude.toFixed(6)} | LON: {location.longitude.toFixed(6)}
          </div>
        )}

        {!cameraOn ? (
          <button
            onClick={() => setCameraOn(true)}
            disabled={!modelsLoaded}
            className={`w-full py-3 px-4 rounded-lg font-bold font-mono tracking-wider transition-all duration-300 mb-4
              ${modelsLoaded 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
            `}
          >
            {modelsLoaded ? 'ACTIVATE SCANNER' : 'LOADING AI MODULES...'}
          </button>
        ) : (
          <>
            <div className="relative w-full mt-4 border-2 border-green-500 rounded-lg overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                width={350}
                height={250}
                className="block"
                videoConstraints={{
                  width: 350,
                  height: 250,
                  facingMode: "user",
                }}
              />
              <canvas
                ref={canvasRef}
                width={350}
                height={250}
                className="absolute top-0 left-0 pointer-events-none"
              />
              <div className="absolute inset-0 border-4 border-green-400 opacity-20 pointer-events-none"></div>
            </div>

            <button
              onClick={recognizeFace}
              disabled={loading}
              className={`mt-6 w-full py-3 px-4 rounded-lg font-bold font-mono tracking-wider transition-all duration-300
                ${loading 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'}
              `}
            >
              {loading ? 'SCANNING...' : 'IDENTIFY PLAYER'}
            </button>
          </>
        )}

        {status && (
          <div className={`mt-6 p-3 text-center text-sm font-mono rounded-lg border ${status.startsWith('✅') ? 'bg-green-900/30 border-green-500/30' : status.startsWith('⚠️') ? 'bg-yellow-900/30 border-yellow-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
            <span className={status.startsWith('✅') ? 'text-green-400' : status.startsWith('⚠️') ? 'text-yellow-400' : 'text-red-400'}>
              {status}
            </span>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 font-mono">
          BIOMETRIC SCAN v3.0
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;