import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Автоматическая смена фич
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'Продвинутая аналитика',
      description: 'Получайте детальные отчеты о продажах, прибыли и эффективности ваших товаров на Wildberries в реальном времени.',
      gradient: 'var(--gradient-primary)',
      color: 'var(--color-primary-green)'
    },
    {
      icon: '🚀',
      title: 'Автоматизация процессов',
      description: 'Используйте 5 стратегий автобиддера для управления CPM и занимайте лучшие позиции с минимальными затратами.',
      gradient: 'var(--gradient-purple)',
      color: 'var(--color-primary-purple)'
    },
    {
      icon: '💎',
      title: 'Управление ключами',
      description: 'Автоминусация фраз и работа по "белому списку" ключей. Полный автопилот для управления кластерами.',
      gradient: 'var(--gradient-pink)',
      color: 'var(--color-primary-pink)'
    },
    {
      icon: '⚡',
      title: 'Быстрая синхронизация',
      description: 'Мгновенная синхронизация данных с API Wildberries. Всегда актуальная информация о ваших продажах.',
      gradient: 'var(--gradient-secondary)',
      color: 'var(--color-secondary-green)'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Активных пользователей', icon: '👥' },
    { value: '50M+', label: 'Проанализированных продаж', icon: '💰' },
    { value: '99.9%', label: 'Время работы', icon: '⚡' },
    { value: '24/7', label: 'Поддержка', icon: '🛠️' }
  ];

  return (
    <div className="home-page">
      {/* Hero секция */}
      <section className={`hero ${isVisible ? 'hero-visible' : ''}`}>
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`particle particle-${i}`}></div>
            ))}
          </div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="text-gradient">SellLab</span>
                <br />
                Профессиональная аналитика для 
                <span className="text-gradient-purple"> Wildberries</span>
              </h1>
              
              <p className="hero-description">
                Увеличьте продажи и прибыль с помощью умной аналитики, 
                автоматизации рекламы и профессиональных инструментов 
                для продавцов маркетплейса Wildberries.
              </p>
              
              <div className="hero-buttons">
                <Link to="/subscription" className="btn btn-primary">
                  <span>Начать бесплатно</span>
                  <span className="btn-icon">🚀</span>
                </Link>
                <Link to="/about" className="btn btn-outline">
                  <span>Узнать больше</span>
                  <span className="btn-icon">ℹ️</span>
                </Link>
              </div>
              
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <span className="stat-icon">{stat.icon}</span>
                    <div className="stat-content">
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="dashboard-preview">
                <div className="dashboard-header">
                  <div className="dashboard-controls">
                    <div className="control control-red"></div>
                    <div className="control control-yellow"></div>
                    <div className="control control-green"></div>
                  </div>
                  <div className="dashboard-title">SellLab Analytics</div>
                </div>
                
                <div className="dashboard-content">
                  <div className="metric-cards">
                    <div className="metric-card">
                      <div className="metric-icon">💰</div>
                      <div className="metric-value">₽156,273</div>
                      <div className="metric-label">Выручка</div>
                      <div className="metric-change positive">+12.5%</div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon">📦</div>
                      <div className="metric-value">1,247</div>
                      <div className="metric-label">Заказы</div>
                      <div className="metric-change positive">+8.3%</div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon">📈</div>
                      <div className="metric-value">67.3%</div>
                      <div className="metric-label">Конверсия</div>
                      <div className="metric-change positive">+2.1%</div>
                    </div>
                  </div>
                  
                  <div className="chart-preview">
                    <div className="chart-line">
                      <svg viewBox="0 0 300 100" className="chart-svg">
                        <defs>
                          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--color-primary-green)" />
                            <stop offset="50%" stopColor="var(--color-primary-purple)" />
                            <stop offset="100%" stopColor="var(--color-primary-pink)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,80 Q75,20 150,40 T300,30"
                          stroke="url(#chartGrad)"
                          strokeWidth="3"
                          fill="none"
                          className="chart-path"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция фич */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Почему выбирают <span className="text-gradient">SellLab</span>?
            </h2>
            <p className="section-description">
              Современные инструменты для максимизации прибыли на Wildberries
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card ${index === currentFeature ? 'feature-card-active' : ''}`}
                style={{ '--feature-color': feature.color }}
              >
                <div className="feature-icon" style={{ background: feature.gradient }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-gradient" style={{ background: feature.gradient }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA секция */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2 className="cta-title">
                Готовы увеличить продажи на 
                <span className="text-gradient-pink"> 300%</span>?
              </h2>
              <p className="cta-description">
                Присоединяйтесь к тысячам успешных продавцов, которые уже используют SellLab 
                для максимизации прибыли на Wildberries.
              </p>
            </div>
            
            <div className="cta-action">
              <Link to="/subscription" className="btn btn-cta">
                <span>Начать сейчас</span>
                <span className="btn-arrow">→</span>
              </Link>
              <p className="cta-note">
                Бесплатный пробный период • Без обязательств • Отмена в любой момент
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;