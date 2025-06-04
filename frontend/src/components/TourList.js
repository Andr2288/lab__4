import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTours } from "../services/tourService";
import { db } from "../config/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from "firebase/firestore";

const TourList = ({ isAuth, currentUser, openAuthModal }) => {
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

    // Виправлена функція для обробки шляхів до зображень
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        }

        // Якщо це повний URL
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Видаляємо початковий слеш якщо є
        let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

        // Формуємо повний шлях
        return `${process.env.PUBLIC_URL}/${cleanPath}`;
    };

    // Обробник помилки завантаження зображення
    const handleImageError = (e) => {
        console.error('Помилка завантаження зображення:', e.target.src);

        if (!e.target.src.includes('placeholder.jpg')) {
            e.target.src = `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        } else {
            // Якщо навіть placeholder не завантажується
            e.target.style.backgroundColor = '#f0f0f0';
            e.target.style.display = 'flex';
            e.target.style.alignItems = 'center';
            e.target.style.justifyContent = 'center';
            e.target.style.color = '#666';
            e.target.style.fontSize = '14px';
            e.target.alt = 'Зображення недоступне';
        }

        e.target.onerror = null;
    };

    useEffect(() => {
        const fetchTours = async () => {
            try {
                console.log('Отримуємо список всіх турів');
                const tourData = await getAllTours();
                console.log('Отримані тури:', tourData.length);

                setTours(tourData);

                if (!selectedCountry && tourData.length > 0) {
                    setSelectedCountry(countries[0].id);
                }
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
        const fetchFavorites = async () => {
            try {
                if (isAuth && currentUser) {
                    const favoritesQuery = query(
                        collection(db, "favorites"),
                        where("userId", "==", currentUser.uid)
                    );

                    const favoritesSnapshot = await getDocs(favoritesQuery);
                    const favoritesData = favoritesSnapshot.docs.map(doc => doc.data().tourId);

                    setFavorites(favoritesData);
                } else {
                    const localFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
                    setFavorites(localFavorites);
                }
            } catch (err) {
                console.error("Помилка отримання улюблених турів:", err);
            }
        };

        fetchFavorites();
    }, [isAuth, currentUser]);

    const toggleFavorite = async (e, tourId) => {
        e.stopPropagation();

        try {
            if (isAuth && currentUser) {
                const isFavorite = favorites.includes(tourId);

                if (isFavorite) {
                    const favoritesQuery = query(
                        collection(db, "favorites"),
                        where("userId", "==", currentUser.uid),
                        where("tourId", "==", tourId)
                    );

                    const favoritesSnapshot = await getDocs(favoritesQuery);

                    if (!favoritesSnapshot.empty) {
                        const favoriteDoc = favoritesSnapshot.docs[0];
                        await deleteDoc(doc(db, "favorites", favoriteDoc.id));
                    }

                    setFavorites(favorites.filter(id => id !== tourId));
                } else {
                    await addDoc(collection(db, "favorites"), {
                        userId: currentUser.uid,
                        tourId: tourId,
                        createdAt: new Date()
                    });

                    setFavorites([...favorites, tourId]);
                }
            } else {
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

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className="star full">★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">★</span>);
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
        }

        return stars;
    };

    const handleCountrySelect = (countryId) => {
        setSelectedCountry(countryId);
    };

    const handleSort = (field) => {
        if (sortBy.field === field) {
            setSortBy({ field, asc: !sortBy.asc });
        } else {
            setSortBy({ field, asc: true });
        }
    };

    const getFilteredAndSortedTours = () => {
        let filteredTours = tours;
        if (selectedCountry) {
            filteredTours = tours.filter(tour => tour.country === selectedCountry);
        }

        return [...filteredTours].sort((a, b) => {
            let valueA = a[sortBy.field] || 0;
            let valueB = b[sortBy.field] || 0;

            if (typeof valueA === 'string') {
                return sortBy.asc
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            return sortBy.asc ? valueA - valueB : valueB - valueA;
        });
    };

    if (loading) {
        return <div className="loading">Завантаження турів...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    const filteredAndSortedTours = getFilteredAndSortedTours();
    console.log("Відфільтровані та відсортовані тури:", filteredAndSortedTours.length);

    return (
        <section id="hot-tours">
            <h2>Ласкаво просимо на нашу туристичну платформу!</h2>
            <p>Оберіть один із розділів нижче, щоб переглянути доступні тури.</p>

            <div className="country-tabs">
                {countries.map(country => (
                    <div
                        key={country.id}
                        className={`country-tab ${selectedCountry === country.id ? 'active' : ''}`}
                        id={`${country.id}-tab`}
                        onClick={() => handleCountrySelect(country.id)}
                    >
                        <img
                            src={getImageUrl(country.image)}
                            alt={country.name}
                            onError={handleImageError}
                        />
                        <h3>{country.name}</h3>
                    </div>
                ))}
            </div>

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

                    <div className="tour-cards-container">
                        {filteredAndSortedTours.map(tour => (
                            <div key={tour.id} className="tour-card" data-id={tour.id}>
                                <img
                                    src={getImageUrl(tour.imageUrl)}
                                    alt={tour.name}
                                    onError={handleImageError}
                                />
                                <button
                                    className={`like-btn ${favorites.includes(tour.id) ? 'liked' : ''}`}
                                    onClick={(e) => toggleFavorite(e, tour.id)}
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