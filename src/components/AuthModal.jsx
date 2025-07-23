import { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faPhone } from '@fortawesome/free-solid-svg-icons';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [needVerification, setNeedVerification] = useState(false);
  const [token, setToken] = useState('');

  const API_BASE_URL = 'http://localhost:8080/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVerificationChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          setSuccess('Авторизация успешна!');
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1000);
        }
      } else {
        // Register logic
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        });

        if (response.data.success) {
          setSuccess('Регистрация успешна! Пожалуйста, введите код верификации.');
          setNeedVerification(true);
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify`,
        { verificationCode },
        { headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        setSuccess('Верификация прошла успешно!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Неверный код верификации.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        {!needVerification ? (
          <>
            <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">
                  <FontAwesomeIcon icon={faEnvelope} />
                  Email
                </label>
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
                <label htmlFor="password">
                  <FontAwesomeIcon icon={faLock} />
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="firstName">
                      <FontAwesomeIcon icon={faUser} />
                      Имя
                    </label>
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
                    <label htmlFor="lastName">
                      <FontAwesomeIcon icon={faUser} />
                      Фамилия
                    </label>
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
                    <label htmlFor="phoneNumber">
                      <FontAwesomeIcon icon={faPhone} />
                      Телефон
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>
            
            <div className="auth-switch">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Верификация</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <p>Введите код верификации, отправленный на ваш email или в Telegram бот @SellersWilberis_bot</p>
            
            <form onSubmit={handleVerification}>
              <div className="form-group">
                <label htmlFor="verificationCode">Код верификации</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={handleVerificationChange}
                  required
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}