import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSpinner, faCrown, faGift } from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Добавляем состояние для отслеживания отправки запроса
  const paymentButtonRef = useRef(null); // Реф для кнопки оплаты

  // Добавляем состояние для отслеживания попыток авторизации
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [lastAuthAttempt, setLastAuthAttempt] = useState(0);
  const MAX_AUTH_RETRIES = 3;
  const AUTH_RETRY_DELAY = 2000; // 2 секунды

  const API_BASE_URL = 'http://localhost:8080/api';
  
  // Создаем отдельный экземпляр axios для этого компонента
  const apiClient = axios.create({
    baseURL: API_BASE_URL
  });
  
  // Настраиваем перехватчик запросов для apiClient
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          // Явно добавляем префикс Bearer к токену, если его еще нет
          config.headers.Authorization = token.startsWith('Bearer ') 
            ? token 
            : `Bearer ${token}`;
          
          console.log('Subscription API Request:', config.method, config.url);
          console.log('Request headers:', config.headers);
        } else {
          console.warn('No token found in localStorage for request:', config.url);
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    const responseInterceptor = apiClient.interceptors.response.use(
      response => {
        console.log('Response from:', response.config.url, 'Status:', response.status);
        return response;
      },
      error => {
        console.error('API Error:', error);
        if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
          
          if (error.response.status === 401) {
            console.error('Authentication error in SubscriptionPage component');
            setIsAuthenticated(false);
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
      }
    );
    
    // Очищаем перехватчики при размонтировании компонента
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Функция для предотвращения автоматических запросов
  useEffect(() => {
    // Отключаем автоматические запросы от React Query и других библиотек
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // Больше не блокируем запросы к create-trial
      return originalFetch.apply(this, args);
    };

    // Отключаем автоматические запросы от axios
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      // Помечаем запросы, созданные вручную
      if (this._manualRequest) {
        console.log('✅ Allowing manual XHR request to:', url);
        return originalOpen.apply(this, [method, url, ...rest]);
      }
      
      // Больше не блокируем запросы к create-trial
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    return () => {
      // Восстанавливаем оригинальные методы при размонтировании компонента
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalOpen;
    };
  }, []);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchSubscriptionInfo();
      fetchAvailablePlans();
    } else {
      setLoading(false);
      setError('Для доступа к подпискам необходимо авторизоваться');
    }
  }, []);

  // Функция для проверки и обновления токена
  const refreshAuthToken = async () => {
    // Проверяем, не превышено ли количество попыток
    if (authRetryCount >= MAX_AUTH_RETRIES) {
      console.log(`Превышено максимальное количество попыток авторизации (${MAX_AUTH_RETRIES})`);
      setError('Ошибка авторизации. Пожалуйста, войдите в систему повторно.');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/';
      }, 2000);
      return false;
    }

    // Проверяем, не слишком ли часто пытаемся обновить токен
    const now = Date.now();
    if (now - lastAuthAttempt < AUTH_RETRY_DELAY) {
      console.log('Слишком частые попытки обновления токена, ожидаем...');
      await new Promise(resolve => setTimeout(resolve, AUTH_RETRY_DELAY));
    }

    setLastAuthAttempt(Date.now());
    setAuthRetryCount(prevCount => prevCount + 1);

    // Получаем данные пользователя из localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Если есть email и сохраненный пароль, пробуем повторно авторизоваться
    if (userData.email && userData._savedPassword) {
      console.log('Attempting to re-login with saved credentials');
      
      try {
        // Создаем новый экземпляр axios без перехватчиков для предотвращения цикла
        const axiosInstance = axios.create({
          baseURL: API_BASE_URL
        });
        
        // Пытаемся повторно войти в систему
        const response = await axiosInstance.post('/auth/login', {
          email: userData.email,
          password: userData._savedPassword
        });
        
        if (response.data.success) {
          console.log('Re-login successful, updating token');
          
          // Обновляем токен и данные пользователя
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify({
            ...response.data.user,
            _savedPassword: userData._savedPassword
          }));
          
          return true;
        }
      } catch (error) {
        console.error('Error during re-login:', error);
      }
    }
    
    return false;
  };

  const fetchSubscriptionInfo = async () => {
    try {
      console.log('Fetching subscription info...');
      const response = await apiClient.get(`/subscription/info`);
      console.log('Subscription info response:', response.data);

      if (response.data.success) {
        setSubscriptionInfo(response.data.subscription);
        setAutoRenew(response.data.subscription?.autoRenew || false);
      } else {
        console.error('Error fetching subscription info:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching subscription info:', err);
      setError(err.response?.data?.message || 'Ошибка получения информации о подписке');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      console.log('Fetching available plans...');
      const response = await apiClient.get(`/subscription/plans`);
      console.log('Available plans response:', response.data);

      if (response.data.success && response.data.plans) {
        console.log('Available plans data:', response.data.plans);
        
        // Преобразуем планы в нужный формат
        const formattedPlans = response.data.plans.map(plan => ({
          id: plan.planType, // Используем planType как id
          name: plan.displayName,
          price: plan.price,
          duration: plan.days,
          features: []
        }));
        
        // Добавляем бесплатный план, если его нет
        const hasFreeplan = formattedPlans.some(plan => plan.price === 0);
        if (!hasFreeplan) {
          formattedPlans.unshift({
            id: 'PLAN_FREE',
            name: 'Бесплатный тестовый',
            price: 0,
            duration: 7,
            features: ['Базовая аналитика', 'Тестовый доступ', '7 дней']
          });
        }
        
        console.log('Formatted plans:', formattedPlans);
        setAvailablePlans(formattedPlans);
        
        // Если есть бесплатный план, выбираем его по умолчанию
        const freePlan = formattedPlans.find(plan => plan.price === 0);
        if (freePlan) {
          setSelectedPlan(freePlan);
        } else if (formattedPlans.length > 0) {
          setSelectedPlan(formattedPlans[0]);
        }
      } else {
        console.error('No valid plans received or request failed');
        
        // Если нет планов с сервера, создаем стандартные планы
        const defaultPlans = [
          {
            id: 'PLAN_FREE',
            name: 'Бесплатный тестовый',
            price: 0,
            duration: 7,
            features: ['Базовая аналитика', 'Тестовый доступ', '7 дней']
          },
          {
            id: 'PLAN_30_DAYS',
            name: '30 дней',
            price: 1499,
            duration: 30,
            features: ['Финансовая таблица', 'ABC-анализ', 'Планирование поставок']
          },
          {
            id: 'PLAN_60_DAYS',
            name: '60 дней',
            price: 2799,
            duration: 60,
            features: ['Все функции 30-дневного плана', 'Отслеживание промоакций', 'Приоритетная поддержка']
          },
          {
            id: 'PLAN_90_DAYS',
            name: '90 дней',
            price: 3999,
            duration: 90,
            features: ['Все функции 60-дневного плана', 'Расширенная аналитика', 'Персональный менеджер']
          }
        ];
        
        setAvailablePlans(defaultPlans);
        setSelectedPlan(defaultPlans[0]);
      }
    } catch (err) {
      console.error('Error fetching available plans:', err);
      
      // Если произошла ошибка, создаем стандартные планы
      const defaultPlans = [
        {
          id: 'PLAN_FREE',
          name: 'Бесплатный тестовый',
          price: 0,
          duration: 7,
          features: ['Базовая аналитика', 'Тестовый доступ', '7 дней']
        },
        {
          id: 'PLAN_30_DAYS',
          name: '30 дней',
          price: 1499,
          duration: 30,
          features: ['Финансовая таблица', 'ABC-анализ', 'Планирование поставок']
        },
        {
          id: 'PLAN_60_DAYS',
          name: '60 дней',
          price: 2799,
          duration: 60,
          features: ['Все функции 30-дневного плана', 'Отслеживание промоакций', 'Приоритетная поддержка']
        },
        {
          id: 'PLAN_90_DAYS',
          name: '90 дней',
          price: 3999,
          duration: 90,
          features: ['Все функции 60-дневного плана', 'Расширенная аналитика', 'Персональный менеджер']
        }
      ];
      
      setAvailablePlans(defaultPlans);
      setSelectedPlan(defaultPlans[0]);
    }
  };

  const handlePlanSelect = (plan) => {
    if (!plan || !plan.id) {
      console.error('Invalid plan selected:', plan);
      return;
    }
    
    console.log('Selected plan:', plan);
    setSelectedPlan({
      ...plan,
      id: String(plan.id) // Убедимся, что ID всегда строка
    });
  };

  const handleAutoRenewToggle = () => {
    setAutoRenew(!autoRenew);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      setError('Пожалуйста, выберите план подписки');
      return;
    }

    // Проверяем, не отправляется ли уже запрос
    if (isSubmitting || processingPayment) {
      console.log('Запрос уже отправляется, игнорируем повторный клик');
      return;
    }

    setProcessingPayment(true);
    setIsSubmitting(true); // Устанавливаем флаг отправки
    setError('');

    try {
      console.log('Processing payment for plan:', selectedPlan);
      
      // Получаем токен и данные пользователя
      let token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        console.error('Токен отсутствует в localStorage');
        setError('Для оформления подписки необходимо авторизоваться');
        setProcessingPayment(false);
        setIsSubmitting(false);
        return;
      }
      
      console.log('User data from localStorage:', { 
        email: userData.email, 
        id: userData.id
      });
      
      // Проверяем, что planId существует
      if (!selectedPlan.id) {
        console.error('Plan ID is missing:', selectedPlan);
        setError(`Некорректный идентификатор плана: отсутствует`);
        setProcessingPayment(false);
        setIsSubmitting(false);
        return;
      }
      
      // Преобразуем ID в строку, если это не строка
      const planId = String(selectedPlan.id);
      
      // Проверяем формат токена и добавляем префикс Bearer, если его нет
      if (token && !token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }
      
      // Для бесплатного плана используем специальный эндпоинт без параметров
      if (selectedPlan.price === 0) {
        console.log('Активируем бесплатную подписку');
        
        try {
          // Подготавливаем данные для запроса
          const requestData = { 
            email: userData.email 
          };
          
          console.log('Отправляем запрос на создание бесплатной подписки:');
          console.log('URL:', 'http://localhost:8080/api/public/subscription/free');
          console.log('Метод:', 'POST');
          console.log('Заголовки:', { 'Content-Type': 'application/json' });
          console.log('Тело запроса:', requestData);
          
          // Используем fetch для отправки запроса на создание бесплатной подписки
          const response = await fetch('http://localhost:8080/api/public/subscription/free', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            credentials: 'include'
          });
          
          const data = await response.json();
          console.log('Free subscription response:', data);
          
          if (data.success) {
            setPaymentSuccess(true);
            fetchSubscriptionInfo();
          } else {
            setError(data.message || 'Ошибка активации бесплатной подписки');
            
            // Проверяем подписки пользователя через отладочный эндпоинт
            console.log('Проверяем подписки пользователя через отладочный эндпоинт...');
            try {
              const debugResponse = await fetch(
                `http://localhost:8080/api/public/subscription/debug?email=${userData.email}`
              );
              const debugData = await debugResponse.json();
              console.log('Debug response:', debugData);
            } catch (debugError) {
              console.error('Error fetching debug info:', debugError);
            }
          }
        } catch (fetchError) {
          console.error('Error activating free subscription:', fetchError);
          setError('Ошибка активации бесплатной подписки. Пожалуйста, попробуйте позже.');
        }
      } else {
        // Для платных планов используем стандартный эндпоинт
        console.log(`Отправляем запрос на создание платной подписки: ${planId}`);
        
        const response = await axios.post(
          `${API_BASE_URL}/subscription/create`,
          { planType: planId },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            }
          }
        );
        
        console.log('Payment response:', response.data);
        
        if (response.data.success) {
          setPaymentSuccess(true);
          fetchSubscriptionInfo();
        } else {
          setError(response.data.message || 'Ошибка обработки платежа');
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
      }
      setError(err.response?.data?.message || 'Произошла ошибка при обработке платежа');
    } finally {
      setProcessingPayment(false);
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      console.log('Cancelling subscription...');
      
      // Получаем токен
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Для отмены подписки необходимо авторизоваться');
        return;
      }
      
      // Отправляем запрос на отмену подписки с явным указанием заголовка Authorization
      const response = await axios.post(
        `${API_BASE_URL}/subscription/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Cancel subscription response:', response.data);

      if (response.data.success) {
        fetchSubscriptionInfo();
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.response?.data?.message || 'Произошла ошибка при отмене подписки');
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      console.log('Toggling auto-renew...');
      const response = await apiClient.post(`/subscription/toggle-auto-renew`);
      console.log('Toggle auto-renew response:', response.data);

      if (response.data.success) {
        setAutoRenew(!autoRenew);
      }
    } catch (err) {
      console.error('Error toggling auto-renew:', err);
      setError(err.response?.data?.message || 'Произошла ошибка при изменении настроек автопродления');
    }
  };

  const renderSubscriptionInfo = () => {
    if (loading) {
      return (
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Загрузка информации о подписке...</p>
        </div>
      );
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (!subscriptionInfo || !subscriptionInfo.isActive) {
      return (
        <div className="no-subscription">
          <p>У вас нет активной подписки</p>
          <p>Выберите план подписки ниже</p>
        </div>
      );
    }

    return (
      <div className="subscription-details">
        <div className="subscription-header">
          <FontAwesomeIcon icon={faCrown} className="subscription-icon" />
          <h3>{subscriptionInfo.planName || subscriptionInfo.planId}</h3>
          <span className={`status ${subscriptionInfo.status?.toLowerCase() || 'active'}`}>
            {subscriptionInfo.status || 'Активна'}
          </span>
        </div>
        
        <div className="subscription-info-grid">
          <div className="info-item">
            <span className="label">Дата начала:</span>
            <span className="value">{new Date(subscriptionInfo.startDate).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Дата окончания:</span>
            <span className="value">{new Date(subscriptionInfo.endDate).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Осталось дней:</span>
            <span className="value">{subscriptionInfo.daysLeft || 
              Math.ceil((new Date(subscriptionInfo.endDate) - new Date()) / (1000 * 60 * 60 * 24))}</span>
          </div>
          <div className="info-item">
            <span className="label">Тип:</span>
            <span className="value">
              {subscriptionInfo.trial ? 'Пробный период' : 'Стандартная'}
            </span>
          </div>
        </div>
        
        <div className="subscription-actions">
          <button 
            className="danger-button"
            onClick={handleCancelSubscription}
          >
            Отменить подписку
          </button>
        </div>
      </div>
    );
  };

  const renderPlans = () => {
    if (loading) {
      return (
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Загрузка планов подписки...</p>
        </div>
      );
    }

    if (availablePlans.length === 0) {
      return <p>Нет доступных планов подписки</p>;
    }

    return (
      <div className="plans-grid">
        {availablePlans.map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${plan.price === 0 ? 'free-plan' : ''}`}
            onClick={() => handlePlanSelect(plan)}
          >
            {plan.price === 0 && <div className="free-badge"><FontAwesomeIcon icon={faGift} /> БЕСПЛАТНО</div>}
            <h3>{plan.name}</h3>
            <div className="plan-price">{plan.price} ₽</div>
            <div className="plan-duration">{plan.duration} дней</div>
            <div className="plan-features">
              {plan.features && plan.features.map((feature, index) => (
                <div key={index} className="plan-feature">
                  <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {selectedPlan?.id === plan.id && (
              <div className="selected-badge">
                <FontAwesomeIcon icon={faCheck} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPaymentForm = () => {
    // Если выбран бесплатный план, меняем текст кнопки
    const buttonText = selectedPlan && selectedPlan.price === 0 
      ? 'Активировать бесплатный доступ' 
      : `Оплатить ${selectedPlan ? selectedPlan.price + ' ₽' : ''}`;

    // Определяем состояние кнопки
    const isButtonDisabled = !selectedPlan || processingPayment || isSubmitting;

    // Функция для обработки клика на кнопку
    const handleButtonClick = (e) => {
      // Предотвращаем стандартное поведение
      e.preventDefault();
      e.stopPropagation();

      // Предотвращаем двойные клики
      if (isButtonDisabled) {
        console.log('Кнопка отключена, игнорируем клик');
        return;
      }

      // Вызываем функцию оплаты
      console.log('Вызываем handlePayment вручную');
      handlePayment();
    };

    return (
      <div className="payment-form">
        {selectedPlan && selectedPlan.price !== 0 && (
          <div className="auto-renew-option">
            <label>
              <input 
                type="checkbox"
                checked={autoRenew}
                onChange={handleAutoRenewToggle}
                disabled={isButtonDisabled}
              />
              Автоматически продлевать подписку
            </label>
          </div>
        )}
        
        <button 
          ref={paymentButtonRef}
          className="primary-button payment-button"
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
        >
          {processingPayment ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              {selectedPlan && selectedPlan.price === 0 ? 'Активация...' : 'Обработка платежа...'}
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    );
  };

  const renderPaymentSuccess = () => {
    return (
      <div className="payment-success">
        <FontAwesomeIcon icon={faCheck} className="success-icon" />
        <h2>Подписка активирована успешно!</h2>
        <p>Теперь вы можете использовать все возможности сервиса.</p>
        <button 
          className="primary-button"
          onClick={() => window.location.href = '/analytics'}
        >
          Перейти к аналитике
        </button>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="subscription-page">
        <h1>Управление подпиской</h1>
        <div className="error-message">{error || 'Для доступа к подпискам необходимо авторизоваться'}</div>
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
    <div className="subscription-page">
      <h1>Управление подпиской</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {paymentSuccess ? renderPaymentSuccess() : (
        <>
          <div className="subscription-container">
            <div className="current-subscription">
              <h2>Текущая подписка</h2>
              {renderSubscriptionInfo()}
            </div>
            
            <div className="available-plans">
              <h2>{subscriptionInfo?.isActive ? 'Продление подписки' : 'Новая подписка'}</h2>
              {renderPlans()}
              {selectedPlan && renderPaymentForm()}
            </div>
          </div>
          
          <div className="subscription-features">
            <h2>Возможности подписки</h2>
            
            <div className="features-list">
              <div className="feature-item">
                <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                <span>Полный доступ к аналитике Wildberries</span>
              </div>
              <div className="feature-item">
                <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                <span>ABC-анализ товаров</span>
              </div>
              <div className="feature-item">
                <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                <span>Планирование поставок</span>
              </div>
              <div className="feature-item">
                <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                <span>Учет акций и промокодов</span>
              </div>
              <div className="feature-item">
                <FontAwesomeIcon icon={faCheck} className="feature-icon" />
                <span>Финансовая аналитика</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 