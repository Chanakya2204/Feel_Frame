// Always use local models from the public directory
const BASE_MODEL_URL = '/models';

export const modelPaths = {
  tinyFaceDetector: `${BASE_MODEL_URL}/tiny_face_detector`,
  faceRecognition: `${BASE_MODEL_URL}/face_recognition`,
  faceLandmark68: `${BASE_MODEL_URL}/face_landmark_68`,
  ageGender: `${BASE_MODEL_URL}/age_gender_model`,
  faceExpression: `${BASE_MODEL_URL}/face_expression`
};

export default modelPaths; 