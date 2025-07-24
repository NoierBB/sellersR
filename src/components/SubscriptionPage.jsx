import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSpinner, faCrown } from '@fortawesome/free-solid-svg-icons';

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
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    const responseInterceptor = apiClient.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        if (error.response && error.response.status === 401) {
          console.error('Authentication error in SubscriptionPage component:', error);
          setIsAuthenticated(false);
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

      if (response.data.success) {
        setAvailablePlans(response.data.plans);
      }
    } catch (err) {
      console.error('Error fetching available plans:', err);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleAutoRenewToggle = () => {
    setAutoRenew(!autoRenew);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      setError('Пожалуйста, выберите план подписки');
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      console.log('Processing payment...');
      const response = await apiClient.post(`/subscription/create`, {
        planType: selectedPlan.planType,
        autoRenew: autoRenew,
        paymentMethod: 'CARD'
      });
      console.log('Payment response:', response.data);

      if (response.data.success) {
        setPaymentSuccess(true);
        // Обновляем информацию о подписке после успешной оплаты
        fetchSubscriptionInfo();
      } else {
        setError(response.data.message || 'Ошибка обработки платежа');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Произошла ошибка при обработке платежа');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      console.log('Cancelling subscription...');
      const response = await apiClient.post(`/subscription/cancel`);
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
          <h3>{subscriptionInfo.planName}</h3>
          <span className={`status ${subscriptionInfo.status.toLowerCase()}`}>
            {subscriptionInfo.status}
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
            <span className="value">{subscriptionInfo.daysLeft}</span>
          </div>
          <div className="info-item">
            <span className="label">Автопродление:</span>
            <span className="value">
              {subscriptionInfo.autoRenew ? (
                <FontAwesomeIcon icon={faCheck} className="icon-success" />
              ) : (
                <FontAwesomeIcon icon={faTimes} className="icon-error" />
              )}
            </span>
          </div>
        </div>
        
        <div className="subscription-actions">
          <button 
            className="secondary-button"
            onClick={handleToggleAutoRenew}
          >
            {subscriptionInfo.autoRenew ? 'Отключить автопродление' : 'Включить автопродление'}
          </button>
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
            key={plan.planType} 
            className={`plan-card ${selectedPlan?.planType === plan.planType ? 'selected' : ''}`}
            onClick={() => handlePlanSelect(plan)}
          >
            <h3>{plan.name}</h3>
            <div className="plan-price">{plan.price} ₽</div>
            <div className="plan-duration">{plan.days} дней</div>
            {selectedPlan?.planType === plan.planType && (
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
    return (
      <div className="payment-form">
        <div className="auto-renew-option">
          <label>
            <input 
              type="checkbox"
              checked={autoRenew}
              onChange={handleAutoRenewToggle}
            />
            Автоматически продлевать подписку
          </label>
        </div>
        
        <button 
          className="primary-button payment-button"
          onClick={handlePayment}
          disabled={!selectedPlan || processingPayment}
        >
          {processingPayment ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              Обработка платежа...
            </>
          ) : (
            `Оплатить ${selectedPlan ? selectedPlan.price + ' ₽' : ''}`
          )}
        </button>
      </div>
    );
  };

  const renderPaymentSuccess = () => {
    return (
      <div className="payment-success">
        <FontAwesomeIcon icon={faCheck} className="success-icon" />
        <h2>Оплата прошла успешно!</h2>
        <p>Ваша подписка активирована.</p>
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