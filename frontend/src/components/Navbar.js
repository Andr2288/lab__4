import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Navbar = ({ isAuth }) => {
    // Функція для виходу з системи
    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert('Ви успішно вийшли з системи');
        } catch (error) {
            console.error('Помилка при виході з системи:', error);
        }
    };

    return (
        <nav>
            <ul>
                <li><Link to="/">Гарячі тури</Link></li>
                {isAuth && <li><Link to="/my-bookings">Мої бронювання</Link></li>}
                <li><Link to="/favorites">Улюблені тури</Link></li>
                <li><Link to="/map">Мапа</Link></li>
                {isAuth && (
                    <li>
                        <a href="#" onClick={handleLogout}>Вийти</a>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;