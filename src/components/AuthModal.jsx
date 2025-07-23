import { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faPhone, faCopy } from '@fortawesome/free-solid-svg-icons';

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
  const [needVerification, setNeedVerification] = useState(false);
  const [token, setToken] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [displayVerificationCode, setDisplayVerificationCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const API_BASE_URL = 'http://localhost:8080/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

        console.log('Login response:', response.data);

        if (response.data.success) {
          setSuccess('Авторизация успешна!');
          // Сохраняем токен с префиксом Bearer
          const authToken = response.data.token;
          localStorage.setItem('token', authToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUserEmail(formData.email);
          
          // Проверяем, требуется ли верификация
          if (response.data.user && !response.data.user.verified) {
            setNeedVerification(true);
            setToken(authToken);
            if (response.data.telegramBot) {
              setTelegramBot(response.data.telegramBot);
            }
            if (response.data.verificationCode) {
              setDisplayVerificationCode(response.data.verificationCode);
            }
          } else {
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 1000);
          }
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

        console.log('Register response:', response.data);

        if (response.data.success) {
          setSuccess('Регистрация успешна! Пожалуйста, скопируйте код верификации и отправьте его в Telegram бот.');
          setNeedVerification(true);
          // Сохраняем токен с префиксом Bearer
          const authToken = response.data.token;
          setToken(authToken);
          localStorage.setItem('token', authToken);
          setUserEmail(formData.email);
          
          // Сохраняем информацию о телеграм боте
          if (response.data.telegramBot) {
            setTelegramBot(response.data.telegramBot);
          }
          
          // Показываем верификационный код
          if (response.data.verificationCode) {
            console.log('Verification code:', response.data.verificationCode);
            setDisplayVerificationCode(response.data.verificationCode);
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (verificationInProgress) return;
    
    setVerificationInProgress(true);
    setError('');
    
    try {
      // Повторно выполняем вход с теми же учетными данными
      // для получения обновленной информации о пользователе
      const email = userEmail || JSON.parse(localStorage.getItem('user'))?.email;
      
      if (!email) {
        setError('Не удалось определить email пользователя');
        setVerificationInProgress(false);
        return;
      }
      
      console.log('Checking verification status for user:', email);
      
      // Используем повторный вход для проверки статуса верификации
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: formData.password || '___dummy___' // Если пароль не сохранен, используем заглушку
      });
      
      console.log('Verification status response:', response.data);
      
      // Проверяем, верифицирован ли пользователь
      if (response.data.success && response.data.user && response.data.user.verified) {
        setSuccess('Верификация прошла успешно!');
        // Обновляем данные пользователя в localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setError('Верификация еще не завершена. Пожалуйста, отправьте код в Telegram бот.');
      }
    } catch (err) {
      console.error('Verification status check error:', err);
      
      // Проверяем, содержит ли ошибка информацию о неверном пароле
      if (err.response?.data?.message?.includes('password')) {
        // Если ошибка связана с паролем, это значит, что пользователь существует,
        // но мы не можем авторизоваться из-за отсутствия пароля
        setError('Для проверки статуса верификации введите пароль');
        
        // Добавляем поле для ввода пароля
        setShowPasswordInput(true);
      } else {
        setError('Ошибка при проверке статуса верификации. Попробуйте позже.');
      }
    } finally {
      setVerificationInProgress(false);
    }
  };

  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');

  const handleVerificationWithPassword = async () => {
    if (verificationInProgress || !verificationPassword) return;
    
    setVerificationInProgress(true);
    setError('');
    
    try {
      const email = userEmail || JSON.parse(localStorage.getItem('user'))?.email;
      
      if (!email) {
        setError('Не удалось определить email пользователя');
        setVerificationInProgress(false);
        return;
      }
      
      // Используем введенный пароль для проверки статуса верификации
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: verificationPassword
      });
      
      console.log('Verification with password response:', response.data);
      
      if (response.data.success && response.data.user && response.data.user.verified) {
        setSuccess('Верификация прошла успешно!');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setError('Верификация еще не завершена. Пожалуйста, отправьте код в Telegram бот.');
      }
    } catch (err) {
      console.error('Verification with password error:', err);
      setError(err.response?.data?.message || 'Ошибка при проверке статуса верификации.');
    } finally {
      setVerificationInProgress(false);
    }
  };

  const copyToClipboard = () => {
    if (displayVerificationCode) {
      navigator.clipboard.writeText(displayVerificationCode)
        .then(() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        })
        .catch(err => console.error('Ошибка копирования:', err));
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
            
            <p>Для верификации аккаунта отправьте код в Telegram бот {telegramBot}</p>
            
            {displayVerificationCode && (
              <div className="verification-code-display">
                <div className="code-container">
                  <span className="code-label">Ваш код верификации:</span>
                  <div className="code-value">
                    <span>{displayVerificationCode}</span>
                    <button 
                      className="copy-btn" 
                      onClick={copyToClipboard}
                      title="Копировать код"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
                  </div>
                  {codeCopied && <span className="copy-success">Скопировано!</span>}
                </div>
                <p className="code-instruction">
                  Скопируйте этот код и отправьте его боту {telegramBot} в Telegram для верификации
                </p>
              </div>
            )}
            
            {showPasswordInput ? (
              <div className="verification-password-form">
                <div className="form-group">
                  <label htmlFor="verificationPassword">
                    <FontAwesomeIcon icon={faLock} />
                    Введите пароль для проверки
                  </label>
                  <input
                    type="password"
                    id="verificationPassword"
                    value={verificationPassword}
                    onChange={(e) => setVerificationPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  className="check-verification-btn" 
                  onClick={handleVerificationWithPassword}
                  disabled={verificationInProgress || !verificationPassword}
                >
                  {verificationInProgress ? 'Проверка...' : 'Проверить статус'}
                </button>
              </div>
            ) : (
              <div className="verification-actions">
                <button 
                  className="check-verification-btn" 
                  onClick={checkVerificationStatus}
                  disabled={verificationInProgress}
                >
                  {verificationInProgress ? 'Проверка...' : 'Проверить статус верификации'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}