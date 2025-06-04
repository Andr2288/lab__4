import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    // getDoc, - видалили невикористаний імпорт
    doc,
    // addDoc, - видалили невикористаний імпорт
    deleteDoc
} from 'firebase/firestore';
import { getAllTours } from '../services/tourService';

const Favorites = ({ isAuth, user }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                if (isAuth && user) {
                    // Отримати список улюблених турів користувача з Firestore
                    const favoritesQuery = query(
                        collection(db, 'favorites'),
                        where('userId', '==', user.uid)
                    );

                    const favoritesSnapshot = await getDocs(favoritesQuery);
                    const favoritesData = favoritesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Отримати деталі для кожного туру
                    const allTours = await getAllTours();

                    // Фільтруємо тури, які є в списку улюблених
                    const favoriteTours = allTours.filter(tour =>
                        favoritesData.some(favorite => favorite.tourId === tour.id)
                    );

                    setFavorites(favoriteTours);
                } else {
                    // Якщо користувач не увійшов, використовуємо localStorage
                    const localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];

                    // Отримати всі тури
                    const allTours = await getAllTours();

                    // Фільтруємо тури, які є в localStorage
                    const favoriteTours = allTours.filter(tour => localFavorites.includes(tour.id));

                    setFavorites(favoriteTours);
                }
            } catch (error) {
                console.error('Помилка при завантаженні улюблених турів:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [isAuth, user]);

    // Функція для видалення туру з улюблених
    const removeFavorite = async (tourId) => {
        try {
            if (isAuth && user) {
                // Видалити з Firestore
                const favoritesQuery = query(
                    collection(db, 'favorites'),
                    where('userId', '==', user.uid),
                    where('tourId', '==', tourId)
                );

                const favoritesSnapshot = await getDocs(favoritesQuery);

                if (!favoritesSnapshot.empty) {
                    const favoriteDoc = favoritesSnapshot.docs[0];
                    await deleteDoc(doc(db, 'favorites', favoriteDoc.id));
                }
            } else {
                // Видалити з localStorage
                const localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
                const updatedFavorites = localFavorites.filter(id => id !== tourId);
                localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
            }

            // Оновити стан
            setFavorites(favorites.filter(tour => tour.id !== tourId));
        } catch (error) {
            console.error('Помилка при видаленні туру з улюблених:', error);
        }
    };

    // Функція для обробки шляхів до зображень
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        }

        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `${process.env.PUBLIC_URL}/${cleanPath}`;
    };

    // Обробник помилки завантаження зображення
    const handleImageError = (e) => {
        if (!e.target.src.includes('placeholder.jpg')) {
            e.target.src = `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        }
        e.target.onerror = null;
    };

    if (loading) {
        return <div className="loading">Завантаження улюблених турів...</div>;
    }

    return (
        <section id="favorites">
            <h2>Улюблені тури</h2>

            {favorites.length === 0 ? (
                <div className="no-favorites">
                    <p>У вас ще немає улюблених турів.</p>
                    <p>Натисніть на серце ❤️ біля туру, щоб додати його до улюблених.</p>
                </div>
            ) : (
                <div className="tour-cards-container">
                    {favorites.map(tour => (
                        <div key={tour.id} className="tour-card" data-id={tour.id}>
                            <img
                                src={getImageUrl(tour.imageUrl)}
                                alt={tour.name}
                                onError={handleImageError}
                            />
                            <button
                                className="like-btn liked"
                                onClick={() => removeFavorite(tour.id)}
                            >
                                ❤️
                            </button>
                            <div className="tour-details">
                                <h3>{tour.name}</h3>
                                <p>{tour.location}</p>
                                <p className="tour-price">Ціна: {tour.price} грн</p>
                                <Link to={`/tour/${tour.id}`} className="book-btn">
                                    Детальніше
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Favorites;