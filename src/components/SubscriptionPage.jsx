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

  const API_BASE_URL = 'http://localhost:8080/api';

  useEffect(() => {
    fetchSubscriptionInfo();
    fetchAvailablePlans();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/subscription/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscriptionInfo(response.data.subscription);
        setAutoRenew(response.data.subscription?.autoRenew || false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка получения информации о подписке');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      
      if (response.data.success) {
        setAvailablePlans(response.data.plans);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка получения доступных планов');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCreateSubscription = async () => {
    if (!selectedPlan) return;
    
    setProcessingPayment(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/create`,
        {
          planType: selectedPlan.planType,
          paymentMethod: 'card'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Имитация процесса оплаты
        setTimeout(() => {
          handleActivateSubscription(response.data.subscription.id, response.data.subscription.paymentTransactionId);
        }, 2000);
      } else {
        setError(response.data.message || 'Ошибка создания подписки');
        setProcessingPayment(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при создании подписки');
      setProcessingPayment(false);
    }
  };

  const handleActivateSubscription = async (subscriptionId, transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/activate`,
        {
          subscriptionId,
          transactionId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setPaymentSuccess(true);
        fetchSubscriptionInfo();
      } else {
        setError(response.data.message || 'Ошибка активации подписки');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при активации подписки');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedPlan) return;
    
    setProcessingPayment(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/extend`,
        {
          planType: selectedPlan.planType,
          paymentMethod: 'card'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setPaymentSuccess(true);
        fetchSubscriptionInfo();
      } else {
        setError(response.data.message || 'Ошибка продления подписки');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при продлении подписки');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/auto-renew`,
        {
          autoRenew: !autoRenew
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAutoRenew(!autoRenew);
        fetchSubscriptionInfo();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при изменении настроек автопродления');
    }
  };

  const renderSubscriptionInfo = () => {
    if (!subscriptionInfo) {
      return (
        <div className="no-subscription-info">
          <p>У вас нет активной подписки</p>
        </div>
      );
    }

    const isExpiring = subscriptionInfo.expiringSoon;
    
    return (
      <div className="subscription-info-card">
        <div className="subscription-header">
          <FontAwesomeIcon icon={faCrown} className="subscription-icon" />
          <h3>{subscriptionInfo.planName}</h3>
          <span className={`status-badge ${subscriptionInfo.isActive ? 'active' : 'inactive'}`}>
            {subscriptionInfo.status}
          </span>
        </div>
        
        <div className="subscription-details">
          <div className="detail-item">
            <span className="label">Дата начала:</span>
            <span className="value">{new Date(subscriptionInfo.startDate).toLocaleDateString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Дата окончания:</span>
            <span className="value">{new Date(subscriptionInfo.endDate).toLocaleDateString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Осталось дней:</span>
            <span className={`value ${isExpiring ? 'expiring' : ''}`}>{subscriptionInfo.daysLeft}</span>
          </div>
          <div className="detail-item">
            <span className="label">Автопродление:</span>
            <span className="value">{subscriptionInfo.autoRenew ? 'Включено' : 'Выключено'}</span>
          </div>
        </div>
        
        <div className="subscription-actions">
          <label className="auto-renew-toggle">
            <input 
              type="checkbox" 
              checked={autoRenew} 
              onChange={handleToggleAutoRenew} 
            />
            <span className="toggle-label">Автопродление</span>
          </label>
          
          {isExpiring && (
            <button 
              className="extend-button"
              onClick={() => setSelectedPlan(null)}
            >
              Продлить подписку
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPlans = () => {
    if (!availablePlans.length) {
      return <p>Загрузка планов подписки...</p>;
    }

    return (
      <div className="subscription-plans">
        <h3>Выберите план подписки</h3>
        
        <div className="plans-grid">
          {availablePlans.map((plan) => (
            <div 
              key={plan.planType}
              className={`plan-card ${selectedPlan?.planType === plan.planType ? 'selected' : ''}`}
              onClick={() => handleSelectPlan(plan)}
            >
              <h4>{plan.displayName}</h4>
              <div className="plan-price">{plan.price} ₽</div>
              <div className="plan-duration">{plan.days} дней</div>
              
              {selectedPlan?.planType === plan.planType && (
                <div className="selected-mark">
                  <FontAwesomeIcon icon={faCheck} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {selectedPlan && (
          <div className="plan-actions">
            <button 
              className="purchase-button"
              onClick={subscriptionInfo?.isActive ? handleExtendSubscription : handleCreateSubscription}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Обработка...
                </>
              ) : subscriptionInfo?.isActive ? 'Продлить подписку' : 'Оформить подписку'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentSuccess = () => (
    <div className="payment-success">
      <FontAwesomeIcon icon={faCheck} className="success-icon" />
      <h3>Оплата успешна!</h3>
      <p>Ваша подписка активирована.</p>
      <button 
        className="back-button"
        onClick={() => setPaymentSuccess(false)}
      >
        Вернуться к подписке
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="subscription-page loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Загрузка информации о подписке...</p>
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