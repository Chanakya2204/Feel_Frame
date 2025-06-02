import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import canvas from 'canvas';
import * as faceapi from 'face-api.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import videoAnalyticsRouter from './routes/videoAnalytics.js';
import reportExportRouter from './routes/reportExport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Multer for file uploads
const upload = multer({
  dest: 'uploads/', // Save to uploads/ folder
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'), false);
    }
    cb(null, true);
  }
});

// Face database (to store name and face descriptor)
let faceDB = []; // { name, descriptor }
let analysisDB = []; // { name, gender, emotion, timestamp, location }

// Initialize canvas with face-api.js
const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image });

// Load face-api.js models
async function initModels() {
  const modelPath = path.join(__dirname, '../client/public/models'); // Make sure this folder has your models
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(`${modelPath}/ssd_mobilenetv1`);
  await faceapi.nets.ageGenderNet.loadFromDisk(`${modelPath}/age_gender_model`);
  console.log('✅ Face-api.js models loaded');
}

// Euclidean distance for face recognition
function euclideanDistance(d1, d2) {
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    sum += Math.pow(d1[i] - d2[i], 2);
  }
  return Math.sqrt(sum);
}

// Add routes
app.use('/api/video-analytics', videoAnalyticsRouter);
app.use('/api/report', reportExportRouter);

// API: Register a face
app.post('/api/register-face', (req, res) => {
  const { name, descriptor, gender, genderProbability } = req.body;

  if (!name || !descriptor) {
    return res.status(400).json({ success: false, error: 'Name and descriptor are required' });
  }

  if (faceDB.some(entry => entry.name === name)) {
    return res.status(409).json({ success: false, error: 'Name already registered' });
  }

  faceDB.push({ name, descriptor });

  // Store the initial analysis data
  if (gender && genderProbability) {
    analysisDB.push({
      name,
      gender,
      genderProbability,
      emotion: null,
      timestamp: new Date().toISOString(),
      location: null
    });
  }

  console.log(`📌 Registered: ${name}`);
  res.json({
    success: true,
    message: `Face registered for ${name}`,
    count: faceDB.length
  });
});

// API: Recognize face from descriptor
app.post('/api/recognize-face', (req, res) => {
  const { descriptor, gender, genderProbability, emotion, timestamp, location } = req.body;

  if (!descriptor || !Array.isArray(descriptor)) {
    return res.status(400).json({
      recognized: false,
      error: 'Valid descriptor array required'
    });
  }

  let bestMatch = { name: null, distance: Infinity };

  faceDB.forEach(person => {
    const distance = euclideanDistance(descriptor, person.descriptor);
    if (distance < 0.6 && distance < bestMatch.distance) {
      bestMatch = { name: person.name, distance };
    }
  });

  // Store the analysis data if a face was recognized
  if (bestMatch.name) {
    analysisDB.push({
      name: bestMatch.name,
      gender,
      genderProbability,
      emotion,
      timestamp,
      location,
      confidence: 1 - (bestMatch.distance / 0.6)
    });
  }

  res.json(bestMatch.name ? {
    recognized: true,
    name: bestMatch.name,
    confidence: 1 - (bestMatch.distance / 0.6)
  } : {
    recognized: false,
    message: 'No match found'
  });
});

// API: Upload a photo (optional standalone)
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image uploaded' });
  }

  const filePath = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    filePath,
    originalName: req.file.originalname
  });
});

// API: Analyze face (age & gender) from uploaded photo
app.post('/api/analyze-face', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const imagePath = path.join(__dirname, req.file.path);
    console.log(`📸 Received photo: ${imagePath}`);

    // Load the image into canvas
    const image = await canvas.loadImage(imagePath);
    const detections = await faceapi.detectAllFaces(image).withAgeAndGender();

    if (!detections || detections.length === 0) {
      return res.status(400).json({ success: false, error: 'No face detected in the image.' });
    }

    // Take the first detected face
    const { age, gender, genderProbability } = detections[0];

    const analysisResult = {
      age: Math.floor(age),
      gender,
      confidence: +(genderProbability).toFixed(2)
    };

    analysisDB.push({
      ...analysisResult,
      emotion: null,
      timestamp: new Date().toISOString(),
      location: null
    });

    res.json({
      success: true,
      analysis: analysisResult
    });

  } catch (err) {
    console.error('❌ Analysis error:', err);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// API: Get attendance records
app.get('/api/attendance', (req, res) => {
  const records = analysisDB.map(record => ({
    name: record.name,
    gender: record.gender,
    emotion: record.emotion,
    timestamp: record.timestamp,
    location: record.location
  }));

  res.json({
    success: true,
    records
  });
});

// API: Stats & recent analysis
app.get('/api/data', (req, res) => {
  const lastRecord = analysisDB[analysisDB.length - 1] || null;
  const attendanceByUser = {};
  
  analysisDB.forEach(record => {
    if (!attendanceByUser[record.name]) {
      attendanceByUser[record.name] = [];
    }
    attendanceByUser[record.name].push({
      timestamp: record.timestamp,
      emotion: record.emotion,
      location: record.location
    });
  });

  res.json({
    faceCount: faceDB.length,
    analysisCount: analysisDB.length,
    lastAnalysis: lastRecord,
    attendanceStats: attendanceByUser
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initModels().catch(console.error);
});
