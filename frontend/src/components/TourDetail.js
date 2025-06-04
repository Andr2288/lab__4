import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getTourById, getReviewsForTour, addReview } from '../services/tourService';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import BookingForm from './BookingForm';

const TourDetail = ({ isAuth, openAuthModal }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tour, setTour] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingForm, setShowBookingForm] = useState(false);

    useEffect(() => {
        const fetchTourData = async () => {
            try {
                console.log('Отримуємо дані туру з ID:', id);

                const tourData = await getTourById(id);
                console.log('Отримані дані туру:', tourData);
                setTour(tourData);

                const reviewsData = await getReviewsForTour(id);
                console.log('Отримані відгуки:', reviewsData);
                setReviews(reviewsData);
            } catch (err) {
                console.error('Помилка при завантаженні даних:', err);
                setError('Не вдалося завантажити дані про тур. Спробуйте ще раз пізніше.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTourData();
        } else {
            setError('Не знайдено ID туру');
            setLoading(false);
        }
    }, [id]);

    // Виправлена функція для обробки шляхів до зображень
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            console.log('Зображення не вказано, використовуємо placeholder');
            return `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        }

        // Якщо це повний URL (починається з http/https)
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Логуємо оригінальний шлях
        console.log('Оригінальний шлях зображення:', imagePath);

        // Видаляємо початковий слеш якщо є
        let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

        // Формуємо повний шлях через process.env.PUBLIC_URL
        const fullPath = `${process.env.PUBLIC_URL}/${cleanPath}`;

        console.log('Сформований шлях до зображення:', fullPath);

        return fullPath;
    };

    // Функція для відображення зірочок для рейтингу
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

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

    const handleBookTour = () => {
        if (!isAuth) {
            alert('Будь ласка, увійдіть в систему для бронювання туру');
            if (openAuthModal) {
                openAuthModal();
            }
            return;
        }

        setShowBookingForm(true);
    };

    const handleAddReview = async (text, rating) => {
        if (!isAuth) {
            alert('Будь ласка, увійдіть в систему, щоб залишити відгук');
            if (openAuthModal) {
                openAuthModal();
            }
            return;
        }

        try {
            await addReview(
                id,
                auth.currentUser.uid,
                auth.currentUser.displayName || auth.currentUser.email,
                text,
                rating
            );

            const updatedReviews = await getReviewsForTour(id);
            setReviews(updatedReviews);

            const updatedTour = await getTourById(id);
            setTour(updatedTour);
        } catch (error) {
            console.error('Помилка при додаванні відгуку:', error);
            alert('Не вдалося додати відгук. Спробуйте ще раз пізніше.');
        }
    };

    const handleBookingSuccess = () => {
        setShowBookingForm(false);
    };

    // Обробник помилки завантаження зображення
    const handleImageError = (e) => {
        console.error('Помилка завантаження зображення:', e.target.src);

        // Якщо це не placeholder, спробуємо загрузити placeholder
        if (!e.target.src.includes('placeholder.jpg')) {
            console.log('Спробуємо завантажити placeholder');
            e.target.src = `${process.env.PUBLIC_URL}/photo/placeholder.jpg`;
        } else {
            // Якщо навіть placeholder не завантажується, показуємо стандартний fallback
            console.log('Placeholder також не завантажується, використовуємо fallback');
            e.target.style.display = 'none';

            // Створюємо div з текстом замість зображення
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'image-fallback';
            fallbackDiv.style.cssText = `
                width: 100%;
                height: 300px;
                background-color: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 18px;
                border-radius: 8px;
            `;
            fallbackDiv.textContent = 'Зображення недоступне';

            e.target.parentNode.insertBefore(fallbackDiv, e.target);
        }

        e.target.onerror = null; // Уникаємо безкінечного циклу
    };

    if (loading) {
        return <div className="loading">Завантаження...</div>;
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
                <button onClick={() => navigate('/')}>Повернутися на головну</button>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="error-message">
                Тур не знайдено.
                <button onClick={() => navigate('/')}>Повернутися на головну</button>
            </div>
        );
    }

    const imageUrl = getImageUrl(tour.imageUrl);
    console.log('Фінальний URL зображення:', imageUrl);

    return (
        <div className="tour-detail">
            <div className="tour-header">
                <h1>{tour.name}</h1>
                <div className="tour-location">📍 {tour.location}</div>
            </div>

            <div className="tour-gallery">
                <img
                    src={imageUrl}
                    alt={tour.name}
                    className="tour-main-image"
                    onError={handleImageError}
                    onLoad={() => console.log('Зображення успішно завантажено:', imageUrl)}
                />
                {tour.additionalImages && tour.additionalImages.length > 0 && (
                    <div className="additional-images">
                        {tour.additionalImages.map((img, index) => (
                            <img
                                key={index}
                                src={getImageUrl(img)}
                                alt={`${tour.name} ${index + 1}`}
                                onError={handleImageError}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="tour-info">
                <div className="tour-description">
                    <h2>Опис туру</h2>
                    <p>{tour.description}</p>

                    {tour.includes && tour.includes.length > 0 && (
                        <>
                            <h3>Що включено:</h3>
                            <ul className="tour-includes">
                                {tour.includes.map((item, index) => (
                                    <li key={index}>✓ {item}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {tour.program && tour.program.length > 0 && (
                        <>
                            <h3>Програма туру:</h3>
                            <div className="tour-program">
                                {tour.program.map((day, index) => (
                                    <div key={index} className="program-day">
                                        <h4>День {index + 1}</h4>
                                        <p>{day}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="tour-sidebar">
                    <div className="tour-booking">
                        <div className="price-box">
                            <p className="price-label">Ціна:</p>
                            <p className="price-value">{tour.price} грн</p>
                        </div>

                        <div className="tour-details-list">
                            <div className="detail-item">
                                <span className="detail-label">Тривалість:</span>
                                <span className="detail-value">{tour.duration || '7 днів'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Рейтинг:</span>
                                <span className="detail-value">
                                    <div className="stars-container">
                                        {renderStars(tour.rating || 0)}
                                    </div>
                                    {tour.rating ? tour.rating.toFixed(1) : '0'}/5
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Група:</span>
                                <span className="detail-value">{tour.groupSize || '10-15'} осіб</span>
                            </div>
                        </div>

                        {isAuth ? (
                            <button onClick={handleBookTour} className="btn-book-now">
                                Забронювати зараз
                            </button>
                        ) : (
                            <button
                                className="btn-disabled"
                                onClick={openAuthModal}
                                title="Увійдіть для бронювання"
                            >
                                Увійдіть для бронювання
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showBookingForm && isAuth && (
                <div className="booking-section">
                    <BookingForm
                        tour={tour}
                        userId={auth.currentUser.uid}
                        onSuccess={handleBookingSuccess}
                    />
                </div>
            )}

            <div className="tour-reviews">
                <h2>Відгуки про тур</h2>

                {isAuth ? (
                    <ReviewForm addReview={handleAddReview} />
                ) : (
                    <p className="login-prompt">
                        <button
                            className="btn-login"
                            onClick={openAuthModal}
                        >
                            Увійдіть
                        </button> щоб залишити відгук
                    </p>
                )}

                <ReviewList reviews={reviews} />
            </div>
        </div>
    );
};

export default TourDetail;