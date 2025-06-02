import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const AgeGenderAnalysis = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedResult, setUploadedResult] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
          faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
          faceapi.nets.ageGenderNet.loadFromUri(`${MODEL_URL}/age_gender_model`)
        ]);
        setModelsLoaded(true);
        setStatus('✅ Systems online! Models loaded successfully!');
      } catch (err) {
        console.error(err);
        setStatus('❌ ERROR: Failed to load neural networks.');
      }
    };
    loadModels();
  }, []);

  const drawBox = useCallback((detection) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    if (!canvas || !video) return;

    const dims = faceapi.matchDimensions(canvas, video);
    const resized = faceapi.resizeResults(detection, dims);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    resized.forEach(result => {
      const { age, gender, genderProbability, detection } = result;
      const box = detection.box;
      const label = `Age: ${Math.round(age)} | Gender: ${gender} (${Math.round(genderProbability * 100)}%)`;
      new faceapi.draw.DrawBox(box, {
        label,
        lineWidth: 2,
        boxColor: gender === 'male' ? '#2ecc71' : '#1abc9c'
      }).draw(canvas);
    });
  }, []);

  const analyzeFace = async () => {
    setStatus('Initializing scan protocol...');
    setLoading(true);
    setAnalysisResult(null);

    const video = webcamRef.current.video;
    if (!video) {
      setStatus('❌ ERROR: Visual feed not detected');
      setLoading(false);
      return;
    }

    try {
      setStatus('Scanning biometrics...');
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender();

      if (!detections.length) {
        setStatus('⚠️ WARNING: No targets detected. Adjust visual feed.');
        setLoading(false);
        return;
      }

      const { age, gender, genderProbability } = detections[0];

      setAnalysisResult({
        age: Math.round(age),
        gender,
        confidence: genderProbability
      });

      drawBox(detections);
      setStatus('✅ SCAN COMPLETE: Target acquired');
    } catch (err) {
      console.error(err);
      setStatus('❌ CRITICAL: Scan failure. Reinitializing...');
    }

    setLoading(false);
  };

  const resetAnalysis = () => {
    setCameraOn(false);
    setAnalysisResult(null);
    setImagePreview(null);
    setUploadedResult(null);
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setStatus('Systems standby...');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('Uploading target image...');
    setLoading(true);
    setUploadedResult(null);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const { data } = await axios.post('http://localhost:3001/api/analyze-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedResult(data);
      setStatus('✅ ANALYSIS COMPLETE: Target processed');
    } catch (err) {
      console.error(err);
      setStatus('❌ ERROR: Failed to process target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8 font-mono" style={{ background: 'radial-gradient(circle, #0a2e0a 0%, #051405 100%)' }}>
      <div className="max-w-md mx-auto">
        {/* Cyberpunk-style header */}
        <header className="text-center mb-8 relative">
          <div className="absolute -inset-1 bg-green-500 blur opacity-20 rounded-lg"></div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 relative">
            <span className="text-green-500">[</span> BIO-SCAN <span className="text-green-500">]</span>
          </h1>
          <p className="text-green-300 text-sm tracking-widest">NEURAL NETWORK ANALYSIS MODULE</p>
          <div className="flex justify-center mt-2">
            <div className="h-1 w-16 bg-green-500"></div>
          </div>
        </header>

        {/* Main terminal-like card */}
        <div className="bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-green-500">
          {/* Terminal top bar */}
          <div className="bg-green-900 px-4 py-2 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-green-300 ml-4">bio_scan.exe</div>
          </div>

          {/* Mode selector */}
          <div className="flex border-b border-green-800">
            <button
              onClick={() => setCameraOn(false)}
              className={`flex-1 py-3 text-sm font-mono ${!cameraOn ? 'bg-green-900 text-white border-b-2 border-green-400' : 'text-green-400 hover:bg-green-900/50'}`}
            >
              [ FILE UPLOAD ]
            </button>
            <button
              onClick={() => setCameraOn(true)}
              className={`flex-1 py-3 text-sm font-mono ${cameraOn ? 'bg-green-900 text-white border-b-2 border-green-400' : 'text-green-400 hover:bg-green-900/50'}`}
            >
              [ LIVE FEED ]
            </button>
          </div>

          <div className="p-5 bg-black/70">
            {!cameraOn ? (
              <>
                {/* Upload section */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-green-300 font-mono">
                    [ SELECT TARGET IMAGE ]
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-700 rounded-lg cursor-pointer bg-black hover:bg-green-900/20 transition-all duration-300">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="mb-2 text-sm text-green-400 font-mono">[ CLICK TO UPLOAD ]</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {imagePreview && (
                  <div className="mb-4 border-2 border-green-700 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  </div>
                )}

                {uploadedResult && (
                  <div className="mt-4 bg-green-900/30 p-4 rounded-lg border-2 border-green-700">
                    <h3 className="text-lg font-semibold text-center mb-3 text-green-400 font-mono">[ SCAN RESULTS ]</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black p-3 rounded text-center border border-green-800">
                        <p className="text-xs text-green-300 font-mono">AGE</p>
                        <p className="text-2xl font-bold text-green-400">{uploadedResult.analysis.age}</p>
                      </div>
                      <div className="bg-black p-3 rounded text-center border border-green-800">
                        <p className="text-xs text-green-300 font-mono">GENDER</p>
                        <p className="text-2xl font-bold text-green-400 capitalize">{uploadedResult.analysis.gender}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Camera section */}
                <div className="relative w-full border-2 border-green-700 rounded-lg overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width="100%"
                    height="auto"
                    screenshotFormat="image/jpeg"
                    className=""
                    videoConstraints={{ facingMode: 'user' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  {!analysisResult ? (
                    <button
                      onClick={analyzeFace}
                      disabled={loading || !modelsLoaded}
                      className={`flex-1 py-3 rounded-lg font-bold font-mono tracking-wider ${loading || !modelsLoaded ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-green-700 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/30 transition-all'}`}
                    >
                      {loading ? '[ SCANNING... ]' : '[ INITIATE SCAN ]'}
                    </button>
                  ) : (
                    <button
                      onClick={resetAnalysis}
                      className="flex-1 py-3 rounded-lg font-bold font-mono bg-black border-2 border-green-700 hover:bg-green-900/50 text-green-400 transition-all"
                    >
                      [ RESET SYSTEMS ]
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Status message */}
            {status && (
              <div className="mt-4 text-left text-sm px-3 py-2 rounded bg-black border-l-4 border-green-500 font-mono text-green-300">
                 {status}
              </div>
            )}

            {/* Analysis results */}
            {analysisResult && (
              <div className="mt-4 bg-green-900/20 p-4 rounded-lg border-2 border-green-700">
                <h3 className="text-lg font-semibold text-center mb-3 text-green-400 font-mono">[ BIOMETRIC DATA ]</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black p-3 rounded text-center border border-green-800">
                    <p className="text-xs text-green-300 font-mono">AGE</p>
                    <p className="text-2xl font-bold text-green-400">{analysisResult.age}</p>
                  </div>
                  <div className="bg-black p-3 rounded text-center border border-green-800">
                    <p className="text-xs text-green-300 font-mono">GENDER</p>
                    <p className="text-2xl font-bold text-green-400 capitalize">{analysisResult.gender}</p>
                  </div>
                </div>
                <div className="mt-3 bg-black p-3 rounded border border-green-800">
                  <p className="text-xs text-green-300 mb-1 font-mono">SCAN CONFIDENCE</p>
                  <div className="w-full bg-green-900/50 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }} 
                    />
                  </div>
                  <p className="text-right text-xs mt-1 text-green-300 font-mono">
                    {Math.round(analysisResult.confidence * 100)}% ACCURACY
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-green-700 font-mono">
          <p>SYSTEM STATUS: {modelsLoaded ? 'OPERATIONAL' : 'INITIALIZING'}</p>
          <p className="mt-1">v2.4.1 | BIOMETRIC SCAN MODULE</p>
        </footer>
      </div>
    </div>
  );
};

export default AgeGenderAnalysis;