import React, { useState } from "react";

const ReviewForm = ({ addReview }) => {
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (reviewText.trim() === "") {
            alert("Будь ласка, напишіть відгук");
            return;
        }

        addReview(reviewText, rating);
        setReviewText("");
        setRating(5);
    };

    return (
        <div className="review-form">
            <h3>Залишити відгук</h3>

            <form onSubmit={handleSubmit}>
                <div className="star-rating">
                    {[...Array(5)].map((star, index) => {
                        const ratingValue = index + 1;

                        return (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name="rating"
                                    value={ratingValue}
                                    onClick={() => setRating(ratingValue)}
                                />
                                <span
                                    className={`star ${ratingValue <= (hover || rating) ? "filled" : "empty"}`}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                >
                  ★
                </span>
                            </label>
                        );
                    })}
                    <span className="rating-text">{rating}/5</span>
                </div>

                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Напишіть ваш відгук про тур..."
                    rows="4"
                    required
                />

                <button type="submit" className="btn-submit-review">
                    Опублікувати відгук
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;