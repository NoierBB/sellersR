import './Analytics.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faInfoCircle, 
  faExclamationTriangle, 
  faCheckCircle, 
  faTable, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const MIN_FETCH_INTERVAL = 300000; // 5 минут в миллисекундах

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
    'unit-economics': null,
    advertising: null,
    'abc-analysis': null
  });
  const [viewMode, setViewMode] = useState('table');
  const [lastFetchTime, setLastFetchTime] = useState({
    financial: 0,
    'unit-economics': 0,
    advertising: 0,
    'abc-analysis': 0
  });

  const API_BASE_URL = 'http://localhost:8080/api';

  // Проверка подписки и API ключа
  const checkSubscriptionAndLoadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Для доступа к аналитике необходимо авторизоваться');
        setLoading(false);
        return;
      }
      
      const subscriptionResponse = await axios.get(`${API_BASE_URL}/subscription/info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
        setHasSubscription(true);
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const apiKeyResponse = await axios.get(`${API_BASE_URL}/auth/api-key`, {
          params: { email: userData.email },
          headers: { 'Authorization': `Bearer ${token}` }
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
      
      let endpoint = `${API_BASE_URL}/analytics/${tab}`;
      
      const response = await axios.get(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
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
      
      const response = await axios.post(`${API_BASE_URL}/auth/set-api-key`, {
        apiKey: apiKeyInput,
        email: userEmail 
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
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
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Продажи (₽)" />
              <Bar dataKey="profit" fill="#82ca9d" name="Прибыль (₽)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Расходы по неделям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="logistics" stroke="#ff7300" name="Логистика (₽)" />
              <Line type="monotone" dataKey="storage" stroke="#387908" name="Хранение (₽)" />
            </LineChart>
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="margin" fill="#8884d8" name="Маржинальность (%)" />
              <Bar dataKey="roi" fill="#82ca9d" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Прибыль по товарам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis type="number" dataKey="margin" name="Маржинальность" unit="%" />
              <YAxis type="number" dataKey="profit" name="Прибыль" unit="₽" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Товары" data={marginData} fill="#8884d8" />
            </ScatterChart>
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="auto" fill="#8884d8" name="Авто (₽)" />
              <Bar dataKey="auction" fill="#82ca9d" name="Аукцион (₽)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Маржа и конверсия</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="margin" stroke="#ff7300" name="Маржа (₽)" />
              <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#387908" name="Конверсия (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderABCAnalysisCharts = () => {
    if (!analyticsData['abc-analysis']) return null;
    
    const { classA, classB, classC } = analyticsData['abc-analysis'].summary;
    const pieData = [
      { name: 'Класс A', value: classA.percent },
      { name: 'Класс B', value: classB.percent },
      { name: 'Класс C', value: classC.percent }
    ];
    
    const topItems = analyticsData['abc-analysis'].items
      .filter(item => item.classTotal === 'A')
      .slice(0, 10);
    
    const barData = topItems.map(item => ({
      name: item.vendorCode,
      revenue: item.revenue,
      orders: item.ordersCount
    }));
    
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Топ-10 товаров класса A</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Выручка (₽)" />
              <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Заказы (шт)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Рендер таблиц
  const renderFinancialTable = () => (
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
              <td className={analyticsData.financial.totals.totalNetProfit > 0 ? 'positive' : 'negative'}>
                {analyticsData.financial.totals.totalNetProfit} ₽
              </td>
              <td>{analyticsData.financial.totals.avgDrr}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

     const renderUnitEconomicsTable = () => (
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
  );

  const renderAdvertisingTable = () => (
    <div className="advertising-campaigns">
      <h2>Рекламные кампании</h2>
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
  );

  const renderABCAnalysisTable = () => (
    <div className="abc-analysis">
      <h2>ABC-анализ товаров</h2>
      
      <div className="summary">
        <h3>Общая статистика</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="class-a">Класс A</span>
            <span>{analyticsData['abc-analysis'].summary.classA.count} товаров</span>
            <span>{analyticsData['abc-analysis'].summary.classA.percent}% выручки</span>
          </div>
          <div className="summary-item">
            <span className="class-b">Класс B</span>
            <span>{analyticsData['abc-analysis'].summary.classB.count} товаров</span>
            <span>{analyticsData['abc-analysis'].summary.classB.percent}% выручки</span>
          </div>
          <div className="summary-item">
            <span className="class-c">Класс C</span>
            <span>{analyticsData['abc-analysis'].summary.classC.count} товаров</span>
            <span>{analyticsData['abc-analysis'].summary.classC.percent}% выручки</span>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Поз.</th>
                <th>Артикул</th>
                <th>Номенклатура</th>
                <th>Предмет</th>
                <th>Заказы</th>
                <th>Ср. цена</th>
                <th>Выручка</th>
                <th>% группы</th>
                <th>Класс (группа)</th>
                <th>% общий</th>
                <th>Класс (общий)</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData['abc-analysis'].items.map((item, index) => (
                <tr key={index}>
                  <td>{item.position}</td>
                  <td>{item.nmId}</td>
                  <td>{item.vendorCode}</td>
                  <td>{item.subject}</td>
                  <td>{item.ordersCount}</td>
                  <td>{item.avgPrice.toFixed(2)} ₽</td>
                  <td>{item.revenue.toFixed(2)} ₽</td>
                  <td>{item.revenuePercentInGroup.toFixed(1)}%</td>
                  <td className={`class-${item.classInGroup.toLowerCase()}`}>
                    {item.classInGroup}
                  </td>
                  <td>{item.revenuePercentTotal.toFixed(1)}%</td>
                  <td className={`class-${item.classTotal.toLowerCase()}`}>
                    {item.classTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  // Остальные функции render...Table() аналогично

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
      <div className="analytics-page loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="analytics-page">
        <h1>Аналитика</h1>
        <div className="subscription-required">
          <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
          <h2>Требуется подписка</h2>
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

  if (error) {
    return (
      <div className="analytics-page">
        <h1>Аналитика</h1>
        <div className="error-container">
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
      
      <div className="analytics-header">
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
            Юнит экономика
          </button>
          <button 
            className={`tab-button ${activeTab === 'advertising' ? 'active' : ''}`}
            onClick={() => handleTabChange('advertising')}
          >
            Рекламные кампании
          </button>
          <button 
            className={`tab-button ${activeTab === 'abc-analysis' ? 'active' : ''}`}
            onClick={() => handleTabChange('abc-analysis')}
          >
            ABC-анализ
          </button>
        </div>
        
        <div className="view-mode-toggle">
          <button
            className={`view-mode-button ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Таблица"
          >
            <FontAwesomeIcon icon={faTable} /> Таблица
          </button>
          <button
            className={`view-mode-button ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
            title="График"
          >
            <FontAwesomeIcon icon={faChartLine} /> График
          </button>
        </div>
      </div>
      
      <div className="analytics-content">
        {viewMode === 'table' ? (
          <>
            {activeTab === 'financial' && analyticsData.financial && renderFinancialTable()}
            {activeTab === 'unit-economics' && analyticsData['unit-economics'] && renderUnitEconomicsTable()}
            {activeTab === 'advertising' && analyticsData.advertising && renderAdvertisingTable()}
            {activeTab === 'abc-analysis' && analyticsData['abc-analysis'] && renderABCAnalysisTable()}
          </>
        ) : (
          <>
            {activeTab === 'financial' && renderFinancialCharts()}
            {activeTab === 'unit-economics' && renderUnitEconomicsCharts()}
            {activeTab === 'advertising' && renderAdvertisingCharts()}
            {activeTab === 'abc-analysis' && renderABCAnalysisCharts()}
          </>
        )}
        
        {!analyticsData[activeTab] && (
          <div className="no-data">
            <FontAwesomeIcon icon={faInfoCircle} />
            <p>Данные отсутствуют или загружаются</p>
          </div>
        )}
      </div>
    </div>
  );
}