import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faTable, faChartBar, faBoxes, faPercent, faTag, faTruckLoading } from '@fortawesome/free-solid-svg-icons';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('financial');
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasKey: false, key: '' });
  const [newApiKey, setNewApiKey] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);

  const API_BASE_URL = 'http://localhost:8080/api';

  useEffect(() => {
    checkApiKey();
    getSubscriptionInfo();
  }, []);

  useEffect(() => {
    if (apiKeyStatus.hasKey) {
      fetchData(activeTab);
    }
  }, [activeTab, period, apiKeyStatus.hasKey]);

  const checkApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/auth/api-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setApiKeyStatus({
          hasKey: response.data.hasApiKey,
          key: response.data.apiKey
        });
      }
    } catch (err) {
      console.error('Error checking API key:', err);
    }
  };

  const getSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/subscription/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscriptionInfo(response.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription info:', err);
    }
  };

  const fetchData = async (tab) => {
    if (!apiKeyStatus.hasKey || !subscriptionInfo?.isActive) return;

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch (tab) {
        case 'financial':
          endpoint = `/excel-analytics/financial-table?days=${period}`;
          break;
        case 'abc':
          endpoint = `/excel-analytics/abc-analysis-enhanced?days=${period}`;
          break;
        case 'supply':
          endpoint = `/excel-analytics/supply-planning?days=${period}`;
          break;
        case 'promotions':
          endpoint = `/excel-analytics/promotions-tracking?days=${period}`;
          break;
        default:
          endpoint = `/excel-analytics/financial-table?days=${period}`;
      }
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data);
      } else {
        setError(response.data.message || 'Ошибка получения данных');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/auth/set-api-key`,
        { apiKey: newApiKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setApiKeyStatus({
          hasKey: true,
          key: newApiKey
        });
        setShowApiKeyForm(false);
        setNewApiKey('');
        fetchData(activeTab);
      } else {
        setError(response.data.message || 'Ошибка установки API ключа');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при установке API ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/auth/api-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setApiKeyStatus({
          hasKey: false,
          key: ''
        });
        setData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при удалении API ключа');
    }
  };

  const renderNoSubscriptionMessage = () => (
    <div className="no-subscription">
      <h3>Требуется подписка</h3>
      <p>Для доступа к аналитике необходима активная подписка.</p>
      <button 
        className="primary-button" 
        onClick={() => window.location.href = '/subscription'}
      >
        Оформить подписку
      </button>
    </div>
  );

  const renderApiKeyForm = () => (
    <div className="api-key-form">
      <h3>Добавьте API ключ Wildberries</h3>
      <p>Для получения аналитики необходимо добавить API ключ от вашего кабинета Wildberries</p>
      
      {showApiKeyForm ? (
        <form onSubmit={handleApiKeySubmit}>
          <div className="form-group">
            <label htmlFor="apiKey">API ключ Wildberries</label>
            <input
              type="text"
              id="apiKey"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Введите ваш API ключ"
              required
            />
          </div>
          <button 
            type="submit" 
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button 
            type="button" 
            className="secondary-button"
            onClick={() => setShowApiKeyForm(false)}
          >
            Отмена
          </button>
        </form>
      ) : (
        <button 
          className="primary-button" 
          onClick={() => setShowApiKeyForm(true)}
        >
          Добавить API ключ
        </button>
      )}
    </div>
  );

  const renderFinancialTable = () => {
    if (!data || !data.data) return <p>Нет данных для отображения</p>;
    
    return (
      <div className="financial-table">
        <div className="summary-box">
          <h3>Сводка</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Всего заказов:</span>
              <span className="value">{data.summary.totalOrders}</span>
            </div>
            <div className="summary-item">
              <span className="label">Всего продаж:</span>
              <span className="value">{data.summary.totalSales}</span>
            </div>
            <div className="summary-item">
              <span className="label">Общая выручка:</span>
              <span className="value">{data.summary.totalPayment?.toLocaleString()} ₽</span>
            </div>
            <div className="summary-item">
              <span className="label">Логистика:</span>
              <span className="value">{data.summary.totalLogistics?.toLocaleString()} ₽</span>
            </div>
            <div className="summary-item">
              <span className="label">Чистая прибыль:</span>
              <span className="value">{data.summary.totalNetProfit?.toLocaleString()} ₽</span>
            </div>
            <div className="summary-item">
              <span className="label">Средняя маржа:</span>
              <span className="value">{data.summary.averageMargin?.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Артикул WB</th>
                <th>Артикул поставщика</th>
                <th>Заказы</th>
                <th>Продажи</th>
                <th>Выручка</th>
                <th>Логистика</th>
                <th>Чистая прибыль</th>
                <th>Маржа</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index}>
                  <td>{item.wbArticle}</td>
                  <td>{item.supplierArticle}</td>
                  <td>{item.orders}</td>
                  <td>{item.sales}</td>
                  <td>{item.payment?.toLocaleString()} ₽</td>
                  <td>{item.logistics?.toLocaleString()} ₽</td>
                  <td>{item.netProfit?.toLocaleString()} ₽</td>
                  <td>{item.profitMargin?.toFixed(2)}%</td>
                  <td>{item.roi?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAbcAnalysis = () => {
    if (!data || !data.data) return <p>Нет данных для отображения</p>;
    
    return (
      <div className="abc-analysis">
        <div className="summary-box">
          <h3>Сводка ABC-анализа</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Общая выручка:</span>
              <span className="value">{data.summary.totalRevenue?.toLocaleString()} ₽</span>
            </div>
            <div className="summary-item">
              <span className="label">Категория A:</span>
              <span className="value">{data.summary.categoryA.productsCount} товаров ({data.summary.categoryA.percent?.toFixed(2)}%)</span>
            </div>
            <div className="summary-item">
              <span className="label">Категория B:</span>
              <span className="value">{data.summary.categoryB.productsCount} товаров ({data.summary.categoryB.percent?.toFixed(2)}%)</span>
            </div>
            <div className="summary-item">
              <span className="label">Категория C:</span>
              <span className="value">{data.summary.categoryC.productsCount} товаров ({data.summary.categoryC.percent?.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
        
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Кластер</th>
                <th>Выручка</th>
                <th>Доля выручки</th>
                <th>Накопленный %</th>
                <th>Категория ABC</th>
                <th>Коэф. отклонения</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index}>
                  <td>{item.cluster}</td>
                  <td>{item.revenue?.toLocaleString()} ₽</td>
                  <td>{item.revenuePercent?.toFixed(2)}%</td>
                  <td>{item.cumulativePercent?.toFixed(2)}%</td>
                  <td>{item.abcCategory}</td>
                  <td>{item.deviationCoeff?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSupplyPlanning = () => {
    if (!data || !data.data) return <p>Нет данных для отображения</p>;
    
    return (
      <div className="supply-planning">
        <div className="summary-box">
          <h3>План поставок</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Всего товаров:</span>
              <span className="value">{data.summary.totalProducts}</span>
            </div>
            <div className="summary-item">
              <span className="label">Критический запас:</span>
              <span className="value">{data.summary.criticalStock}</span>
            </div>
            <div className="summary-item">
              <span className="label">Низкий запас:</span>
              <span className="value">{data.summary.lowStock}</span>
            </div>
            <div className="summary-item">
              <span className="label">Нормальный запас:</span>
              <span className="value">{data.summary.normalStock}</span>
            </div>
            <div className="summary-item">
              <span className="label">Всего к заказу:</span>
              <span className="value">{data.summary.totalOrderNeed}</span>
            </div>
          </div>
        </div>
        
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Артикул WB</th>
                <th>Артикул поставщика</th>
                <th>Название</th>
                <th>Текущий запас</th>
                <th>Заказов в день</th>
                <th>Осталось дней</th>
                <th>План дней</th>
                <th>Нужно заказать</th>
                <th>Коэф. сезонности</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index} className={`status-${item.status.toLowerCase()}`}>
                  <td>{item.wbArticle}</td>
                  <td>{item.supplierArticle}</td>
                  <td>{item.productName}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.ordersPerDay?.toFixed(2)}</td>
                  <td>{item.daysLeft}</td>
                  <td>{item.planDays}</td>
                  <td>{item.orderNeed}</td>
                  <td>{item.seasonalityCoeff?.toFixed(2)}</td>
                  <td>{item.status === 'CRITICAL' ? 'Критический' : 
                       item.status === 'LOW' ? 'Низкий' : 'Нормальный'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPromotionsTracking = () => {
    if (!data || !data.data) return <p>Нет данных для отображения</p>;
    
    return (
      <div className="promotions-tracking">
        <div className="summary-box">
          <h3>Учет акций</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Всего акций:</span>
              <span className="value">{data.summary.totalPromotions}</span>
            </div>
            <div className="summary-item">
              <span className="label">Средняя скидка:</span>
              <span className="value">{data.summary.averageDiscount?.toFixed(2)}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Общая прибыль:</span>
              <span className="value">{data.summary.totalProfit?.toLocaleString()} ₽</span>
            </div>
            <div className="summary-item">
              <span className="label">Прибыль с акций:</span>
              <span className="value">{data.summary.totalPromotionProfit?.toLocaleString()} ₽</span>
            </div>
          </div>
        </div>
        
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Артикул WB</th>
                <th>Артикул поставщика</th>
                <th>Группа</th>
                <th>ABC</th>
                <th>Текущая цена</th>
                <th>Валовая прибыль</th>
                <th>Акция</th>
                <th>Цена по акции</th>
                <th>Прибыль по акции</th>
                <th>Оборачиваемость</th>
                <th>Остаток WB</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index}>
                  <td>{item.wbArticle}</td>
                  <td>{item.supplierArticle}</td>
                  <td>{item.grouping}</td>
                  <td>{item.abcAnalysis}</td>
                  <td>{item.currentPrice?.toLocaleString()} ₽</td>
                  <td>{item.grossProfit?.toLocaleString()} ₽</td>
                  <td>{item.action}</td>
                  <td>{item.promotionPrice?.toLocaleString()} ₽</td>
                  <td>{item.promotionProfit?.toLocaleString()} ₽</td>
                  <td>{item.turnoverDays}</td>
                  <td>{item.wbStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!subscriptionInfo?.isActive) {
      return renderNoSubscriptionMessage();
    }
    
    if (!apiKeyStatus.hasKey) {
      return renderApiKeyForm();
    }
    
    if (loading) {
      return <div className="loading">Загрузка данных...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    switch (activeTab) {
      case 'financial':
        return renderFinancialTable();
      case 'abc':
        return renderAbcAnalysis();
      case 'supply':
        return renderSupplyPlanning();
      case 'promotions':
        return renderPromotionsTracking();
      default:
        return <p>Выберите тип отчета</p>;
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Аналитика Wildberries</h1>
        
        {apiKeyStatus.hasKey && (
          <div className="api-key-status">
            <span>API ключ: {apiKeyStatus.key.substring(0, 10)}...</span>
            <button 
              className="remove-api-btn" 
              onClick={handleRemoveApiKey}
            >
              Удалить ключ
            </button>
          </div>
        )}
        
        {subscriptionInfo?.isActive && (
          <div className="subscription-info">
            <span>Подписка: {subscriptionInfo.planName}</span>
            <span>Статус: {subscriptionInfo.status}</span>
            <span>Осталось дней: {subscriptionInfo.daysLeft}</span>
          </div>
        )}
      </div>
      
      {apiKeyStatus.hasKey && subscriptionInfo?.isActive && (
        <>
          <div className="analytics-tabs">
            <button 
              className={activeTab === 'financial' ? 'active' : ''} 
              onClick={() => setActiveTab('financial')}
            >
              <FontAwesomeIcon icon={faTable} /> Финансовая таблица
            </button>
            <button 
              className={activeTab === 'abc' ? 'active' : ''} 
              onClick={() => setActiveTab('abc')}
            >
              <FontAwesomeIcon icon={faChartBar} /> ABC-анализ
            </button>
            <button 
              className={activeTab === 'supply' ? 'active' : ''} 
              onClick={() => setActiveTab('supply')}
            >
              <FontAwesomeIcon icon={faTruckLoading} /> План поставок
            </button>
            <button 
              className={activeTab === 'promotions' ? 'active' : ''} 
              onClick={() => setActiveTab('promotions')}
            >
              <FontAwesomeIcon icon={faTag} /> Учет акций
            </button>
          </div>
          
          <div className="period-selector">
            <label>Период анализа:</label>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
              <option value={60}>60 дней</option>
              <option value={90}>90 дней</option>
            </select>
          </div>
        </>
      )}
      
      <div className="analytics-content">
        {renderContent()}
      </div>
    </div>
  );
}