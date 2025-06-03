import React, { useState } from 'react';
import { bookTour } from '../services/tourService';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ tour, userId, onSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        travelers: 1,
        startDate: '',
        endDate: '',
        payment: 'card',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value, 10) : value
        });
    };

    const calculateTotalPrice = () => {
        // Базова ціна туру помножена на кількість осіб
        return tour.price * formData.travelers;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Розраховуємо загальну вартість
            const totalPrice = calculateTotalPrice();

            // Додаємо дані бронювання
            const bookingData = {
                ...formData,
                tourName: tour.name,
                totalPrice
            };

            // Зберігаємо бронювання
            const bookingId = await bookTour(tour.id, userId, bookingData);

            // Показуємо повідомлення про успіх
            alert(`Тур "${tour.name}" успішно заброньовано!`);

            // Викликаємо функцію зворотного виклику
            if (onSuccess) {
                onSuccess(bookingId);
            }

            // Перенаправляємо на сторінку "Мої бронювання"
            navigate('/my-bookings');
        } catch (error) {
            console.error('Помилка при бронюванні:', error);
            setError('Сталася помилка при бронюванні. Спробуйте ще раз.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form id="booking-form" onSubmit={handleSubmit}>
            <h3>Бронювання туру</h3>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="firstName">Ім'я:</label>
                <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="lastName">Прізвище:</label>
                <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Електронна пошта:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="phone">Номер телефону:</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="travelers">Кількість осіб:</label>
                <input
                    type="number"
                    id="travelers"
                    name="travelers"
                    min="1"
                    max="10"
                    value={formData.travelers}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="startDate">Дата початку:</label>
                <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="endDate">Дата завершення:</label>
                <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Спосіб оплати:</label>
                <div className="payment-options">
                    <input
                        type="radio"
                        id="card"
                        name="payment"
                        value="card"
                        checked={formData.payment === 'card'}
                        onChange={handleChange}
                        required
                    />
                    <label htmlFor="card">Банківська карта</label>

                    <input
                        type="radio"
                        id="cash"
                        name="payment"
                        value="cash"
                        checked={formData.payment === 'cash'}
                        onChange={handleChange}
                    />
                    <label htmlFor="cash">Готівка</label>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="tour-name">Назва туру:</label>
                <input
                    type="text"
                    id="tour-name"
                    name="tour-name"
                    value={tour.name}
                    readOnly
                />
            </div>

            <div className="form-group">
                <label htmlFor="tour-price">Вартість (за особу):</label>
                <input
                    type="text"
                    id="tour-price"
                    name="tour-price"
                    value={`${tour.price} грн`}
                    readOnly
                />
            </div>

            <div className="form-group">
                <label htmlFor="total-price">Загальна вартість:</label>
                <input
                    type="text"
                    id="total-price"
                    name="total-price"
                    value={`${calculateTotalPrice()} грн`}
                    readOnly
                />
            </div>

            <div className="form-group">
                <label htmlFor="notes">Додаткові побажання:</label>
                <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                ></textarea>
            </div>

            <button
                type="submit"
                className="btn-book-now"
                disabled={submitting}
            >
                {submitting ? 'Оформлення...' : 'Підтвердити бронювання'}
            </button>
        </form>
    );
};

export default BookingForm;