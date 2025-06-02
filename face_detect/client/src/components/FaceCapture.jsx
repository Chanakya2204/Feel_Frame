// FaceCapture.js
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';

const FaceCapture = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68'),
          faceapi.nets.ageGenderNet.loadFromUri('/models/age_gender_model')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setStatus("❌ Failed to load models.");
      }
    };
    loadModels();
  }, []);

  const captureAndSend = async () => {
    if (!name.trim()) {
      setStatus("⚠️ Please enter your gamer tag!");
      return;
    }

    const video = webcamRef.current?.video;
    if (!video) {
      setStatus("⚠️ Camera not ready. Check your setup!");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withAgeAndGender();

    if (!detection) {
      setStatus("😕 No face detected. Remove your headset?");
      return;
    }

    const descriptor = Array.from(detection.descriptor);
    const gender = detection.gender;
    const genderProbability = detection.genderProbability;

    try {
      const res = await fetch('http://localhost:3001/api/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          descriptor,
          gender,
          genderProbability
        }),
      });

      const data = await res.json();
      setStatus(`✅ ${data.status || "Face registered successfully!"} | GENDER: ${gender.toUpperCase()} (${Math.round(genderProbability * 100)}%)`);
      setCameraOn(false);
    } catch (err) {
      setStatus("❌ Registration failed. Connection error!");
      setCameraOn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/20">
        <Link 
          to="/" 
          className="block mb-6 text-green-500 hover:text-green-400 transition-colors duration-300"
        >
          ← Back to Dashboard
        </Link>

        <h2 className="text-3xl font-bold text-center mb-6 text-green-400 font-mono tracking-wider">
          <span className="text-green-500">GAME</span> FACE REGISTRATION
        </h2>

        <div className="mb-6">
          <label className="block text-green-300 text-sm font-mono mb-2">ENTER YOUR GAMER TAG:</label>
          <input
            type="text"
            placeholder="e.g. xX_ProGamer_Xx"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-green-500 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {!cameraOn && (
          <button
            onClick={() => setCameraOn(true)}
            disabled={!modelsLoaded}
            className={`w-full py-3 px-4 rounded-lg font-bold font-mono tracking-wider transition-all duration-300 mb-6
              ${modelsLoaded 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
            `}
          >
            {modelsLoaded ? 'ACTIVATE CAMERA' : 'LOADING AI MODELS...'}
          </button>
        )}

        {cameraOn && (
          <div className="mb-6 flex justify-center relative">
            <Webcam
              ref={webcamRef}
              width={350}
              height={250}
              videoConstraints={{ facingMode: "user" }}
              className="rounded-lg border-2 border-green-500 shadow-lg shadow-green-500/20"
            />
            <div className="absolute inset-0 border-4 border-green-400 opacity-20 pointer-events-none rounded-lg"></div>
          </div>
        )}

        {cameraOn && (
          <button
            onClick={captureAndSend}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold font-mono tracking-wider shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
          >
            REGISTER GAMER FACE
          </button>
        )}

        {status && (
          <div className="mt-6 p-3 text-center text-sm font-mono rounded-lg bg-gray-700 border border-green-500/30">
            <span className={status.startsWith('✅') ? 'text-green-400' : status.startsWith('⚠️') ? 'text-yellow-400' : 'text-red-400'}>
              {status}
            </span>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 font-mono">
          GAME FACE IDENTIFICATION SYSTEM v1.0
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;