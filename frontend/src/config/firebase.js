// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration з змінних середовища
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Перевірка чи всі змінні середовища присутні
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Відсутні змінні середовища Firebase:', missingEnvVars);
  throw new Error(`Missing Firebase environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase
let app;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase ініціалізовано успішно');

  // Analytics тільки в production
  if (process.env.NODE_ENV === 'production' && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
    console.log('📊 Firebase Analytics увімкнено');
  }
} catch (error) {
  console.error('❌ Помилка ініціалізації Firebase:', error);
  throw error;
}

// Експорт сервісів Firebase
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };

// Додаткові налаштування для Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Експорт конфігурації для діагностики
export const config = firebaseConfig;

// Функція для перевірки з'єднання
export const testFirebaseConnection = async () => {
  try {
    // Простий тест для перевірки підключення до Firestore
    const testDoc = db.collection('_test').doc('connection');
    await testDoc.get();
    console.log('🔗 З\'єднання з Firebase працює');
    return true;
  } catch (error) {
    console.error('❌ Помилка з\'єднання з Firebase:', error);
    return false;
  }
};

export default app;