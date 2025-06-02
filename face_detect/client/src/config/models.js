const BASE_MODEL_URL = import.meta.env.PROD 
  ? 'https://justadudewhohacks.github.io/face-api.js/models'  // CDN for production
  : '/models'; // Local path for development

export const modelPaths = {
  tinyFaceDetector: `${BASE_MODEL_URL}/tiny_face_detector`,
  faceRecognition: `${BASE_MODEL_URL}/face_recognition`,
  faceLandmark68: `${BASE_MODEL_URL}/face_landmark_68`,
  ageGender: `${BASE_MODEL_URL}/age_gender_model`,
  faceExpression: `${BASE_MODEL_URL}/face_expression`
};

export default modelPaths; 