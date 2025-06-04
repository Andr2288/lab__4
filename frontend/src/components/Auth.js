import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  // signOut - видалили невикористану імпорт
} from "firebase/auth";

const Auth = ({ setIsAuth, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Функція для очищення форми
  const clearForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  // Функція для успішного завершення автентифікації
  const handleSuccess = () => {
    clearForm();
    setIsAuth(true);
    if (onSuccess) {
      onSuccess();
    }
  };

  // Функція для реєстрації
  const signUp = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Будь ласка, заповніть всі поля");
      return;
    }

    if (password.length < 6) {
      setError("Пароль повинен містити щонайменше 6 символів");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      handleSuccess();
    } catch (err) {
      console.error("Помилка реєстрації:", err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("Цей email вже використовується");
          break;
        case 'auth/invalid-email':
          setError("Невірний формат email");
          break;
        case 'auth/weak-password':
          setError("Пароль занадто слабкий");
          break;
        default:
          setError("Помилка реєстрації. Спробуйте ще раз");
      }
    } finally {
      setLoading(false);
    }
  };

  // Функція для входу
  const signIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Будь ласка, заповніть всі поля");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleSuccess();
    } catch (err) {
      console.error("Помилка входу:", err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError("Користувача з таким email не знайдено");
          break;
        case 'auth/wrong-password':
          setError("Невірний пароль");
          break;
        case 'auth/invalid-email':
          setError("Невірний формат email");
          break;
        case 'auth/too-many-requests':
          setError("Забагато спроб входу. Спробуйте пізніше");
          break;
        default:
          setError("Помилка входу. Перевірте дані та спробуйте ще раз");
      }
    } finally {
      setLoading(false);
    }
  };

  // Функція для входу через Google
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      handleSuccess();
    } catch (err) {
      console.error("Помилка входу через Google:", err);
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          setError("Вхід скасовано користувачем");
          break;
        case 'auth/popup-blocked':
          setError("Спливаюче вікно заблоковано браузером");
          break;
        default:
          setError("Помилка входу через Google");
      }
    } finally {
      setLoading(false);
    }
  };

  // Переключення між входом та реєстрацією
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
      <div className="auth-container">
        <h2>{isLogin ? "Вхід" : "Реєстрація"}</h2>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={isLogin ? signIn : signUp}>
          <div className="form-group">
            <label>Email:</label>
            <input
                type="email"
                placeholder="Введіть email..."
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                disabled={loading}
                required
            />
          </div>

          <div className="form-group">
            <label>Пароль:</label>
            <input
                type="password"
                placeholder="Введіть пароль..."
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                disabled={loading}
                required
                minLength={6}
            />
          </div>

          <div className="auth-buttons">
            <button
                type="submit"
                className="btn-primary"
                disabled={loading}
            >
              {loading ? "Завантаження..." : (isLogin ? "Увійти" : "Зареєструватися")}
            </button>

            <button
                type="button"
                onClick={signInWithGoogle}
                className="btn-google"
                disabled={loading}
            >
              {loading ? "Завантаження..." : "Увійти через Google"}
            </button>

            <p className="switch-auth">
              {isLogin ? "Немає акаунту? " : "Вже є акаунт? "}
              <span onClick={toggleMode} style={{ cursor: 'pointer' }}>
              {isLogin ? "Зареєструватися" : "Увійти"}
            </span>
            </p>
          </div>
        </form>
      </div>
  );
};

export default Auth;