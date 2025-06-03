import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserBookings } from '../services/tourService';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

const MyBookings = ({ isAuth, user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!isAuth || !user) return;

            try {
                const userBookings = await getUserBookings(user.uid);
                setBookings(userBookings);
            } catch (error) {
                console.error("Помилка при завантаженні бронювань:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [isAuth, user]);

    // Форматування дати
    const formatDate = (timestamp) => {
        if (!timestamp) return "";

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

    // Якщо користувач не автентифікований, перенаправляємо на головну
    if (!isAuth) {
        return <Navigate to="/" />;
    }

    if (loading) {
        return <div className="loading">Завантаження бронювань...</div>;
    }

    return (
        <section id="my-bookings">
            <h2>Мої бронювання</h2>

            {bookings.length === 0 ? (
                <div className="no-bookings">
                    <p>У вас ще немає бронювань.</p>
                    <p>Перегляньте наші тури та оберіть свою наступну подорож!</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-image">
                                <img
                                    src={booking.tour.imageUrl}
                                    alt={booking.tour.name}
                                />
                                <div className="booking-status" data-status={booking.status}>
                                    {booking.status === 'pending' && 'Очікує підтвердження'}
                                    {booking.status === 'confirmed' && 'Підтверджено'}
                                    {booking.status === 'completed' && 'Завершено'}
                                    {booking.status === 'cancelled' && 'Скасовано'}
                                </div>
                            </div>

                            <div className="booking-details">
                                <h3>{booking.tour.name}</h3>
                                <p className="booking-info">
                  <span className="booking-date">
                    <strong>Дата бронювання:</strong> {formatDate(booking.createdAt)}
                  </span>
                                    <span className="booking-travelers">
                    <strong>Кількість осіб:</strong> {booking.travelers}
                  </span>
                                </p>

                                <p className="booking-trip-date">
                                    <strong>Дати поїздки:</strong> {booking.startDate} - {booking.endDate}
                                </p>

                                <p className="booking-price">
                                    <strong>Загальна сума:</strong> {booking.totalPrice} грн
                                </p>

                                {booking.notes && (
                                    <p className="booking-notes">
                                        <strong>Примітки:</strong> {booking.notes}
                                    </p>
                                )}

                                <div className="booking-actions">
                                    {booking.status === 'pending' && (
                                        <button className="btn-cancel">Скасувати</button>
                                    )}
                                    <button className="btn-details">Деталі туру</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default MyBookings;