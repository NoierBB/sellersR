import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faInfoCircle, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    financial: null,
    abc: null,
    supply: null,
    promotions: null
  });

  const API_BASE_URL = 'http://localhost:8080/api';

  // Функция для проверки наличия подписки и API ключа
  const checkRequirements = async () => {
    try {
      console.log('Checking subscription status...');
      
      // Получаем данные пользователя из localStorage для быстрого отображения
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data from localStorage:', userData);
      
      // Проверяем наличие подписки
      console.log('Fetching subscription info...');
      const subscriptionResponse = await axios.get(`${API_BASE_URL}/subscription/info`);
      console.log('Subscription response:', subscriptionResponse.data);
      
      if (subscriptionResponse.data.success && subscriptionResponse.data.subscription) {
        setHasSubscription(true);
        
        // Проверяем наличие API ключа
        console.log('Checking API key...');
        const apiKeyResponse = await axios.get(`${API_BASE_URL}/auth/api-key`);
        console.log('API key response:', apiKeyResponse.data);
        
        if (apiKeyResponse.data.success && apiKeyResponse.data.hasApiKey) {
          setHasApiKey(true);
          // Если есть и подписка, и API ключ, загружаем данные аналитики
          loadAnalyticsData();
        }
      } else {
        setHasSubscription(false);
      }
    } catch (err) {
      console.error('Error checking requirements:', err);
      
      // Если ошибка связана с авторизацией, пробуем использовать данные из localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Using user data from localStorage after error:', userData);
      
      // Пробуем повторно авторизоваться
      try {
        console.log('Attempting to re-authenticate...');
        const email = userData.email;
        const token = localStorage.getItem('token');
        
        if (email && token) {
          console.log('Token and email found in localStorage');
          // Делаем запрос к API для проверки подписки с явным указанием заголовка
          const subscriptionResponse = await axios.get(`${API_BASE_URL}/subscription/info`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Re-auth subscription response:', subscriptionResponse.data);
          
          if (subscriptionResponse.data.success && subscriptionResponse.data.subscription) {
            setHasSubscription(true);
            
            // Проверяем наличие API ключа
            const apiKeyResponse = await axios.get(`${API_BASE_URL}/auth/api-key`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('Re-auth API key response:', apiKeyResponse.data);
            
            if (apiKeyResponse.data.success && apiKeyResponse.data.hasApiKey) {
              setHasApiKey(true);
              // Если есть и подписка, и API ключ, загружаем данные аналитики
              loadAnalyticsData();
            }
          }
        }
      } catch (reAuthErr) {
        console.error('Re-authentication error:', reAuthErr);
        setError('Не удалось проверить наличие подписки и API ключа');
      }
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных аналитики
  const loadAnalyticsData = async () => {
    setLoading(true);
    
    try {
      console.log('Loading analytics data for tab:', activeTab);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      let endpoint = '';
      
      switch (activeTab) {
        case 'financial':
          endpoint = `${API_BASE_URL}/analytics/financial`;
          break;
        case 'abc':
          endpoint = `${API_BASE_URL}/analytics/abc`;
          break;
        case 'supply':
          endpoint = `${API_BASE_URL}/analytics/supply`;
          break;
        case 'promotions':
          endpoint = `${API_BASE_URL}/analytics/promotions`;
          break;
        default:
          endpoint = `${API_BASE_URL}/analytics/financial`;
      }
      
      console.log('Fetching data from endpoint:', endpoint);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Analytics data response:', response.data);
      
      if (response.data.success) {
        setAnalyticsData({
          ...analyticsData,
          [activeTab]: response.data.data
        });
        setError('');
      } else {
        setError(response.data.message || 'Ошибка получения данных аналитики');
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.response?.data?.message || 'Ошибка получения данных аналитики');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик сохранения API ключа
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setApiKeySaving(true);
    setApiKeyError('');
    setApiKeySuccess('');
    
    try {
      console.log('Saving API key...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setApiKeyError('Для установки API ключа необходимо авторизоваться');
        setApiKeySaving(false);
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/set-api-key`,
        { apiKey: apiKeyInput },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Save API key response:', response.data);
      
      if (response.data.success) {
        setApiKeySuccess('API ключ успешно сохранен');
        setHasApiKey(true);
        setApiKeyInput('');
        
        // После сохранения API ключа загружаем данные аналитики
        loadAnalyticsData();
      } else {
        setApiKeyError(response.data.message || 'Ошибка сохранения API ключа');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setApiKeyError(err.response?.data?.message || 'Ошибка сохранения API ключа');
    } finally {
      setApiKeySaving(false);
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Если данных для выбранной вкладки еще нет, загружаем их
    if (hasSubscription && hasApiKey && !analyticsData[tab]) {
      loadAnalyticsData();
    }
  };

  // Проверяем наличие подписки и API ключа при загрузке компонента
  useEffect(() => {
    checkRequirements();
  }, []);

  // Загружаем данные при изменении активной вкладки
  useEffect(() => {
    if (hasSubscription && hasApiKey) {
      loadAnalyticsData();
    }
  }, [activeTab]);

  // Если идет загрузка, показываем индикатор загрузки
  if (loading && !hasSubscription && !hasApiKey) {
    return (
      <div className="analytics-page loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  // Если нет подписки, показываем сообщение о необходимости подписки
  if (!hasSubscription) {
    return (
      <div className="analytics-page">
        <h1>Аналитика</h1>
        <div className="subscription-required">
          <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
          <h2>Требуется подписка</h2>
          <p>Для доступа к аналитике необходима активная подписка.</p>
          <button 
            className="primary-button"
            onClick={() => window.location.href = '/subscription'}
          >
            Оформить подписку
          </button>
        </div>
      </div>
    );
  }

  // Если нет API ключа, показываем форму для ввода API ключа
  if (!hasApiKey) {
    return (
      <div className="analytics-page">
        <h1>Аналитика</h1>
        <div className="api-key-required">
          <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
          <h2>Требуется API ключ Wildberries</h2>
          <p>Для доступа к аналитике необходимо указать API ключ вашего кабинета Wildberries.</p>
          
          <form onSubmit={handleSaveApiKey} className="api-key-form">
            {apiKeyError && <div className="error-message">{apiKeyError}</div>}
            {apiKeySuccess && <div className="success-message">{apiKeySuccess}</div>}
            
            <div className="form-group">
              <label htmlFor="apiKey">API ключ Wildberries</label>
              <input
                type="text"
                id="apiKey"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Введите ваш API ключ Wildberries"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="primary-button"
              disabled={apiKeySaving}
            >
              {apiKeySaving ? 'Сохранение...' : 'Сохранить API ключ'}
            </button>
          </form>
          
          <div className="api-key-help">
            <p>Для получения API ключа перейдите в <a href="https://seller.wildberries.ru/supplier-settings/access-to-api" target="_blank" rel="noopener noreferrer">кабинет продавца Wildberries</a> и создайте новый ключ.</p>
          </div>
        </div>
      </div>
    );
  }

  // Если есть ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="analytics-page">
        <h1>Аналитика</h1>
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Ошибка загрузки данных</h2>
          <p>{error}</p>
          <button 
            className="primary-button"
            onClick={loadAnalyticsData}
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <h1>Аналитика</h1>
      
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => handleTabChange('financial')}
        >
          Финансовая таблица
        </button>
        <button 
          className={`tab-button ${activeTab === 'abc' ? 'active' : ''}`}
          onClick={() => handleTabChange('abc')}
        >
          ABC-анализ
        </button>
        <button 
          className={`tab-button ${activeTab === 'supply' ? 'active' : ''}`}
          onClick={() => handleTabChange('supply')}
        >
          Планирование поставок
        </button>
        <button 
          className={`tab-button ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => handleTabChange('promotions')}
        >
          Отслеживание промоакций
        </button>
      </div>
      
      <div className="analytics-content">
        {loading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <div className="data-container">
            {/* Содержимое для вкладки "Финансовая таблица" */}
            {activeTab === 'financial' && analyticsData.financial && (
              <div className="financial-table">
                <h2>Финансовая таблица</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Продажи</th>
                      <th>Выручка</th>
                      <th>Прибыль</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.financial.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product}</td>
                        <td>{item.sales}</td>
                        <td>{item.revenue} ₽</td>
                        <td>{item.profit} ₽</td>
                        <td>{item.roi}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Итого</td>
                      <td>{analyticsData.financial.total.sales}</td>
                      <td>{analyticsData.financial.total.revenue} ₽</td>
                      <td>{analyticsData.financial.total.profit} ₽</td>
                      <td>{analyticsData.financial.total.roi}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            
            {/* Содержимое для вкладки "ABC-анализ" */}
            {activeTab === 'abc' && analyticsData.abc && (
              <div className="abc-analysis">
                <h2>ABC-анализ</h2>
                <div className="abc-groups">
                  <div className="abc-group">
                    <h3>Группа A</h3>
                    <p>Товары, приносящие 80% выручки</p>
                    <ul>
                      {analyticsData.abc.groupA.map((item, index) => (
                        <li key={index}>
                          <span className="product-name">{item.product}</span>
                          <span className="product-revenue">{item.revenue} ₽</span>
                          <span className="product-percent">{item.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="abc-group">
                    <h3>Группа B</h3>
                    <p>Товары, приносящие 15% выручки</p>
                    <ul>
                      {analyticsData.abc.groupB.map((item, index) => (
                        <li key={index}>
                          <span className="product-name">{item.product}</span>
                          <span className="product-revenue">{item.revenue} ₽</span>
                          <span className="product-percent">{item.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="abc-group">
                    <h3>Группа C</h3>
                    <p>Товары, приносящие 5% выручки</p>
                    <ul>
                      {analyticsData.abc.groupC.map((item, index) => (
                        <li key={index}>
                          <span className="product-name">{item.product}</span>
                          <span className="product-revenue">{item.revenue} ₽</span>
                          <span className="product-percent">{item.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Содержимое для вкладки "Планирование поставок" */}
            {activeTab === 'supply' && analyticsData.supply && (
              <div className="supply-planning">
                <h2>Планирование поставок</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Текущий остаток</th>
                      <th>Средние продажи в день</th>
                      <th>Прогноз на исчерпание</th>
                      <th>Рекомендуемая поставка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.supply.items.map((item, index) => (
                      <tr key={index} className={item.daysLeft < 7 ? 'warning' : ''}>
                        <td>{item.product}</td>
                        <td>{item.currentStock}</td>
                        <td>{item.averageSalesPerDay}</td>
                        <td>{item.daysLeft} дней</td>
                        <td>{item.recommendedSupply}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Содержимое для вкладки "Отслеживание промоакций" */}
            {activeTab === 'promotions' && analyticsData.promotions && (
              <div className="promotions-tracking">
                <h2>Отслеживание промоакций</h2>
                <div className="promotions-list">
                  {analyticsData.promotions.map((promo, index) => (
                    <div key={index} className="promotion-card">
                      <div className="promotion-header">
                        <h3>{promo.name}</h3>
                        <span className={`promotion-status ${promo.active ? 'active' : 'inactive'}`}>
                          {promo.active ? 'Активна' : 'Завершена'}
                        </span>
                      </div>
                      
                      <div className="promotion-dates">
                        <span>Начало: {new Date(promo.startDate).toLocaleDateString()}</span>
                        <span>Окончание: {new Date(promo.endDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="promotion-stats">
                        <div className="stat">
                          <span className="stat-label">Продажи до</span>
                          <span className="stat-value">{promo.salesBefore}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Продажи во время</span>
                          <span className="stat-value">{promo.salesDuring}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Прирост</span>
                          <span className="stat-value">{promo.salesGrowth}%</span>
                        </div>
                      </div>
                      
                      <div className="promotion-products">
                        <h4>Товары в акции:</h4>
                        <ul>
                          {promo.products.map((product, idx) => (
                            <li key={idx}>{product}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Если данных для выбранной вкладки нет */}
            {!analyticsData[activeTab] && (
              <div className="no-data">
                <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                <p>Данные отсутствуют или загружаются</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}