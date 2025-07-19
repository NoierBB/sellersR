// 'use client';

// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Calendar, TrendingUp, DollarSign, Package, BarChart3, Activity, Settings, Download, Bell } from 'lucide-react';
// import { format, subDays } from 'date-fns';

// // Import chart components
// import ROIAnalysisChart from '../../components/analytics/ROIAnalysisChart';
// import SalesTimelineChart from '../../components/analytics/SalesTimelineChart';
// import ProfitabilityChart from '../../components/analytics/ProfitabilityChart';
// import PromotionEfficiencyChart from '../../components/analytics/PromotionEfficiencyChart';
// import AdvertisingPerformanceChart from '../../components/analytics/AdvertisingPerformanceChart';
// import StockLevelsChart from '../../components/analytics/StockLevelsChart';

// // Import new components
// import SmartAlerts from '../../components/SmartAlerts';
// import ExportReports from '../../components/ExportReports';
// import DashboardCustomizer from '../../components/DashboardCustomizer';
// import { useRealTimeData } from '../../hooks/useRealTimeData';

// const AnalyticsDashboard = () => {
//   const [selectedPeriod, setSelectedPeriod] = useState('30d');
//   const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
//   const [isExportOpen, setIsExportOpen] = useState(false);
//   const [dashboardWidgets, setDashboardWidgets] = useState([
//     { id: 'roi-analysis', title: 'ROI Анализ', description: 'Анализ рентабельности', enabled: true, size: 'large' },
//     { id: 'sales-timeline', title: 'График Продаж', description: 'Динамика продаж', enabled: true, size: 'medium' },
//     { id: 'profitability', title: 'Прибыльность', description: 'Анализ прибыльности', enabled: true, size: 'medium' },
//     { id: 'promotion-efficiency', title: 'Эффективность промо', description: 'Промо-акции', enabled: true, size: 'large' },
//     { id: 'advertising-performance', title: 'Реклама', description: 'Эффективность рекламы', enabled: true, size: 'large' },
//     { id: 'stock-levels', title: 'Остатки', description: 'Уровни запасов', enabled: true, size: 'medium' }
//   ]);

//   // Real-time data with auto-update every 15 minutes
//   const { data, isLoading, error, lastUpdate, refresh } = useRealTimeData({
//     endpoint: 'http://localhost:8080/api/enhanced-analytics/dashboard-data',
//     interval: 15 * 60 * 1000, // 15 minutes
//     enabled: true,
//     onUpdate: (newData) => {
//       console.log('Данные обновлены:', newData);
//     },
//     onError: (error) => {
//       console.error('Ошибка обновления:', error);
//     }
//   });

//   const getGridClass = (size) => {
//     switch (size) {
//       case 'small': return '';
//       case 'medium': return '';
//       case 'large': return 'lg:col-span-2';
//       default: return '';
//     }
//   };

//   const renderWidget = (widgetId, widget) => {
//     const commonProps = { 
//       key: widgetId,
//       className: getGridClass(widget.size)
//     };

//     switch (widgetId) {
//       case 'roi-analysis':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             {...commonProps}
//           >
//             <ROIAnalysisChart data={data?.unitEconomics || []} period={selectedPeriod} />
//           </motion.div>
//         );
//       case 'sales-timeline':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             {...commonProps}
//           >
//             <SalesTimelineChart data={data?.weeklyReports || []} period={selectedPeriod} />
//           </motion.div>
//         );
//       case 'profitability':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//             {...commonProps}
//           >
//             <ProfitabilityChart data={data?.unitEconomics || []} />
//           </motion.div>
//         );
//       case 'promotion-efficiency':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4 }}
//             {...commonProps}
//           >
//             <PromotionEfficiencyChart data={data?.profitablePromotions || []} />
//           </motion.div>
//         );
//       case 'advertising-performance':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5 }}
//             {...commonProps}
//           >
//             <AdvertisingPerformanceChart data={data?.weeklyReports || []} period={selectedPeriod} />
//           </motion.div>
//         );
//       case 'stock-levels':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.6 }}
//             {...commonProps}
//           >
//             <StockLevelsChart data={data?.criticalStock || []} />
//           </motion.div>
//         );
//       default:
//         return null;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
//       {/* Header with functions */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="mb-8"
//       >
//         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-900 mb-2">
//               📊 Умная Аналитика
//             </h1>
//             <p className="text-gray-600">
//               Real-time анализ с Smart-алертами и экспортом отчетов
//             </p>
//             {data?.seller && (
//               <p className="text-sm text-gray-500 mt-1">
//                 Продавец: {data.seller.name} • Последнее обновление: {lastUpdate?.toLocaleTimeString('ru-RU') || 'Загрузка...'}
//               </p>
//             )}
//           </div>

//           {/* Functional buttons */}
//           <div className="flex items-center gap-3 mt-4 lg:mt-0">
//             <button
//               onClick={() => setIsExportOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               <span>Экспорт</span>
//             </button>
            
//             <button
//               onClick={() => setIsCustomizerOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg transition-colors"
//             >
//               <Settings className="w-4 h-4" />
//               <span>Настройка</span>
//             </button>
            
//             <button
//               onClick={refresh}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors"
//             >
//               <TrendingUp className="w-4 h-4" />
//               <span>Обновить</span>
//             </button>
//           </div>
//         </div>

//         {/* Period selector */}
//         <div className="flex flex-wrap gap-2">
//           {['7d', '30d', '90d', '365d'].map((period) => (
//             <button
//               key={period}
//               onClick={() => setSelectedPeriod(period)}
//               className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                 selectedPeriod === period
//                   ? 'bg-blue-600 text-white shadow-lg'
//                   : 'bg-white text-gray-600 hover:bg-blue-50'
//               }`}
//             >
//               {period === '7d' ? '7 дней' : 
//                period === '30d' ? '30 дней' : 
//                period === '90d' ? '3 месяца' : '1 год'}
//             </button>
//           ))}
//         </div>
//       </motion.div>

//       {/* Charts grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//         {dashboardWidgets
//           .filter(widget => widget.enabled)
//           .map(widget => renderWidget(widget.id, widget))}
//       </div>

//       {/* Summary statistics */}
//       {data?.summary && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 1.0 }}
//           className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
//         >
//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center gap-3 mb-2">
//               <DollarSign className="w-6 h-6 text-green-600" />
//               <span className="text-gray-600">Общая прибыль</span>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">
//               {data.summary.totalNetProfit?.toLocaleString('ru-RU')} ₽
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center gap-3 mb-2">
//               <Activity className="w-6 h-6 text-purple-600" />
//               <span className="text-gray-600">Затраты на рекламу</span>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">
//               {data.summary.totalAdCalculation?.toLocaleString('ru-RU')} ₽
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center gap-3 mb-2">
//               <BarChart3 className="w-6 h-6 text-blue-600" />
//               <span className="text-gray-600">Средний расчет</span>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">
//               {data.summary.averageCalculation?.toLocaleString('ru-RU')} ₽
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center gap-3 mb-2">
//               <Package className="w-6 h-6 text-orange-600" />
//               <span className="text-gray-600">Потребность (30 дней)</span>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">
//               {data.summary.totalDemand30Days?.toLocaleString('ru-RU')} шт
//             </p>
//           </div>
//         </motion.div>
//       )}

//       {/* Smart Alerts */}
//       <SmartAlerts />

//       {/* Modal windows */}
//       <DashboardCustomizer
//         isOpen={isCustomizerOpen}
//         onClose={() => setIsCustomizerOpen(false)}
//         onSave={(widgets) => {
//           setDashboardWidgets(widgets);
//           // Here you can save settings to localStorage
//           localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
//         }}
//       />

//       {isExportOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-bold">Экспорт Отчетов</h2>
//                 <button
//                   onClick={() => setIsExportOpen(false)}
//                   className="p-2 text-gray-400 hover:text-gray-600"
//                 >
//                   ✕
//                 </button>
//               </div>
//             </div>
//             <div className="p-4">
//               <ExportReports />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Analitic;