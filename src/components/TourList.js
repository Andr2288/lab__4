import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTours } from "../services/tourService";
import { db, auth } from "../config/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc
} from "firebase/firestore";

const TourList = ({ isAuth, currentUser }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [sortBy, setSortBy] = useState({ field: 'price', asc: true });

    // Перелік країн для вкладок
    const countries = [
        { id: "turkey", name: "Туреччина", image: "photo/turkey.jpg" },
        { id: "switzerland", name: "Швейцарія", image: "photo/switzerland.jpg" },
        { id: "japan", name: "Японія", image: "photo/japan.jpg" },
    ];

    useEffect(() => {
        // Завантажуємо тури
        const fetchTours = async () => {
            try {
                const tourData = await getAllTours();
                setTours(tourData);
            } catch (err) {
                console.error("Помилка отримання турів:", err);
                setError("Не вдалося завантажити тури. Спробуйте оновити сторінку.");
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
    }, []);

    useEffect(() => {
        // Завантажуємо улюблені тури
        const fetchFavorites = async () => {
            try {
                if (isAuth && currentUser) {
                    // Отримуємо улюблені тури з Firestore
                    const favoritesQuery = query(
                        collection(db, "favorites"),
                        where("userId", "==", currentUser.uid)
                    );

                    const favoritesSnapshot = await getDocs(favoritesQuery);
                    const favoritesData = favoritesSnapshot.docs.map(doc => doc.data().tourId);

                    setFavorites(favoritesData);
                } else {
                    // Якщо користувач не авторизований, беремо дані з localStorage
                    const localFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
                    setFavorites(localFavorites);
                }
            } catch (err) {
                console.error("Помилка отримання улюблених турів:", err);
            }
        };

        fetchFavorites();
    }, [isAuth, currentUser]);

    // Функція для додавання/видалення туру з улюблених
    const toggleFavorite = async (tourId) => {
        try {
            if (isAuth && currentUser) {
                // Перевіряємо, чи тур вже в улюблених
                const isFavorite = favorites.includes(tourId);

                if (isFavorite) {
                    // Видаляємо з Firestore
                    const favoritesQuery = query(
                        collection(db, "favorites"),
                        where("userId", "==", currentUser.uid),
                        where("tourId", "==", tourId)
                    );

                    const favoritesSnapshot = await getDocs(favoritesQuery);

                    if (!favoritesSnapshot.empty) {
                        const favoriteDoc = favoritesSnapshot.docs[0];
                        await deleteDoc(favoriteDoc.ref);
                    }

                    // Оновлюємо стан
                    setFavorites(favorites.filter(id => id !== tourId));
                } else {
                    // Додаємо до Firestore
                    await addDoc(collection(db, "favorites"), {
                        userId: currentUser.uid,
                        tourId: tourId,
                        createdAt: new Date()
                    });

                    // Оновлюємо стан
                    setFavorites([...favorites, tourId]);
                }
            } else {
                // Якщо користувач не авторизований, використовуємо localStorage
                const localFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
                const isFavorite = localFavorites.includes(tourId);

                if (isFavorite) {
                    const updatedFavorites = localFavorites.filter(id => id !== tourId);
                    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
                    setFavorites(updatedFavorites);
                } else {
                    const updatedFavorites = [...localFavorites, tourId];
                    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
                    setFavorites(updatedFavorites);
                }
            }
        } catch (err) {
            console.error("Помилка при оновленні улюблених:", err);
        }
    };

    // Функція для відображення зірочок для рейтингу
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 !== 0;

        // Додаємо заповнені зірки
        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className="star full">★</span>);
        }

        // Додаємо половину зірки якщо потрібно
        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">★</span>);
        }

        // Додаємо пусті зірки до 5
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
        }

        return stars;
    };

    // Обробник для вибору країни
    const handleCountrySelect = (countryId) => {
        setSelectedCountry(countryId);
    };

    // Функція для сортування турів
    const handleSort = (field) => {
        if (sortBy.field === field) {
            // Якщо це те саме поле, міняємо напрямок сортування
            setSortBy({ field, asc: !sortBy.asc });
        } else {
            // Якщо нове поле, встановлюємо за зростанням
            setSortBy({ field, asc: true });
        }
    };

    // Отримуємо відфільтровані і відсортовані тури
    const getFilteredAndSortedTours = () => {
        // Фільтруємо за країною
        let filteredTours = tours;
        if (selectedCountry) {
            filteredTours = tours.filter(tour => tour.country === selectedCountry);
        }

        // Сортуємо
        return [...filteredTours].sort((a, b) => {
            let valueA = a[sortBy.field] || 0;
            let valueB = b[sortBy.field] || 0;

            // Для рядків
            if (typeof valueA === 'string') {
                return sortBy.asc
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            // Для чисел
            return sortBy.asc ? valueA - valueB : valueB - valueA;
        });
    };

    if (loading) {
        return <div className="loading">Завантаження турів...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <section id="hot-tours">
            <h2>Ласкаво просимо на нашу туристичну платформу!</h2>
            <p>Оберіть один із розділів нижче, щоб переглянути доступні тури.</p>

            {/* Вкладки країн */}
            <div className="country-tabs">
                {countries.map(country => (
                    <div
                        key={country.id}
                        className={`country-tab ${selectedCountry === country.id ? 'active' : ''}`}
                        id={`${country.id}-tab`}
                        onClick={() => handleCountrySelect(country.id)}
                    >
                        <img src={country.image} alt={country.name} />
                        <h3>{country.name}</h3>
                    </div>
                ))}
            </div>

            {/* Секція з турами */}
            {selectedCountry && (
                <div className="tours-section">
                    <div className="section-header">
                        <h2>Тури до {countries.find(c => c.id === selectedCountry)?.name}</h2>
                        <div className="sort-controls">
                            <button
                                className={`sort-button ${sortBy.field === 'price' ? (sortBy.asc ? 'asc' : 'desc') : ''}`}
                                onClick={() => handleSort('price')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sort-icon">
                                    <path d="M17 8.5L12 3L7 8.5M7 15.5L12 21L17 15.5"/>
                                </svg>
                                За ціною
                            </button>
                            <button
                                className={`sort-button ${sortBy.field === 'rating' ? (sortBy.asc ? 'asc' : 'desc') : ''}`}
                                onClick={() => handleSort('rating')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sort-icon">
                                    <path d="M17 8.5L12 3L7 8.5M7 15.5L12 21L17 15.5"/>
                                </svg>
                                За рейтингом
                            </button>
                        </div>
                    </div>

                    {/* Картки турів */}
                    <div className="tour-cards-container">
                        {getFilteredAndSortedTours().map(tour => (
                            <div key={tour.id} className="tour-card" data-id={tour.id}>
                                <img src={tour.imageUrl} alt={tour.name} />
                                <button
                                    className={`like-btn ${favorites.includes(tour.id) ? 'liked' : ''}`}
                                    onClick={() => toggleFavorite(tour.id)}
                                >
                                    ❤️
                                </button>
                                <div className="tour-details">
                                    <h3>{tour.name}</h3>
                                    <p>{tour.location}</p>
                                    <div className="tour-rating">
                                        {renderStars(tour.rating)}
                                        <span className="rating-value">({tour.rating ? tour.rating.toFixed(1) : '0'})</span>
                                    </div>
                                    <p className="tour-price">Ціна: {tour.price} грн</p>
                                    <Link to={`/tour/${tour.id}`} className="book-btn">
                                        Детальніше
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default TourList;