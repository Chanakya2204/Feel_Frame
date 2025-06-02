const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export const endpoints = {
  registerFace: `${API_URL}/api/register-face`,
  recognizeFace: `${API_URL}/api/recognize-face`,
  analyzeFace: `${API_URL}/api/analyze-face`,
  generateReport: `${API_URL}/api/report/generate`
};

export default endpoints; 