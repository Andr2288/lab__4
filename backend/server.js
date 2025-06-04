const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Імпорт Firebase конфігурації
const { initializeFirebase, getDatabase, verifyIdToken } = require('./config/firebase');

// Ініціалізація Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Ініціалізація Firebase
let db;
try {
    const firebaseApp = initializeFirebase();
    db = getDatabase();
} catch (error) {
    console.error('❌ Критична помилка:', error.message);
    console.error('🔧 Перевірте налаштування Firebase в .env файлі');
    process.exit(1);
}

// Middleware для перевірки автентифікації
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Токен автентифікації не надано'
        });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Помилка перевірки токена:', error);
        return res.status(401).json({
            success: false,
            error: 'Недійсний токен автентифікації'
        });
    }
};

// Хостинг статичних файлів для фронтенду (якщо потрібно)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// API Routes

// Базовий маршрут для перевірки роботи сервера
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Server is running!",
        timestamp: new Date().toISOString()
    });
});

// ТУРИ
// Отримати всі тури
app.get('/api/tours', async (req, res) => {
    try {
        const { country, sortBy, sortOrder } = req.query;

        let query = db.collection('tours');

        // Фільтрування за країною
        if (country) {
            query = query.where('country', '==', country);
        }

        const snapshot = await query.get();
        let tours = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Сортування
        if (sortBy) {
            tours.sort((a, b) => {
                const aValue = a[sortBy] || 0;
                const bValue = b[sortBy] || 0;

                if (sortOrder === 'desc') {
                    return bValue - aValue;
                }
                return aValue - bValue;
            });
        }

        res.json({
            success: true,
            data: tours,
            count: tours.length
        });
    } catch (error) {
        console.error('Помилка отримання турів:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося отримати список турів'
        });
    }
});

// Отримати конкретний тур
app.get('/api/tours/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tourDoc = await db.collection('tours').doc(id).get();

        if (!tourDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Тур не знайдено'
            });
        }

        res.json({
            success: true,
            data: {
                id: tourDoc.id,
                ...tourDoc.data()
            }
        });
    } catch (error) {
        console.error('Помилка отримання туру:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося отримати дані про тур'
        });
    }
});

// ВІДГУКИ
// Отримати відгуки для туру
app.get('/api/tours/:tourId/reviews', async (req, res) => {
    try {
        const { tourId } = req.params;

        const reviewsSnapshot = await db.collection('reviews')
            .where('tourId', '==', tourId)
            .orderBy('createdAt', 'desc')
            .get();

        const reviews = reviewsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            };
        });

        res.json({
            success: true,
            data: reviews,
            count: reviews.length
        });
    } catch (error) {
        console.error('Помилка отримання відгуків:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося отримати відгуки'
        });
    }
});

// Додати відгук (потребує автентифікації)
app.post('/api/tours/:tourId/reviews', verifyToken, async (req, res) => {
    try {
        const { tourId } = req.params;
        const { text, rating } = req.body;
        const userId = req.user.uid;
        const userName = req.user.name || req.user.email;

        // Валідація
        if (!text || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Текст відгуку та рейтинг є обов\'язковими'
            });
        }

        if (text.length < 10 || text.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Довжина відгуку має бути від 10 до 500 символів'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Рейтинг має бути від 1 до 5'
            });
        }

        // Перевірка існування туру
        const tourDoc = await db.collection('tours').doc(tourId).get();
        if (!tourDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Тур не знайдено'
            });
        }

        // Створення відгуку
        const reviewData = {
            tourId,
            userId,
            userName,
            text,
            rating: parseInt(rating),
            createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
        };

        const reviewRef = await db.collection('reviews').add(reviewData);

        // Оновлення рейтингу туру
        await updateTourRating(tourId);

        res.status(201).json({
            success: true,
            data: {
                id: reviewRef.id,
                ...reviewData,
                createdAt: new Date()
            },
            message: 'Відгук успішно додано'
        });
    } catch (error) {
        console.error('Помилка додавання відгуку:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося додати відгук'
        });
    }
});

// БРОНЮВАННЯ
// Створити бронювання (потребує автентифікації)
app.post('/api/bookings', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookingData = req.body;

        // Валідація обов'язкових полів
        const requiredFields = ['tourId', 'firstName', 'lastName', 'email', 'phone', 'travelers', 'startDate', 'endDate'];
        const missingFields = requiredFields.filter(field => !bookingData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Відсутні обов'язкові поля: ${missingFields.join(', ')}`
            });
        }

        // Перевірка існування туру
        const tourDoc = await db.collection('tours').doc(bookingData.tourId).get();
        if (!tourDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Тур не знайдено'
            });
        }

        const booking = {
            ...bookingData,
            userId,
            status: 'pending',
            createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
        };

        const bookingRef = await db.collection('bookings').add(booking);

        res.status(201).json({
            success: true,
            data: {
                id: bookingRef.id,
                ...booking,
                createdAt: new Date()
            },
            message: 'Бронювання успішно створено'
        });
    } catch (error) {
        console.error('Помилка створення бронювання:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося створити бронювання'
        });
    }
});

// Отримати бронювання користувача
app.get('/api/my-bookings', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const bookingsSnapshot = await db.collection('bookings')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const bookings = await Promise.all(bookingsSnapshot.docs.map(async (doc) => {
            const bookingData = doc.data();

            // Отримуємо дані про тур
            const tourDoc = await db.collection('tours').doc(bookingData.tourId).get();
            const tourData = tourDoc.exists ? tourDoc.data() : null;

            return {
                id: doc.id,
                ...bookingData,
                tour: tourData,
                createdAt: bookingData.createdAt?.toDate?.() || bookingData.createdAt
            };
        }));

        res.json({
            success: true,
            data: bookings,
            count: bookings.length
        });
    } catch (error) {
        console.error('Помилка отримання бронювань:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося отримати бронювання'
        });
    }
});

// УЛЮБЛЕНІ
// Додати до улюблених
app.post('/api/favorites', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { tourId } = req.body;

        if (!tourId) {
            return res.status(400).json({
                success: false,
                error: 'ID туру є обов\'язковим'
            });
        }

        // Перевіряємо, чи тур вже в улюблених
        const existingFavorite = await db.collection('favorites')
            .where('userId', '==', userId)
            .where('tourId', '==', tourId)
            .get();

        if (!existingFavorite.empty) {
            return res.status(400).json({
                success: false,
                error: 'Тур вже в улюблених'
            });
        }

        const favoriteData = {
            userId,
            tourId,
            createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
        };

        const favoriteRef = await db.collection('favorites').add(favoriteData);

        res.status(201).json({
            success: true,
            data: {
                id: favoriteRef.id,
                ...favoriteData,
                createdAt: new Date()
            },
            message: 'Тур додано до улюблених'
        });
    } catch (error) {
        console.error('Помилка додавання до улюблених:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося додати до улюблених'
        });
    }
});

// Видалити з улюблених
app.delete('/api/favorites/:tourId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { tourId } = req.params;

        const favoriteSnapshot = await db.collection('favorites')
            .where('userId', '==', userId)
            .where('tourId', '==', tourId)
            .get();

        if (favoriteSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'Тур не знайдено в улюблених'
            });
        }

        await favoriteSnapshot.docs[0].ref.delete();

        res.json({
            success: true,
            message: 'Тур видалено з улюблених'
        });
    } catch (error) {
        console.error('Помилка видалення з улюблених:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося видалити з улюблених'
        });
    }
});

// Отримати улюблені тури
app.get('/api/favorites', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const favoritesSnapshot = await db.collection('favorites')
            .where('userId', '==', userId)
            .get();

        const favorites = await Promise.all(favoritesSnapshot.docs.map(async (doc) => {
            const favoriteData = doc.data();

            // Отримуємо дані про тур
            const tourDoc = await db.collection('tours').doc(favoriteData.tourId).get();
            const tourData = tourDoc.exists ? tourDoc.data() : null;

            return {
                id: doc.id,
                ...favoriteData,
                tour: tourData,
                createdAt: favoriteData.createdAt?.toDate?.() || favoriteData.createdAt
            };
        }));

        res.json({
            success: true,
            data: favorites,
            count: favorites.length
        });
    } catch (error) {
        console.error('Помилка отримання улюблених:', error);
        res.status(500).json({
            success: false,
            error: 'Не вдалося отримати улюблені тури'
        });
    }
});

// Допоміжна функція для оновлення рейтингу туру
async function updateTourRating(tourId) {
    try {
        const reviewsSnapshot = await db.collection('reviews')
            .where('tourId', '==', tourId)
            .get();

        const reviews = reviewsSnapshot.docs.map(doc => doc.data());

        if (reviews.length === 0) return;

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await db.collection('tours').doc(tourId).update({
            rating: Number(averageRating.toFixed(1)),
            reviewCount: reviews.length
        });
    } catch (error) {
        console.error('Помилка оновлення рейтингу туру:', error);
    }
}

// Обробка всіх інших маршрутів для SPA (якщо це production)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    console.log(`📍 API доступне за адресою: http://localhost:${PORT}/api`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Фронтенд доступний за адресою: http://localhost:${PORT}`);
    }
});