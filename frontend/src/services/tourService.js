import { db } from '../config/firebase';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

// Константа для назви колекції
const TOURS_COLLECTION = 'tours';
const REVIEWS_COLLECTION = 'reviews';
const BOOKINGS_COLLECTION = 'bookings';

// Отримати всі тури
export const getAllTours = async () => {
    try {
        console.log("Отримуємо тури з колекції:", TOURS_COLLECTION);
        const toursCollectionRef = collection(db, TOURS_COLLECTION);
        const snapshot = await getDocs(toursCollectionRef);

        // Виведемо в консоль кількість отриманих документів
        console.log(`Отримано ${snapshot.docs.length} документів`);

        // Перетворюємо документи в масив об'єктів, перевіряючи унікальність ID
        const uniqueToursMap = new Map();

        snapshot.docs.forEach(doc => {
            // Перевіримо, чи вже є тур з таким ID
            if (!uniqueToursMap.has(doc.id)) {
                uniqueToursMap.set(doc.id, {
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        // Конвертуємо Map назад у масив
        const tours = Array.from(uniqueToursMap.values());
        console.log(`Повертаємо ${tours.length} унікальних турів`);

        return tours;
    } catch (error) {
        console.error("Помилка при отриманні списку турів:", error);
        throw error;
    }
};

// Отримати конкретний тур за ID
export const getTourById = async (tourId) => {
    try {
        if (!tourId) {
            throw new Error('ID туру не вказано');
        }

        console.log(`Отримуємо тур з ID: ${tourId}`);

        const tourDocRef = doc(db, TOURS_COLLECTION, tourId);
        const tourDoc = await getDoc(tourDocRef);

        if (!tourDoc.exists()) {
            console.error(`Тур з ID ${tourId} не знайдено`);
            throw new Error(`Тур з ID ${tourId} не знайдено`);
        }

        console.log(`Тур знайдено, дані:`, tourDoc.data());

        return {
            id: tourDoc.id,
            ...tourDoc.data()
        };
    } catch (error) {
        console.error(`Помилка при отриманні туру з ID ${tourId}:`, error);
        throw error;
    }
};

// Додати новий тур
export const addTour = async (tourData) => {
    try {
        const toursCollectionRef = collection(db, TOURS_COLLECTION);
        const newTourRef = await addDoc(toursCollectionRef, {
            ...tourData,
            createdAt: serverTimestamp()
        });

        return newTourRef.id;
    } catch (error) {
        console.error("Помилка при додаванні нового туру:", error);
        throw error;
    }
};

// Оновити існуючий тур
export const updateTour = async (tourId, tourData) => {
    try {
        const tourDocRef = doc(db, TOURS_COLLECTION, tourId);
        await updateDoc(tourDocRef, {
            ...tourData,
            updatedAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error(`Помилка при оновленні туру з ID ${tourId}:`, error);
        throw error;
    }
};

// Видалити тур
export const deleteTour = async (tourId) => {
    try {
        const tourDocRef = doc(db, TOURS_COLLECTION, tourId);
        await deleteDoc(tourDocRef);

        return true;
    } catch (error) {
        console.error(`Помилка при видаленні туру з ID ${tourId}:`, error);
        throw error;
    }
};

// Додати відгук до туру
export const addReview = async (tourId, userId, userName, text, rating) => {
    try {
        if (!tourId) {
            throw new Error('ID туру не вказано');
        }

        const reviewsCollectionRef = collection(db, REVIEWS_COLLECTION);
        const newReviewRef = await addDoc(reviewsCollectionRef, {
            tourId,
            userId,
            userName,
            text,
            rating,
            createdAt: serverTimestamp()
        });

        // Оновлюємо середній рейтинг туру
        await updateTourRating(tourId);

        return newReviewRef.id;
    } catch (error) {
        console.error("Помилка при додаванні відгуку:", error);
        throw error;
    }
};

// Отримати всі відгуки для конкретного туру
export const getReviewsForTour = async (tourId) => {
    try {
        if (!tourId) {
            throw new Error('ID туру не вказано');
        }

        const reviewsQuery = query(
            collection(db, REVIEWS_COLLECTION),
            where("tourId", "==", tourId)
        );

        const snapshot = await getDocs(reviewsQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Помилка при отриманні відгуків для туру з ID ${tourId}:`, error);
        throw error;
    }
};

// Оновити рейтинг туру на основі всіх відгуків
const updateTourRating = async (tourId) => {
    try {
        const reviews = await getReviewsForTour(tourId);

        if (reviews.length === 0) return;

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        const tourDocRef = doc(db, TOURS_COLLECTION, tourId);
        await updateDoc(tourDocRef, {
            rating: averageRating,
            reviewCount: reviews.length
        });

        return averageRating;
    } catch (error) {
        console.error(`Помилка при оновленні рейтингу туру з ID ${tourId}:`, error);
        throw error;
    }
};

// Додати бронювання туру
export const bookTour = async (tourId, userId, bookingData) => {
    try {
        if (!tourId) {
            throw new Error('ID туру не вказано');
        }

        const bookingsCollectionRef = collection(db, BOOKINGS_COLLECTION);
        const newBookingRef = await addDoc(bookingsCollectionRef, {
            tourId,
            userId,
            ...bookingData,
            status: 'pending', // pending, confirmed, completed, cancelled
            createdAt: serverTimestamp()
        });

        return newBookingRef.id;
    } catch (error) {
        console.error("Помилка при бронюванні туру:", error);
        throw error;
    }
};

// Отримати всі бронювання користувача
export const getUserBookings = async (userId) => {
    try {
        if (!userId) {
            throw new Error('ID користувача не вказано');
        }

        const bookingsQuery = query(
            collection(db, BOOKINGS_COLLECTION),
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(bookingsQuery);
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Додаємо інформацію про тур до кожного бронювання
        const bookingsWithTourInfo = await Promise.all(
            bookings.map(async (booking) => {
                try {
                    const tourInfo = await getTourById(booking.tourId);
                    return {
                        ...booking,
                        tour: tourInfo
                    };
                } catch (error) {
                    console.error(`Не вдалося отримати інформацію про тур для бронювання ${booking.id}:`, error);
                    return {
                        ...booking,
                        tour: { name: 'Інформація недоступна', imageUrl: '' }
                    };
                }
            })
        );

        return bookingsWithTourInfo;
    } catch (error) {
        console.error(`Помилка при отриманні бронювань для користувача з ID ${userId}:`, error);
        throw error;
    }
};