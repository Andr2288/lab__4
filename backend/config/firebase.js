const admin = require('firebase-admin');
require('dotenv').config();

let db = null;

const initializeFirebase = () => {
    try {
        // Перевіряємо чи Firebase вже ініціалізований
        if (admin.apps.length > 0) {
            console.log('✅ Firebase Admin SDK вже ініціалізований');
            db = admin.firestore();
            return { admin, db };
        }

        // Створюємо об'єкт service account з змінних середовища
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID || "tour-project-4e881",
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
            universe_domain: "googleapis.com"
        };

        // Перевіряємо чи всі необхідні змінні є
        const requiredFields = ['project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
        const missingFields = requiredFields.filter(field => !serviceAccount[field]);

        if (missingFields.length > 0) {
            throw new Error(`Відсутні змінні середовища для Firebase: ${missingFields.join(', ')}`);
        }

        // Ініціалізуємо Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        // Отримуємо екземпляр Firestore
        db = admin.firestore();

        console.log('✅ Firebase Admin SDK успішно ініціалізований');
        console.log(`📊 Підключено до проекту: ${serviceAccount.project_id}`);

        return { admin, db };
    } catch (error) {
        console.error('❌ Помилка ініціалізації Firebase Admin SDK:', error.message);
        throw error;
    }
};

// Функція для отримання екземпляра бази даних
const getDatabase = () => {
    if (!db) {
        throw new Error('Firebase не ініціалізований. Викличте initializeFirebase() спочатку.');
    }
    return db;
};

// Функція для перевірки токена автентифікації
const verifyIdToken = async (idToken) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error(`Помилка верифікації токена: ${error.message}`);
    }
};

// Експорт функцій
module.exports = {
    initializeFirebase,
    getDatabase,
    verifyIdToken,
    admin: () => admin,
    // Для зворотної сумісності
    db: () => getDatabase()
};
