import { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionPage.css';

const SubscriptionPage = () => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'PLAN_30_DAYS',
      name: 'Стартер',
      duration: '30 дней',
      price: 1490,
      originalPrice: 2990,
      discount: 50,
      features: [
        'Базовая аналитика продаж',
        'Отчеты по 5 товарам',
        'Ежедневные обновления данных',
        'Email поддержка',
        'Экспорт в Excel'
      ],
      popular: false,
      color: 'var(--color-secondary-green)',
      gradient: 'var(--gradient-secondary)'
    },
    {
      id: 'PLAN_60_DAYS',
      name: 'Профи',
      duration: '60 дней',
      price: 2390,
      originalPrice: 5980,
      discount: 60,
      features: [
        'Полная аналитика продаж',
        'Отчеты по 50 товарам',
        'Обновления в реальном времени',
        'Приоритетная поддержка',
        'Экспорт в Excel и PDF',
        'Автоматизация рекламы',
        'Анализ конкурентов'
      ],
      popular: true,
      color: 'var(--color-primary-purple)',
      gradient: 'var(--gradient-purple)'
    },
    {
      id: 'PLAN_90_DAYS',
      name: 'Эксперт',
      duration: '90 дней',
      price: 2990,
      originalPrice: 8970,
      discount: 67,
      features: [
        'Премиум аналитика продаж',
        'Неограниченное количество товаров',
        'Обновления в реальном времени',
        'Персональный менеджер',
        'Все форматы экспорта',
        'Полная автоматизация рекламы',
        'Глубокий анализ конкурентов',
        'API доступ',
        'Индивидуальные отчеты'
      ],
      popular: false,
      color: 'var(--color-primary-pink)',
      gradient: 'var(--gradient-pink)'
    }
  ];

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      
      // Получаем информацию о пользователе
      const userResponse = await axios.get('/api/auth/user-info');
      if (userResponse.data.success) {
        setUser(userResponse.data.user);
      }
      
      // Получаем информацию о подписке
      const subResponse = await axios.get('/api/subscription/info');
      if (subResponse.data.success && subResponse.data.subscription) {
        setSubscription(subResponse.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setProcessing(true);
      setSelectedPlan(planId);
      
      const response = await axios.post('/api/subscription/subscribe', {
        planType: planId
      });
      
      if (response.data.success) {
        // Показываем успешное сообщение
        showNotification('Подписка успешно оформлена!', 'success');
        await fetchSubscriptionInfo(); // Обновляем данные
      } else {
        showNotification(response.data.message || 'Ошибка оформления подписки', 'error');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showNotification('Ошибка оформления подписки', 'error');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку?')) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const response = await axios.post('/api/subscription/cancel');
      
      if (response.data.success) {
        showNotification('Подписка отменена', 'success');
        await fetchSubscriptionInfo();
      } else {
        showNotification(response.data.message || 'Ошибка отмены подписки', 'error');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      showNotification('Ошибка отмены подписки', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    // Создаем уведомление (можно вынести в отдельный хук)
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      ${type === 'success' ? 'background: linear-gradient(135deg, #48DD00, #52A529);' : 
        type === 'error' ? 'background: linear-gradient(135deg, #FF4757, #FF3838);' : 
        'background: linear-gradient(135deg, #9F3ED5, #AD66D5);'}
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 4000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Загрузка информации о подписках...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="container">
        {/* Заголовок */}
        <div className="subscription-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">💎</span>
              Подписки SellLab
            </h1>
            <p className="page-subtitle">
              Выберите план, который подходит именно вам
            </p>
          </div>
          
          {subscription && subscription.status === 'ACTIVE' && (
            <div className="current-subscription">
              <div className="subscription-badge">
                <span className="badge-icon">✅</span>
                Активная подписка
              </div>
              <div className="subscription-details">
                <div className="subscription-plan">
                  {plans.find(p => p.id === subscription.planType)?.name || subscription.planType}
                </div>
                <div className="subscription-expires">
                  До {formatDate(subscription.endDate)} ({getDaysRemaining(subscription.endDate)} дней)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Тарифные планы */}
        <div className="plans-section">
          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`plan-card ${plan.popular ? 'plan-card-popular' : ''} ${
                  subscription?.planType === plan.id && subscription?.status === 'ACTIVE' ? 'plan-card-current' : ''
                }`}
                style={{ '--plan-color': plan.color }}
              >
                {plan.popular && (
                  <div className="plan-badge">
                    <span>🔥 Популярный</span>
                  </div>
                )}
                
                {subscription?.planType === plan.id && subscription?.status === 'ACTIVE' && (
                  <div className="plan-current-badge">
                    <span>✅ Текущий план</span>
                  </div>
                )}

                <div className="plan-header">
                  <div className="plan-icon" style={{ background: plan.gradient }}>
                    {index === 0 ? '🚀' : index === 1 ? '⚡' : '👑'}
                  </div>
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-duration">{plan.duration}</div>
                </div>

                <div className="plan-pricing">
                  <div className="plan-price">
                    <span className="price-currency">₽</span>
                    <span className="price-amount">{plan.price.toLocaleString()}</span>
                  </div>
                  
                  {plan.originalPrice > plan.price && (
                    <div className="plan-original-price">
                      <span className="original-price">₽{plan.originalPrice.toLocaleString()}</span>
                      <span className="discount-badge">-{plan.discount}%</span>
                    </div>
                  )}
                  
                  <div className="plan-price-per-day">
                    ≈ ₽{Math.round(plan.price / parseInt(plan.duration))} в день
                  </div>
                </div>

                <div className="plan-features">
                  <h4 className="features-title">Что включено:</h4>
                  <ul className="features-list">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="feature-item">
                        <span className="feature-icon">✓</span>
                        <span className="feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plan-action">
                  {subscription?.planType === plan.id && subscription?.status === 'ACTIVE' ? (
                    <button 
                      className="btn btn-current"
                      disabled
                    >
                      <span>✅</span>
                      Активен
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processing}
                      style={{ background: plan.gradient }}
                    >
                      {processing && selectedPlan === plan.id ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          Оформление...
                        </>
                      ) : (
                        <>
                          <span>💎</span>
                          Выбрать план
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Информация о подписке */}
        {subscription && subscription.status === 'ACTIVE' && (
          <div className="subscription-info">
            <div className="info-section">
              <h3 className="info-title">Управление подпиской</h3>
              
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <h4>Дата начала</h4>
                    <p>{formatDate(subscription.startDate)}</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">⏰</div>
                  <div className="info-content">
                    <h4>Дата окончания</h4>
                    <p>{formatDate(subscription.endDate)}</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">💰</div>
                  <div className="info-content">
                    <h4>Стоимость</h4>
                    <p>₽{subscription.price?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">🔄</div>
                  <div className="info-content">
                    <h4>Автопродление</h4>
                    <p>{subscription.autoRenew ? 'Включено' : 'Отключено'}</p>
                  </div>
                </div>
              </div>
              
              <div className="info-actions">
                <button
                  className="btn btn-danger"
                  onClick={handleCancelSubscription}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Отмена...
                    </>
                  ) : (
                    <>
                      <span>❌</span>
                      Отменить подписку
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="faq-section">
          <div className="section-header">
            <h2 className="section-title">Часто задаваемые вопросы</h2>
          </div>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h4 className="faq-question">🤔 Можно ли отменить подписку?</h4>
              <p className="faq-answer">
                Да, вы можете отменить подписку в любой момент. Доступ к премиум функциям 
                сохранится до окончания оплаченного периода.
              </p>
            </div>
            
            <div className="faq-item">
              <h4 className="faq-question">💳 Какие способы оплаты доступны?</h4>
              <p className="faq-answer">
                Мы принимаем все основные банковские карты, а также электронные кошельки 
                и банковские переводы.
              </p>
            </div>
            
            <div className="faq-item">
              <h4 className="faq-question">🔄 Есть ли автопродление?</h4>
              <p className="faq-answer">
                Да, подписка продлевается автоматически. Вы можете отключить автопродление 
                в настройках аккаунта в любой момент.
              </p>
            </div>
            
            <div className="faq-item">
              <h4 className="faq-question">📊 Сохранятся ли мои данные?</h4>
              <p className="faq-answer">
                Все ваши данные и отчеты сохраняются даже после отмены подписки. 
                Вы сможете получить к ним доступ при возобновлении подписки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;