import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faSpinner, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const API_BASE_URL = 'http://localhost:8080/api';

  useEffect(() => {
    // Проверяем наличие токена
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Для доступа к профилю необходимо авторизоваться');
      setLoading(false);
      return;
    }

    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          firstName: parsedUser.firstName || '',
          lastName: parsedUser.lastName || '',
          phoneNumber: parsedUser.phoneNumber || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Делаем запрос к API для получения актуальных данных
    fetchUserProfile();
    checkApiKey();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      // Используем POST запрос к /api/auth/login с пустым телом для получения данных пользователя
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к профилю необходимо авторизоваться');
        setLoading(false);
        return;
      }

      // Получаем email из localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const email = userData.email;

      if (!email) {
        setError('Не удалось определить email пользователя');
        setLoading(false);
        return;
      }

      // Делаем запрос к API
      const response = await axios.get(`${API_BASE_URL}/auth/user-info`);
      console.log('User profile response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setFormData({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          phoneNumber: response.data.user.phoneNumber || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Обновляем данные в localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Если запрос не удался, используем данные из localStorage
      // Не устанавливаем ошибку, чтобы не блокировать пользователя
    } finally {
      setLoading(false);
    }
  };

  const checkApiKey = async () => {
    try {
      console.log('Checking API key...');
      const response = await axios.get(`${API_BASE_URL}/auth/api-key`);
      console.log('API key response:', response.data);

      if (response.data.success && response.data.hasApiKey) {
        setApiKey(response.data.apiKey);
      }
    } catch (err) {
      console.error('Error checking API key:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Updating profile...');
      const response = await axios.post(
        `${API_BASE_URL}/auth/update-profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        }
      );
      console.log('Update profile response:', response.data);

      if (response.data.success) {
        setSuccess('Профиль успешно обновлен');
        setUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        });
        setIsEditing(false);

        // Update localStorage user data
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.firstName = formData.firstName;
        userData.lastName = formData.lastName;
        userData.phoneNumber = formData.phoneNumber;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }
    
    setLoading(true);

    try {
      console.log('Changing password...');
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }
      );
      console.log('Change password response:', response.data);

      if (response.data.success) {
        setSuccess('Пароль успешно изменен');
        setIsChangingPassword(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Ошибка изменения пароля');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      console.log('Setting API key...');
      const response = await axios.post(
        `${API_BASE_URL}/auth/set-api-key`,
        { apiKey }
      );
      console.log('Set API key response:', response.data);
      
      if (response.data.success) {
        setSuccess('API ключ Wildberries успешно установлен');
      }
    } catch (err) {
      console.error('Error setting API key:', err);
      setError(err.response?.data?.message || 'Ошибка установки API ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      console.log('Removing API key...');
      const response = await axios.delete(`${API_BASE_URL}/auth/api-key`);
      console.log('Remove API key response:', response.data);
      
      if (response.data.success) {
        setSuccess('API ключ Wildberries успешно удален');
        setApiKey('');
      }
    } catch (err) {
      console.error('Error removing API key:', err);
      setError(err.response?.data?.message || 'Ошибка удаления API ключа');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="profile-page loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  // Если нет данных пользователя и нет токена, показываем сообщение о необходимости авторизации
  if (!user && !localStorage.getItem('token')) {
    return (
      <div className="profile-page">
        <h1>Профиль пользователя</h1>
        <div className="error-message">Для доступа к профилю необходимо авторизоваться</div>
        <button 
          className="primary-button" 
          onClick={() => window.location.href = '/'}
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Профиль пользователя</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="profile-container">
        <div className="profile-section">
          <h2>Личная информация</h2>
          
          {!isEditing ? (
            <div className="profile-info">
              <div className="info-item">
                <FontAwesomeIcon icon={faUser} className="info-icon" />
                <div>
                  <span className="label">Имя и фамилия</span>
                  <span className="value">{user?.firstName} {user?.lastName}</span>
                </div>
              </div>
              
              <div className="info-item">
                <FontAwesomeIcon icon={faEnvelope} className="info-icon" />
                <div>
                  <span className="label">Email</span>
                  <span className="value">{user?.email}</span>
                </div>
              </div>
              
              <div className="info-item">
                <FontAwesomeIcon icon={faPhone} className="info-icon" />
                <div>
                  <span className="label">Телефон</span>
                  <span className="value">{user?.phoneNumber || 'Не указан'}</span>
                </div>
              </div>
              
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Редактировать профиль
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="firstName">Имя</label>
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
                <label htmlFor="lastName">Фамилия</label>
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
                <label htmlFor="phoneNumber">Телефон</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="profile-section">
          <h2>Безопасность</h2>
          
          {!isChangingPassword ? (
            <div className="security-info">
              <p>Для изменения пароля нажмите кнопку ниже</p>
              <button 
                className="edit-button"
                onClick={() => setIsChangingPassword(true)}
              >
                Изменить пароль
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
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
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Изменить пароль'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="profile-section">
          <h2>API ключ Wildberries</h2>
          
          {apiKey ? (
            <div className="api-key-info">
              <div className="api-key-display">
                <span>{showApiKey ? apiKey : apiKey.substring(0, 10) + '...'}</span>
                <button 
                  className="toggle-button"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              
              <button 
                className="remove-button"
                onClick={handleRemoveApiKey}
                disabled={loading}
              >
                {loading ? 'Удаление...' : 'Удалить API ключ'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleApiKeySubmit} className="api-key-form">
              <div className="form-group">
                <label htmlFor="apiKey">API ключ Wildberries</label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Введите ваш API ключ Wildberries"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить API ключ'}
              </button>
            </form>
          )}
          
          <div className="api-key-help">
            <p>API ключ используется для получения данных из вашего кабинета Wildberries.</p>
            <p>Для получения API ключа перейдите в <a href="https://seller.wildberries.ru/supplier-settings/access-to-api" target="_blank" rel="noopener noreferrer">кабинет продавца Wildberries</a> и создайте новый ключ.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 