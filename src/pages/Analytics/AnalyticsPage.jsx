import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import axios from 'axios';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  const [viewMode, setViewMode] = useState('chart');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    financial: null,
    'unit-economics': null,
    advertising: null,
    'abc-analysis': null
  });
  const [lastFetchTime, setLastFetchTime] = useState({
    financial: 0,
    'unit-economics': 0,
    advertising: 0,
    'abc-analysis': 0
  });

  const MIN_FETCH_INTERVAL = 300000; // 5 минут в миллисекундах
  const COLORS = ['#48DD00', '#9F3ED5', '#E6399B', '#52A529', '#AD66D5'];

  // Проверка подписки и API ключа
  const checkSubscriptionAndLoadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      const subscriptionResponse = await axios.get('/api/subscription/info');
      
      if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
        setHasSubscription(true);
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const apiKeyResponse = await axios.get('/api/auth/api-key', {
          params: { email: userData.email }
        });
        
        if (apiKeyResponse.data.success && apiKeyResponse.data.hasApiKey) {
          setHasApiKey(true);
          loadAnalyticsData(activeTab);
        }
      } else {
        setHasSubscription(false);
        loadAnalyticsData(activeTab);
      }
    } catch (err) {
      console.error('Error checking requirements:', err);
      setError('Не удалось проверить наличие подписки и API ключа');
      loadAnalyticsData(activeTab);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Загрузка данных аналитики
  const loadAnalyticsData = useCallback(async (tab) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      let endpoint = `/api/analytics/${tab}`;
      
      const response = await axios.get(endpoint);
      
      if (response.data?.success) {
        setAnalyticsData(prev => ({
          ...prev,
          [tab]: response.data.data
        }));
        setLastFetchTime(prev => ({
          ...prev,
          [tab]: Date.now()
        }));
        setError(null);
      } else {
        setError(response.data?.message || 'Ошибка загрузки данных');
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Ошибка загрузки данных: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Обработчик сохранения API ключа
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setApiKeySaving(true);
    setApiKeyError('');
    setApiKeySuccess('');
    
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const userEmail = userData.email;
      
      if (!userEmail || !token) {
        setApiKeyError('Для установки API ключа необходимо авторизоваться');
        return;
      }
      
      const response = await axios.post('/api/auth/set-api-key', {
        apiKey: apiKeyInput,
        email: userEmail 
      });
      
      if (response.data.success) {
        setApiKeySuccess('API ключ успешно сохранен');
        setHasApiKey(true);
        setApiKeyInput('');
        loadAnalyticsData(activeTab);
      } else {
        setApiKeyError(response.data.message || 'Ошибка сохранения API ключа');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setApiKeyError('Ошибка сохранения API ключа');
    } finally {
      setApiKeySaving(false);
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (!analyticsData[tab] || Date.now() - lastFetchTime[tab] > MIN_FETCH_INTERVAL) {
      loadAnalyticsData(tab);
    }
  };

  // Функции для рендеринга графиков
  const renderFinancialCharts = () => {
    if (!analyticsData.financial?.weeks) return null;
    
    const data = analyticsData.financial.weeks.map(week => ({
      name: `Неделя ${week.week}`,
      sales: week.salesWb,
      profit: week.netProfit,
      logistics: week.logistics,
      storage: week.storage
    }));

    return (
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Динамика продаж и прибыли</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#48DD00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#48DD00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9F3ED5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9F3ED5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#000037', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="sales" stroke="#48DD00" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Продажи (₽)" />
              <Area type="monotone" dataKey="profit" stroke="#9F3ED5" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Прибыль (₽)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderUnitEconomicsCharts = () => {
    if (!analyticsData['unit-economics']?.items) return null;
    
    const topProducts = [...analyticsData['unit-economics'].items]
      .sort((a, b) => b.finalMarginality - a.finalMarginality)
      .slice(0, 10);
    
    const marginData = topProducts.map(item => ({
      name: item.vendorCode,
      margin: item.finalMarginality,
      profit: item.grossProfitFinal,
      roi: item.roi
    }));
    
    return (
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Топ-10 товаров по маржинальности</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#000037', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              <Bar dataKey="margin" fill="#48DD00" name="Маржинальность (%)" />
              <Bar dataKey="roi" fill="#9F3ED5" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAdvertisingCharts = () => {
    if (!analyticsData.advertising?.campaigns) return null;
    
    const data = analyticsData.advertising.campaigns.map(campaign => ({
      name: campaign.vendorCode,
      auto: campaign.autoExpenses,
      auction: campaign.auctionExpenses,
      margin: campaign.marginCpo,
      conversion: campaign.orderConversion
    }));
    
    return (
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Расходы на рекламу</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#000037', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              <Bar dataKey="auto" fill="#48DD00" name="Авто (₽)" />
              <Bar dataKey="auction" fill="#9F3ED5" name="Аукцион (₽)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderABCAnalysisCharts = () => {
    if (!analyticsData['abc-analysis']) return null;
    
    const { classA, classB, classC } = analyticsData['abc-analysis'].summary;
    const pieData = [
      { name: 'Класс A', value: classA.percent, color: '#48DD00' },
      { name: 'Класс B', value: classB.percent, color: '#9F3ED5' },
      { name: 'Класс C', value: classC.percent, color: '#E6399B' }
    ];
    
    return (
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Распределение выручки</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#000037', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  useEffect(() => {
    checkSubscriptionAndLoadData();
  }, []);

  useEffect(() => {
    if (hasSubscription || hasApiKey) {
      loadAnalyticsData(activeTab);
    }
  }, [activeTab]);

  if (loading && !hasSubscription && !hasApiKey) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="subscription-required">
            <div className="requirement-icon">⚠️</div>
            <h2 className="requirement-title">Требуется подписка</h2>
            <p className="requirement-description">
              Для доступа к аналитике необходимо оформить подписку
            </p>
            <Link to="/subscription" className="btn btn-primary">
              <span>💎</span>
              Оформить подписку
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="api-key-required">
            <div className="requirement-icon">🔑</div>
            <h2 className="requirement-title">Требуется API ключ Wildberries</h2>
            <p className="requirement-description">
              Для доступа к аналитике необходимо указать API ключ вашего кабинета Wildberries.
            </p>
            
            <form onSubmit={handleSaveApiKey} className="api-key-form">
              {apiKeyError && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {apiKeyError}
                </div>
              )}
              {apiKeySuccess && (
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  {apiKeySuccess}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="apiKey" className="form-label">API ключ Wildberries</label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="form-input"
                  placeholder="Введите ваш API ключ Wildberries"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={apiKeySaving}
              >
                {apiKeySaving ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Сохранить API ключ
                  </>
                )}
              </button>
            </form>
            
            <div className="api-key-help">
              <p>
                Для получения API ключа перейдите в{' '}
                <a 
                  href="https://seller.wildberries.ru/supplier-settings/access-to-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  кабинет продавца Wildberries
                </a>
                {' '}и создайте новый ключ.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Ошибка загрузки данных</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => loadAnalyticsData(activeTab)}
            >
              <span>🔄</span>
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="container">
        {/* Заголовок */}
        <div className="analytics-header">
          <div className="header-text">
            <h1 className="page-title">
              <span className="title-icon">📊</span>
              Wilberis Analytics
            </h1>
            <p className="page-subtitle">
              Комплексная аналитика ваших продаж на Wildberries
            </p>
          </div>
          
          <div className="header-controls">
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'chart' ? 'view-mode-btn-active' : ''}`}
                onClick={() => setViewMode('chart')}
              >
                <span className="view-icon">📊</span>
                График
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'table' ? 'view-mode-btn-active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <span className="view-icon">📋</span>
                Таблица
              </button>
            </div>
            
            <button className="refresh-btn" onClick={() => loadAnalyticsData(activeTab)}>
              <span className="refresh-icon">🔄</span>
              Обновить
            </button>
          </div>
        </div>

        {/* Табы */}
        <div className="analytics-tabs">
          <button 
            className={`tab-button ${activeTab === 'financial' ? 'tab-button-active' : ''}`}
            onClick={() => handleTabChange('financial')}
          >
            <span className="tab-icon">💰</span>
            Финансовый отчет
          </button>
          <button 
            className={`tab-button ${activeTab === 'unit-economics' ? 'tab-button-active' : ''}`}
            onClick={() => handleTabChange('unit-economics')}
          >
            <span className="tab-icon">🧮</span>
            Юнит экономика
          </button>
          <button 
            className={`tab-button ${activeTab === 'advertising' ? 'tab-button-active' : ''}`}
            onClick={() => handleTabChange('advertising')}
          >
            <span className="tab-icon">📢</span>
            Рекламные кампании
          </button>
          <button 
            className={`tab-button ${activeTab === 'abc-analysis' ? 'tab-button-active' : ''}`}
            onClick={() => handleTabChange('abc-analysis')}
          >
            <span className="tab-icon">📋</span>
            ABC-анализ
          </button>
        </div>
        
        {/* Контент */}
        <div className="analytics-content">
          {viewMode === 'chart' ? (
            <>
              {activeTab === 'financial' && renderFinancialCharts()}
              {activeTab === 'unit-economics' && renderUnitEconomicsCharts()}
              {activeTab === 'advertising' && renderAdvertisingCharts()}
              {activeTab === 'abc-analysis' && renderABCAnalysisCharts()}
            </>
          ) : (
            <div className="table-view">
              <p className="table-placeholder">
                Табличный режим будет добавлен в следующих обновлениях
              </p>
            </div>
          )}
          
          {!analyticsData[activeTab] && !loading && (
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h3>Данные отсутствуют</h3>
              <p>Данные для раздела "{activeTab}" не найдены или загружаются</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;