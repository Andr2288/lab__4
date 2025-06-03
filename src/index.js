import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeDatabase, addDemoReviews } from './utils/initializeDatabase';
import './index.css';

// Ініціалізуємо базу даних з демо-даними при першому завантаженні
initializeDatabase().then(initialized => {
    if (initialized) {
        // Якщо були додані тури, додаємо також демо-відгуки
        addDemoReviews();
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);