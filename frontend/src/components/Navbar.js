import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Navbar = ({ isAuth }) => {
    // Функція для виходу з системи
    const handleLogout = async (e) => {
        e.preventDefault(); // Запобігаємо переходу по href
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
                        {/* Замінили a на button для правильної семантики */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '18px',
                                padding: '10px 15px',
                                backgroundColor: '#223440',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s ease-in-out'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#344652'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#223440'}
                        >
                            Вийти
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;