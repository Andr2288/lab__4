// Приклад інтеграції серверної та клієнтської частини

// Функція для отримання даних з сервера
async function fetchDataFromServer() {
    try {
        const response = await fetch('http://localhost:5000/api/message');
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
        const response = await fetch('http://localhost:5000/api/reviews');
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
        const response = await fetch('http://localhost:5000/api/reviews', {
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
        // Припускаємо, що токен зберігається в localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
            alert('Please log in first.');
            return;
        }

        const response = await fetch('http://localhost:5000/api/protected', {
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