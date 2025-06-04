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
                // Додаємо логування для відстеження проблеми
                console.log('Отримуємо дані туру з ID:', id);

                // Отримуємо дані про тур
                const tourData = await getTourById(id);
                console.log('Отримані дані туру:', tourData);
                setTour(tourData);

                // Отримуємо відгуки
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

    // Функція для виправлення шляхів до зображень
    const fixImagePath = (imagePath) => {
        if (!imagePath) return 'photo/placeholder.jpg'; // Шлях до зображення-заглушки

        // Якщо шлях починається з http або https, то це повний URL
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Якщо шлях починається з "/", прибираємо його
        if (imagePath.startsWith('/')) {
            return imagePath.substring(1);
        }

        // Інакше повертаємо як є
        return imagePath;
    };

    // Функція для відображення зірочок для рейтингу
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

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
            // Додаємо відгук
            await addReview(
                id,
                auth.currentUser.uid,
                auth.currentUser.displayName || auth.currentUser.email,
                text,
                rating
            );

            // Оновлюємо список відгуків
            const updatedReviews = await getReviewsForTour(id);
            setReviews(updatedReviews);

            // Оновлюємо дані про тур, щоб відобразити оновлений рейтинг
            const updatedTour = await getTourById(id);
            setTour(updatedTour);
        } catch (error) {
            console.error('Помилка при додаванні відгуку:', error);
            alert('Не вдалося додати відгук. Спробуйте ще раз пізніше.');
        }
    };

    // Обробник успішного бронювання
    const handleBookingSuccess = () => {
        setShowBookingForm(false);
    };

    if (loading) {
        return <div className="loading">Завантаження...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!tour) {
        return <div className="error-message">Тур не знайдено. <button onClick={() => navigate('/')}>Повернутися на головну</button></div>;
    }

    // Додаємо логування для перевірки шляху зображення
    console.log('Оригінальний шлях зображення:', tour.imageUrl);
    console.log('Виправлений шлях зображення:', fixImagePath(tour.imageUrl));

    return (
        <div className="tour-detail">
            <div className="tour-header">
                <h1>{tour.name}</h1>
                <div className="tour-location">📍 {tour.location}</div>
            </div>

            <div className="tour-gallery">
                {/* Виправляємо шлях до головного зображення */}
                <img
                    src={fixImagePath(tour.imageUrl)}
                    alt={tour.name}
                    className="tour-main-image"
                    onError={(e) => {
                        console.error('Помилка завантаження зображення:', e);
                        e.target.src = 'photo/placeholder.jpg'; // Запасне зображення
                        e.target.onerror = null; // Уникаємо безкінечного циклу
                    }}
                />
                {tour.additionalImages && tour.additionalImages.length > 0 && (
                    <div className="additional-images">
                        {tour.additionalImages.map((img, index) => (
                            <img
                                key={index}
                                src={fixImagePath(img)}
                                alt={`${tour.name} ${index + 1}`}
                                onError={(e) => {
                                    e.target.src = 'photo/placeholder.jpg';
                                    e.target.onerror = null;
                                }}
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

            {/* Відображаємо форму бронювання, якщо showBookingForm=true */}
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