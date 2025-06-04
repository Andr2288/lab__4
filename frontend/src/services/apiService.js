// Сервіс для роботи з API бекенду

import { auth } from '../config/firebase';

// URL API з змінних середовища з fallback на хостинг Render
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lab-5-backend-fwi7.onrender.com/api';

console.log('API Base URL:', API_BASE_URL);

// Допоміжна функція для отримання токена авторизації
const getAuthToken = async () => {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};

// Базова функція для виконання запитів
const makeRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    // Налаштування за замовчуванням
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Додаємо токен авторизації якщо потрібно
    if (options.requireAuth !== false) {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    try {
        console.log(`Making request to: ${url}`);
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP ${response.status}: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API request failed: ${endpoint}`, error);
        throw error;
    }
};

// API для перевірки здоров'я сервера
export const checkServerHealth = async () => {
    return makeRequest('/health', { requireAuth: false });
};

// API для турів
export const toursAPI = {
    // Отримати всі тури
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.country) queryParams.append('country', filters.country);
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
        if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/tours?${queryString}` : '/tours';

        return makeRequest(endpoint, { requireAuth: false });
    },

    // Отримати конкретний тур
    getById: async (tourId) => {
        return makeRequest(`/tours/${tourId}`, { requireAuth: false });
    }
};

// API для відгуків
export const reviewsAPI = {
    // Отримати відгуки для туру
    getForTour: async (tourId) => {
        return makeRequest(`/tours/${tourId}/reviews`, { requireAuth: false });
    },

    // Додати відгук
    add: async (tourId, reviewData) => {
        return makeRequest(`/tours/${tourId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }
};

// API для бронювань
export const bookingsAPI = {
    // Створити бронювання
    create: async (bookingData) => {
        return makeRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    // Отримати мої бронювання
    getMy: async () => {
        return makeRequest('/my-bookings');
    }
};

// API для улюблених
export const favoritesAPI = {
    // Отримати улюблені тури
    getAll: async () => {
        return makeRequest('/favorites');
    },

    // Додати до улюблених
    add: async (tourId) => {
        return makeRequest('/favorites', {
            method: 'POST',
            body: JSON.stringify({ tourId })
        });
    },

    // Видалити з улюблених
    remove: async (tourId) => {
        return makeRequest(`/favorites/${tourId}`, {
            method: 'DELETE'
        });
    }
};

// Експорт усіх API функцій для зручності
export default {
    checkServerHealth,
    tours: toursAPI,
    reviews: reviewsAPI,
    bookings: bookingsAPI,
    favorites: favoritesAPI
};