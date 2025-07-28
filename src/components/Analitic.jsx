import './Analytics.css';
import { useState, useEffect, useCallback } from 'react';
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
  
  // Функция для проверки наличия подписки и API ключа с мемоизацией
  const checkSubscriptionAndLoadData = useCallback(async () => {
    try {
      console.log('Checking subscription status...');
      
      // Получаем данные пользователя из localStorage для быстрого отображения
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data from localStorage:', userData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      // Проверяем наличие подписки
      console.log('Fetching subscription info...');
      const subscriptionResponse = await axios.get(`${API_BASE_URL}/subscription/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Subscription response:', subscriptionResponse.data);
      
      if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
        setHasSubscription(true);
        
        // Проверяем наличие API ключа
        console.log('Checking API key...');
        const apiKeyResponse = await axios.get(`${API_BASE_URL}/auth/api-key`, {
          params: { email: userData.email },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('API key response:', apiKeyResponse.data);
        
        if (apiKeyResponse.data.success && apiKeyResponse.data.hasApiKey) {
          setHasApiKey(true);
          // Если есть и подписка, и API ключ, загружаем данные для активной вкладки
          console.log('Loading data for active tab:', activeTab);
          loadAnalyticsData(activeTab);
        }
      } else {
        setHasSubscription(false);
        // Загружаем демо данные для активной вкладки даже без подписки для демонстрации
        console.log('No subscription found, loading demo data for active tab:', activeTab);
        loadAnalyticsData(activeTab);
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
          // Делаем запрос к API для проверки подписки с явным указанием заголовка и параметра email
          const subscriptionResponse = await axios.get(`${API_BASE_URL}/subscription/info`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Re-auth subscription response:', subscriptionResponse.data);
          
          if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
            setHasSubscription(true);
            
            // Проверяем наличие API ключа
            const apiKeyResponse = await axios.get(`${API_BASE_URL}/auth/api-key`, {
              params: { email },
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('Re-auth API key response:', apiKeyResponse.data);
            
            if (apiKeyResponse.data.success && apiKeyResponse.data.hasApiKey) {
              setHasApiKey(true);
              // Если есть и подписка, и API ключ, загружаем данные для активной вкладки
              console.log('Re-auth: Loading data for active tab:', activeTab);
              loadAnalyticsData(activeTab);
            }
          }
        }
      } catch (reAuthErr) {
        console.error('Re-authentication error:', reAuthErr);
        setError('Не удалось проверить наличие подписки и API ключа');
        // Загружаем демо данные для активной вкладки в случае ошибки
        console.log('Loading demo data for active tab due to authentication error:', activeTab);
        loadAnalyticsData(activeTab);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Загрузка данных аналитики с проверкой времени последнего запроса
  const loadAnalyticsData = useCallback(async (tab) => {
    // Предотвращаем множественные запросы к одному эндпоинту
    if (loading) {
      console.log('Already loading, skipping request for tab:', tab);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Loading analytics data for tab:', tab);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      let endpoint = '';
      
      switch (tab) {
        case 'financial':
          endpoint = `${API_BASE_URL}/analytics/financial`;
          break;
        case 'unit-economics':
          endpoint = `${API_BASE_URL}/analytics/unit-economics`;
          break;
        case 'advertising':
          endpoint = `${API_BASE_URL}/analytics/advertising`;
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
      
      console.log(`Setting analytics data for tab ${tab}:`, response.data);
      console.log('Data structure:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.success) {
        setAnalyticsData(prev => ({
          ...prev,
          [tab]: response.data.data
        }));
        setError(null);
      } else {
        setError(response.data?.message || 'Ошибка загрузки данных');
      }
      
    } catch (err) {
      console.error('Error loading analytics data:', err);
      if (err.response?.status === 401) {
        setError('Требуется авторизация');
        // Удаляем недействительный токен
        localStorage.removeItem('token');
      } else {
        setError('Ошибка загрузки данных: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [loading]); // Добавляем loading как зависимость

  // Обработчик сохранения API ключа
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setApiKeySaving(true);
    setApiKeyError('');
    setApiKeySuccess('');
    
    try {
      console.log('Saving API key...');
      
      // Получаем данные пользователя и токен из localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const userEmail = userData.email;
      
      if (!userEmail || !token) {
        setApiKeyError('Для установки API ключа необходимо авторизоваться');
        setApiKeySaving(false);
        return;
      }
      
      console.log('User email:', userEmail);
      
      // Проверяем формат токена и добавляем префикс Bearer, если его нет
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Используем fetch вместо axios для отправки запроса
      const response = await fetch(`${API_BASE_URL}/auth/set-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ 
          apiKey: apiKeyInput,
          email: userEmail 
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Save API key response:', data);
      
      if (data.success) {
        setApiKeySuccess('API ключ успешно сохранен');
        setHasApiKey(true);
        setApiKeyInput('');
        
        // После сохранения API ключа загружаем данные аналитики
        loadAnalyticsData(activeTab);
      } else {
        setApiKeyError(data.message || 'Ошибка сохранения API ключа');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setApiKeyError('Ошибка сохранения API ключа. Проверьте консоль для деталей.');
    } finally {
      setApiKeySaving(false);
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Загружаем данные для выбранной вкладки если данных еще нет или они устарели
    if (!analyticsData[tab] || Date.now() - lastFetchTime[tab] > MIN_FETCH_INTERVAL) {
      console.log('Loading data for tab:', tab);
      loadAnalyticsData(tab);
    } else {
      console.log('Data for tab', tab, 'is already loaded and fresh');
    }
  };

  // Инициализация данных при загрузке компонента
  useEffect(() => {
    checkSubscriptionAndLoadData();
  }, []); // Убираем зависимость от activeTab

  // Отдельный useEffect для обработки смены вкладок
  useEffect(() => {
    if (hasSubscription || hasApiKey) {
      loadAnalyticsData(activeTab);
    }
  }, [activeTab]); // Загружаем данные только при смене активной вкладки

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
            onClick={() => loadAnalyticsData(activeTab)}
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
          Финансовый отчет
        </button>
        <button 
          className={`tab-button ${activeTab === 'unit-economics' ? 'active' : ''}`}
          onClick={() => handleTabChange('unit-economics')}
        >
          Юнит экономика ВБ
        </button>
        <button 
          className={`tab-button ${activeTab === 'advertising' ? 'active' : ''}`}
          onClick={() => handleTabChange('advertising')}
        >
          РК таблица
        </button>
      </div>
      
      <div className="analytics-content">
            {activeTab === 'financial' && analyticsData.financial && analyticsData.financial.weeks && analyticsData.financial.totals && (
              <div className="financial-report">
                <h2>Финансовый отчет</h2>
                <div className="table-container"> 
                <table>
                  <thead>
                    <tr>
                      <th>Неделя</th>
                      <th>Дата</th>
                      <th>Выкуп ШТ</th>
                      <th>Продажи ВБ</th>
                      <th>К перечислению за товар</th>
                      <th>Логистика</th>
                      <th>Хранение</th>
                      <th>Приемка</th>
                      <th>Штраф</th>
                      <th>Удержания/реклама</th>
                      <th>К выплате</th>
                      <th>Налог</th>
                      <th>Прочие расходы</th>
                      <th>Себестоимость проданного товара</th>
                      <th>Чистая прибыль</th>
                      <th>ДРР</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.financial.weeks.map((week, index) => (
                      <tr key={index}>
                        <td>{week.week}</td>
                        <td>{week.date}</td>
                        <td>{week.buyoutQuantity}</td>
                        <td>{week.salesWb} ₽</td>
                        <td>{week.toCalculateForGoods} ₽</td>
                        <td>{week.logistics} ₽</td>
                        <td>{week.storage} ₽</td>
                        <td>{week.acceptance} ₽</td>
                        <td>{week.penalty} ₽</td>
                        <td>{week.retentions} ₽</td>
                        <td>{week.toPay} ₽</td>
                        <td>{week.tax} ₽</td>
                        <td>{week.otherExpenses} ₽</td>
                        <td>{week.costOfGoodsSold} ₽</td>
                        <td className={week.netProfit > 0 ? 'positive' : 'negative'}>{week.netProfit} ₽</td>
                        <td>{week.drr}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="2">ИТОГО</td>
                      <td>{analyticsData.financial.totals.totalBuyout}</td>
                      <td>{analyticsData.financial.totals.totalSales} ₽</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{analyticsData.financial.totals.totalToPay} ₽</td>
                      <td>{analyticsData.financial.totals.totalTax} ₽</td>
                      <td>-</td>
                      <td>-</td>
                      <td className={analyticsData.financial.totals.totalNetProfit > 0 ? 'positive' : 'negative'}>{analyticsData.financial.totals.totalNetProfit} ₽</td>
                      <td>{analyticsData.financial.totals.avgDrr}%</td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>
        
            )}
            
            {/* Содержимое для вкладки "Юнит экономика ВБ" */}
            {activeTab === 'unit-economics' && analyticsData['unit-economics'] && analyticsData['unit-economics'].items && (
              <div className="unit-economics">
                <h2>Юнит экономика ВБ</h2>
                <div className="table-container"> 
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Артикул ВБ</th>
                        <th>Артикул продавца</th>
                        <th>Себестоимость</th>
                        <th>Доставка до ВБ</th>
                        <th>Валовая прибыль</th>
                        <th>МП цена ДО</th>
                        <th>МП скидка</th>
                        <th>Цена до СПП</th>
                        <th>% СПП</th>
                        <th>Цена после СПП</th>
                        <th>Точка безубыточности до СПП</th>
                        <th>Выкуп</th>
                        <th>Комиссия МП %</th>
                        <th>Доставка первого литра</th>
                        <th>Доставка следующего литра</th>
                        <th>Высота</th>
                        <th>Ширина</th>
                        <th>Длина</th>
                        <th>Общий объем в литрах</th>
                        <th>Коэффициент склада</th>
                        <th>Логистика МП</th>
                        <th>Логистика с учетом выкупа</th>
                        <th>Итоговая с учетом индекса</th>
                        <th>Хранение МП</th>
                        <th>Комиссия МП руб</th>
                        <th>ИТОГО МП</th>
                        <th>ИТОГО к оплате</th>
                        <th>Налог</th>
                        <th>Выручка после налога</th>
                        <th>Валовая прибыль</th>
                        <th>Наценка от итоговой цены</th>
                        <th>Маржинальность итоговая</th>
                        <th>Рентабельность по Валовой итоговая</th>
                        <th>ROI</th>
                        <th>ROM</th>
                        <th>XYZ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData['unit-economics'].items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.nmId}</td>
                          <td>{item.vendorCode}</td>
                          <td>{item.costPrice} ₽</td>
                          <td>{item.deliveryToWb} ₽</td>
                          <td>{item.grossProfit} ₽</td>
                          <td>{item.mpPriceBefore} ₽</td>
                          <td>{item.mpDiscount}%</td>
                          <td>{item.priceBeforeSpp} ₽</td>
                          <td>{item.sppPercent}%</td>
                          <td>{item.priceAfterSpp} ₽</td>
                          <td>{item.breakEvenBeforeSpp} ₽</td>
                          <td>{item.buyout}%</td>
                          <td>{item.mpCommissionPercent}%</td>
                          <td>{item.deliveryFirstLiter} ₽</td>
                          <td>{item.deliveryNextLiter} ₽</td>
                          <td>{item.height} см</td>
                          <td>{item.width} см</td>
                          <td>{item.length} см</td>
                          <td>{item.volumeLiters} л</td>
                          <td>{item.warehouseCoeff}</td>
                          <td>{item.logisticsMp} ₽</td>
                          <td>{item.logisticsWithBuyout} ₽</td>
                          <td>{item.totalWithIndex} ₽</td>
                          <td>{item.storageMp} ₽</td>
                          <td>{item.mpCommissionRub} ₽</td>
                          <td>{item.totalMp} ₽</td>
                          <td>{item.totalToPay} ₽</td>
                          <td>{item.tax} ₽</td>
                          <td>{item.revenueAfterTax} ₽</td>
                          <td className={item.grossProfitFinal > 0 ? 'positive' : 'negative'}>{item.grossProfitFinal} ₽</td>
                          <td className={item.markupFromFinalPrice > 0 ? 'positive' : 'negative'}>{item.markupFromFinalPrice}%</td>
                          <td className={item.finalMarginality > 0 ? 'positive' : 'negative'}>{item.finalMarginality}%</td>
                          <td className={item.grossProfitability > 0 ? 'positive' : 'negative'}>{item.grossProfitability}%</td>
                          <td className={item.roi > 0 ? 'positive' : 'negative'}>{item.roi}%</td>
                          <td className={item.rom > 0 ? 'positive' : 'negative'}>{item.rom}%</td>
                          <td>{item.xyz}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            )}

            
            {/* Содержимое для вкладки "РК таблица" */}
            {activeTab === 'advertising' && analyticsData.advertising && analyticsData.advertising.campaigns && (
              <div className="advertising-campaigns">
                <h2>РК таблица</h2>
                <div className="table-container"> 
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Артикул ВБ</th>
                        <th>Артикул продавца</th>
                        <th>Склейка</th>
                        <th>Показатель</th>
                        <th>Авто Расходы РК</th>
                        <th>Авто Показы</th>
                        <th>Авто CTR</th>
                        <th>Авто Клики</th>
                        <th>Авто СРС</th>
                        <th>Авто CR</th>
                        <th>Авто заказы</th>
                        <th>Авто CPO заказов</th>
                        <th>Аукцион Расходы РК</th>
                        <th>Аукцион Показы</th>
                        <th>Аукцион CTR</th>
                        <th>Аукцион Клики</th>
                        <th>Аукцион СРС</th>
                        <th>Аукцион CR</th>
                        <th>Аукцион заказы</th>
                        <th>Аукцион CPO заказов</th>
                        <th>Переходы в карточку</th>
                        <th>Корзина</th>
                        <th>Заказали</th>
                        <th>Конверсия в корзину</th>
                        <th>Конверсия в заказ</th>
                        <th>Прямая конверсия</th>
                        <th>Процент органических заказов</th>
                        <th>Маржа - CPO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.advertising.campaigns.map((campaign, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{campaign.nmId}</td>
                          <td>{campaign.vendorCode}</td>
                          <td>{campaign.cluster}</td>
                          <td>{campaign.indicator}</td>
                          <td>{campaign.autoExpenses} ₽</td>
                          <td>{campaign.autoViews}</td>
                          <td>{campaign.autoCtr}%</td>
                          <td>{campaign.autoClicks}</td>
                          <td>{campaign.autoCpc} ₽</td>
                          <td>{campaign.autoCr}%</td>
                          <td>{campaign.autoOrders}</td>
                          <td>{campaign.autoCpo} ₽</td>
                          <td>{campaign.auctionExpenses} ₽</td>
                          <td>{campaign.auctionViews}</td>
                          <td>{campaign.auctionCtr}%</td>
                          <td>{campaign.auctionClicks}</td>
                          <td>{campaign.auctionCpc} ₽</td>
                          <td>{campaign.auctionCr}%</td>
                          <td>{campaign.auctionOrders}</td>
                          <td>{campaign.auctionCpo} ₽</td>
                          <td>{campaign.cardTransitions}</td>
                          <td>{campaign.cartAdditions}</td>
                          <td>{campaign.orders}</td>
                          <td>{campaign.cartConversion}%</td>
                          <td>{campaign.orderConversion}%</td>
                          <td>{campaign.directConversion}%</td>
                          <td>{campaign.organicOrdersPercent}%</td>
                          <td className={campaign.marginCpo > 0 ? 'positive' : 'negative'}>{campaign.marginCpo} ₽</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
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
        
      </div>
    
  );
}