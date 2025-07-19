import { useState } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '', // Изменили на first_name
    last_name: '',  // Изменили на last_name
    phoneNumber: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Валидация данных
      if (!isLogin) {
        if (!formData.first_name.trim()) throw new Error('Имя обязательно для заполнения');
        if (!formData.last_name.trim()) throw new Error('Фамилия обязательна для заполнения');
        if (formData.password !== formData.confirmPassword) throw new Error('Пароли не совпадают');
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? {
            email: formData.email,
            password: formData.password,
            rememberMe: formData.rememberMe
          }
        : {
            email: formData.email,
            password: formData.password,
            firstName: formData.first_name.trim(), // Использовать firstName
            lastName: formData.last_name.trim(),  // Использовать lastName
            phone_number: formData.phoneNumber.trim()
          };
      console.log(formData.first_name.trim());
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log(body);

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.message || data.detail || `Ошибка ${isLogin ? 'входа' : 'регистрации'}`);
      }

      if (isLogin) {
        localStorage.setItem('authToken', data.token);
        onClose();
      } else {
        alert('Регистрация успешна!');
        setIsLogin(true);
        setFormData(prev => ({ ...prev, firstName: '', last_name: '', phoneNumber: '' }));
      }
    } catch (err) {
      setError(err.message);
      console.error('Ошибка:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <form onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Вход в аккаунт' : 'Регистрация'}</h2>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="first_name">Имя*</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Фамилия*</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}



          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="phoneNumber">Номер телефона</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                pattern="\+?[0-9\s\-\(\)]+"
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">
              {isLogin ? 'Пароль*' : 'Придумайте пароль*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Повторите пароль*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          )}

          {isLogin && (
            <div className="form-options">
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                Запомнить меня
              </label>
              <a href="#" className="forgot-password">
                Забыли пароль?
              </a>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          ) : (
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Уже есть аккаунт? Войти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}