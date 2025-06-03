const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Ініціалізація Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ініціалізація Firebase Admin SDK
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

// Хостинг статичних файлів
app.use(express.static('public'));

// Базовий маршрут
app.get('/api/message', (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

// Маршрут для отримання всіх відгуків про тури
app.get('/api/reviews', async (req, res) => {
    try {
        const reviewsSnapshot = await admin.firestore()
            .collection('reviews')
            .orderBy('createdAt', 'desc')
            .get();

        const reviews = [];
        reviewsSnapshot.forEach(doc => {
            const data = doc.data();
            // Трансформація даних: додаємо відформатовану дату
            const formattedDate = data.createdAt ?
                new Date(data.createdAt.toDate()).toLocaleDateString('uk-UA') :
                new Date().toLocaleDateString('uk-UA');

            reviews.push({
                id: doc.id,
                ...data,
                dateFormatted: formattedDate
            });
        });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Маршрут для додавання нового відгуку
app.post('/api/reviews', async (req, res) => {
    try {
        const { userName, tourName, rating, comment } = req.body;

        // Валідація даних
        if (!userName || !tourName || !rating || !comment) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (comment.length < 10 || comment.length > 500) {
            return res.status(400).json({
                error: 'Comment must be between 10 and 500 characters'
            });
        }

        // Перевірка на заборонені слова
        const forbiddenWords = ['конкурент', 'competitor', 'поганий'];
        const hasForbiddenWords = forbiddenWords.some(word =>
            comment.toLowerCase().includes(word.toLowerCase())
        );

        if (hasForbiddenWords) {
            return res.status(400).json({
                error: 'Review contains inappropriate content'
            });
        }

        // Створення нового відгуку
        const newReview = {
            userName,
            tourName,
            rating: parseInt(rating),
            comment,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore()
            .collection('reviews')
            .add(newReview);

        res.status(201).json({
            id: docRef.id,
            message: 'Review added successfully'
        });

    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// Захищений маршрут (middleware для перевірки токена)
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

// Захищений маршрут
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});