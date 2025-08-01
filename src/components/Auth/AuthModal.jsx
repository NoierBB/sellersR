import { useState, useEffect } from 'react';
import axios from 'axios';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [verificationData, setVerificationData] = useState({
    code: '',
    telegramBot: '',
    generatedCode: '' // Код, полученный от бекенда
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Сбрасываем состояние при открытии/закрытии модалки
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: ''
      });
      setVerificationData({
        code: '',
        telegramBot: '',
        generatedCode: ''
      });
      setErrors({});
      setSuccessMessage('');
      setShowVerification(false);
      setActiveTab('login');
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибки при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleVerificationChange = (e) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен';
    } else if (activeTab === 'register' && formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (activeTab === 'register') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Имя обязательно';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Фамилия обязательна';
      }
      if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Некорректный формат телефона';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = activeTab === 'login' 
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber
          };
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.success) {
        if (activeTab === 'register') {
          // Регистрация успешна, показываем форму верификации
          setVerificationData(prev => ({
            ...prev,
            telegramBot: response.data.telegramBot || '@SellersWilberis_bot',
            generatedCode: response.data.verificationCode || ''
          }));
          setSuccessMessage(
            response.data.verificationCode 
              ? `Код верификации: ${response.data.verificationCode}` 
              : 'Регистрация успешна! Код верификации отправлен в Telegram.'
          );
          setShowVerification(true);
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify({
            ...response.data.user,
            _savedPassword: formData.password
          }));
        } else {
          // Вход успешен
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify({
            ...response.data.user,
            _savedPassword: formData.password
          }));
          
          // Проверяем, нужна ли верификация
          if (response.data.user && !response.data.user.verified && !response.data.user.isVerified) {
            // Пользователь не верифицирован, показываем форму верификации
            setVerificationData(prev => ({
              ...prev,
              telegramBot: response.data.telegramBot || '@SellersWilberis_bot',
              generatedCode: response.data.verificationCode || ''
            }));
            setSuccessMessage('Вход выполнен! Для полного доступа требуется верификация.');
            setShowVerification(true);
          } else {
            // Пользователь уже верифицирован
            setSuccessMessage('Вход выполнен успешно!');
            
            // Закрываем модалку и вызываем колбек успеха
            setTimeout(() => {
              onClose();
              if (onSuccess) onSuccess(response.data);
            }, 1000);
          }
        }
      } else {
        setErrors({ general: response.data.message || 'Произошла ошибка' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.message || 'Произошла ошибка при обработке запроса';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationData.code.trim()) {
      setErrors({ code: 'Введите код верификации' });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await axios.post('/api/auth/verify', {
        verificationCode: verificationData.code
      });
      
      if (response.data.success) {
        setSuccessMessage('Верификация прошла успешно! Добро пожаловать в SellLab!');
        
        // Закрываем модалку и вызываем колбек успеха
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(response.data);
          window.location.reload(); // Обновляем страницу для применения изменений
        }, 1500);
      } else {
        setErrors({ code: response.data.message || 'Неверный код верификации' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка верификации';
      setErrors({ code: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyCodeToClipboard = async () => {
    if (verificationData.generatedCode) {
      try {
        await navigator.clipboard.writeText(verificationData.generatedCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = verificationData.generatedCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <div className="auth-modal-logo">
            <img 
              src="/src/assets/logos/selllab-logo.svg" 
              alt="SellLab" 
              className="modal-logo-image"
            />
          </div>
          <button 
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="auth-modal-content">
          {!showVerification ? (
            <>
              {/* Табы */}
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  <span className="tab-icon">🔑</span>
                  Вход
                </button>
                <button
                  className={`auth-tab ${activeTab === 'register' ? 'auth-tab-active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  <span className="tab-icon">👤</span>
                  Регистрация
                </button>
              </div>

              {/* Заголовок */}
              <div className="auth-header">
                <h2 className="auth-title">
                  {activeTab === 'login' ? 'Добро пожаловать!' : 'Создать аккаунт'}
                </h2>
                <p className="auth-subtitle">
                  {activeTab === 'login' 
                    ? 'Войдите в свой аккаунт для доступа к аналитике' 
                    : 'Присоединяйтесь к тысячам успешных продавцов'
                  }
                </p>
              </div>

              {/* Форма */}
              <form onSubmit={handleSubmit} className="auth-form">
                {activeTab === 'register' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="firstName">
                        Имя *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                        placeholder="Введите ваше имя"
                        disabled={loading}
                      />
                      {errors.firstName && (
                        <div className="form-error">{errors.firstName}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="lastName">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                        placeholder="Введите вашу фамилию"
                        disabled={loading}
                      />
                      {errors.lastName && (
                        <div className="form-error">{errors.lastName}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Пароль *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    placeholder={activeTab === 'register' ? 'Минимум 6 символов' : 'Введите пароль'}
                    disabled={loading}
                  />
                  {errors.password && (
                    <div className="form-error">{errors.password}</div>
                  )}
                </div>

                {activeTab === 'register' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="phoneNumber">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
                      placeholder="+7 (999) 123-45-67"
                      disabled={loading}
                    />
                    {errors.phoneNumber && (
                      <div className="form-error">{errors.phoneNumber}</div>
                    )}
                  </div>
                )}

                {errors.general && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {errors.general}
                  </div>
                )}

                {successMessage && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      {activeTab === 'login' ? 'Вход...' : 'Регистрация...'}
                    </>
                  ) : (
                    <>
                      <span>{activeTab === 'login' ? '🔑' : '🚀'}</span>
                      {activeTab === 'login' ? 'Войти' : 'Создать аккаунт'}
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Форма верификации */
            <div className="verification-form">
              <div className="verification-header">
                <div className="verification-icon">📱</div>
                <h2 className="verification-title">Подтверждение регистрации</h2>
                <p className="verification-subtitle">
                  {verificationData.generatedCode 
                    ? 'Код верификации сгенерирован и отправлен в Telegram бот' 
                    : 'Мы отправили код верификации в Telegram бот'
                  }
                </p>
              </div>

              <div className="telegram-info">
                <div className="telegram-card">
                  <div className="telegram-bot-info">
                    <span className="telegram-icon">🤖</span>
                    <div className="bot-details">
                      <div className="bot-name">{verificationData.telegramBot}</div>
                      <div className="bot-description">SellLab Verification Bot</div>
                    </div>
                  </div>
                  
                  {verificationData.generatedCode && (
                    <div className="verification-code-display">
                      <div className="code-label">Ваш код верификации:</div>
                      <div className="code-container">
                        <div className="code-value">{verificationData.generatedCode}</div>
                        <button 
                          className="copy-code-btn"
                          onClick={copyCodeToClipboard}
                          title="Копировать код"
                        >
                          {codeCopied ? '✅' : '📋'}
                        </button>
                      </div>
                      <div className="code-note">
                        {codeCopied ? 'Код скопирован!' : 'Этот код также отправлен в Telegram бот'}
                      </div>
                    </div>
                  )}
                  
                  <div className="telegram-instructions">
                    <ol>
                      <li>Скопируйте код верификации выше</li>
                      <li>Найдите бота <strong>{verificationData.telegramBot}</strong> в Telegram и нажмите <strong>/start</strong></li>
                      <li>Вставьте скопированный код в поле ниже для подтверждения</li>
                    </ol>
                    <div className="instruction-note">
                      <strong>Важно:</strong> Код генерируется на нашем сайте. Просто введите его в поле ниже для верификации.
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerification} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="code">
                    Код верификации *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={verificationData.code}
                    onChange={handleVerificationChange}
                    className={`form-input verification-input ${errors.code ? 'form-input-error' : ''}`}
                    placeholder="Введите код из Telegram"
                    disabled={loading}
                    maxLength="6"
                  />
                  {errors.code && (
                    <div className="form-error">{errors.code}</div>
                  )}
                </div>

                {successMessage && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    {successMessage}
                  </div>
                )}

                <div className="verification-actions">
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Проверка...
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Подтвердить
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setShowVerification(false)}
                    disabled={loading}
                  >
                    ← Назад к регистрации
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="auth-modal-footer">
          <p className="footer-text">
            {activeTab === 'login' 
              ? 'Нет аккаунта? ' 
              : 'Уже есть аккаунт? '
            }
            <button 
              className="footer-link"
              onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
              disabled={loading || showVerification}
            >
              {activeTab === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;