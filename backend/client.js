// Приклад інтеграції серверної та клієнтської частини

// URL API з змінних середовища або за замовчуванням
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lab-5-backend-fwi7.onrender.com/api';

// Функція для отримання даних з сервера
async function fetchDataFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log(data.message);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Функція для отримання відгуків
async function getReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        const reviews = await response.json();
        console.log('Reviews:', reviews);
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }
}

// Функція для додавання відгуку
async function addReview(userName, tourName, rating, comment) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName,
                tourName,
                rating,
                comment
            })
        });

        const result = await response.json();
        console.log('Review added:', result);
        return result;
    } catch (error) {
        console.error('Error adding review:', error);
    }
}

// Функція для отримання даних з захищеного маршруту
async function getProtectedData() {
    try {
        // Отримуємо токен з Firebase Auth
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please log in first.');
            return;
        }

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/protected`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        alert(JSON.stringify(data));
    } catch (error) {
        alert('Error fetching protected data: ' + error.message);
    }
}

// Виклик функцій при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    fetchDataFromServer();

    // Приклад використання для форми відгуку
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userName = document.getElementById('user-name').value;
            const tourName = document.getElementById('tour-name').value;
            const rating = document.getElementById('rating').value;
            const comment = document.getElementById('comment').value;

            const result = await addReview(userName, tourName, rating, comment);
            if (result && result.message) {
                alert('Review added successfully!');
                reviewForm.reset();
                // Оновити список відгуків
                getReviews();
            }
        });
    }
});