import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";

// Імпортуємо компоненти
import Auth from "./components/Auth";
import TourList from "./components/TourList";
import TourDetail from "./components/TourDetail";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MyBookings from "./components/MyBookings";
import Favorites from "./components/Favorites";
// Замінюємо старий MapView на новий
import MapView from "./components/UpdatedMapView";

// Імпортуємо стилі
import "./App.css";
import "./components/MapStyles.css";

function App() {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Ref для модального вікна
  const authModalRef = useRef(null);

  useEffect(() => {
    // Відстежуємо стан автентифікації
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuth(currentUser !== null);
      setLoading(false);
    });

    // Очищуємо підписку при розмонтуванні компонента
    return () => unsubscribe();
  }, []);

  // Функція для відкриття модального вікна
  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  // Функція для закриття модального вікна
  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Поки завантажується, показуємо просту заглушку
  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
      <Router>
        <div className="App">
          <header>
            <h1 id="greeting">Вітаємо у світі подорожей!</h1>
            <Navbar isAuth={isAuth} />

            <div className="profile-icon-container">
              {isAuth ? (
                  <img
                      src={user.photoURL || "photo/profile.jpg"}
                      alt="Профіль"
                      className="profile-icon"
                      id="profile-icon"
                      title={user.displayName || user.email}
                      onError={(e) => {
                        console.error('Помилка завантаження зображення профілю:', e);
                        e.target.src = 'photo/placeholder.jpg';
                        e.target.onerror = null;
                      }}
                  />
              ) : (
                  <img
                      src="photo/profile.jpg"
                      alt="Профіль"
                      className="profile-icon"
                      id="profile-icon"
                      onClick={openAuthModal}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        console.error('Помилка завантаження зображення профілю:', e);
                        e.target.src = 'photo/placeholder.jpg';
                        e.target.onerror = null;
                      }}
                  />
              )}
            </div>
          </header>

          <main>
            <Routes>
              <Route
                  path="/"
                  element={
                    <TourList
                        isAuth={isAuth}
                        currentUser={user}
                        openAuthModal={openAuthModal}
                    />
                  }
              />
              <Route
                  path="/tour/:id"
                  element={
                    <TourDetail
                        isAuth={isAuth}
                        openAuthModal={openAuthModal}
                    />
                  }
              />
              <Route
                  path="/my-bookings"
                  element={<MyBookings isAuth={isAuth} user={user} />}
              />
              <Route
                  path="/favorites"
                  element={<Favorites isAuth={isAuth} user={user} />}
              />
              <Route path="/map" element={<MapView />} />
            </Routes>
          </main>

          {/* Модальне вікно для автентифікації */}
          {showAuthModal && (
              <div className="modal" style={{ display: 'block' }} id="auth-modal">
                <div className="modal-content" ref={authModalRef}>
                  <span
                      className="close"
                      onClick={closeAuthModal}
                  >
                    &times;
                  </span>
                  <Auth setIsAuth={setIsAuth} onSuccess={closeAuthModal} />
                </div>
              </div>
          )}

          <Footer />
        </div>
      </Router>
  );
}

export default App;