import React from "react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

const ReviewList = ({ reviews }) => {
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

    // Форматування дати
    const formatDate = (timestamp) => {
        if (!timestamp) return "недавно";

        // Для серверного timestamp
        if (timestamp.toDate) {
            return formatDistanceToNow(timestamp.toDate(), {
                addSuffix: true,
                locale: uk
            });
        }

        // Для звичайної дати
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: uk
        });
    };

    return (
        <div className="reviews-list">
            {reviews.length === 0 ? (
                <p className="no-reviews">Ще немає відгуків для цього туру.</p>
            ) : (
                reviews.map((review) => (
                    <div key={review.id} className="review-item">
                        <div className="review-header">
                            <div className="review-author">{review.userName}</div>
                            <div className="review-date">{formatDate(review.createdAt)}</div>
                        </div>

                        <div className="review-rating">
                            {renderStars(review.rating)}
                            <span className="rating-value">({review.rating})</span>
                        </div>

                        <div className="review-text">{review.text}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ReviewList;