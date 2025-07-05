import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './AboutPage.css';

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const sectionRef = useRef(null);
  const teamRef = useRef(null);
  const featuresRef = useRef(null);

  // useEffect(() => {
  //   // Анимация для основного блока
  //   gsap.from(sectionRef.current.children, {
  //     opacity: 0,
  //     y: 50,
  //     duration: 1,
  //     stagger: 0.2,
  //     ease: "power3.out",
  //     scrollTrigger: {
  //       trigger: sectionRef.current,
  //       start: "top 80%",
  //     }
  //   });

    // Анимация для команды
  //   gsap.from(teamRef.current.children, {
  //     opacity: 0,
  //     x: -50,
  //     duration: 0.8,
  //     stagger: 0.15,
  //     ease: "back.out(1.7)",
  //     scrollTrigger: {
  //       trigger: teamRef.current,
  //       start: "top 70%",
  //     }
  //   });

  //   // Анимация для фичей
  //   gsap.from(featuresRef.current.children, {
  //     opacity: 0,
  //     y: 30,
  //     duration: 0.7,
  //     stagger: 0.1,
  //     ease: "elastic.out(1, 0.5)",
  //     scrollTrigger: {
  //       trigger: featuresRef.current,
  //       start: "top 80%",
  //     }
    // });
  // }, []);

  return (
    <div className="about-container">
      {/* Основной блок */}
      <section ref={sectionRef} className="about-section">
        <h1>Команда разработчиков проекта Sellex</h1>
        <p className="lead">
          Sellex — это уникальная платформа, не имеющая аналогов на рынке, созданная для комплексной поддержки продавцов на Wildberries.
        </p>
        <p>
          Наш проект объединяет передовые технологии, мощные аналитические инструменты и эксклюзивные обучающие материалы, предоставляя пользователям беспрецедентные возможности для роста продаж.
        </p>
        <p>
          В отличие от других решений, Sellex предлагает полностью автоматизированную систему, которая не просто анализирует данные, а дает четкие рекомендации по увеличению прибыли.
        </p>
      </section>

      {/* Блок команды */}
      <section ref={teamRef} className="team-section">
        <h2>Наша команда:</h2>
        
        <div className="team-member">
          <span className="member-icon">🛍</span>
          <div>
            <h3>Дмитрий — фронтенд-разработчик</h3>
            <p>Отвечает за создание интуитивно понятного и удобного интерфейса платформы. Благодаря его работе пользователи Sellex получают быстрый и комфортный доступ ко всем уникальным функциям нашей системы.</p>
          </div>
        </div>

        <div className="team-member">
          <span className="member-icon">🎮</span>
          <div>
            <h3>Самандар — проектный менеджер</h3>
            <p>Координирует процессы разработки, следит за сроками и качеством выполнения задач. Его роль — обеспечить слаженную работу команды и оперативное внедрение инновационных решений.</p>
          </div>
        </div>

        <div className="team-member">
          <span className="member-icon">📊</span>
          <div>
            <h3>Адам — проектный менеджер</h3>
            <p>Отвечает за стратегическое развитие Sellex, анализ рыночных трендов и построение долгосрочной конкурентоспособности проекта. Именно благодаря его работе мы сохраняем статус единственного решения такого уровня на рынке.</p>
          </div>
        </div>

        <div className="team-member">
          <span className="member-icon">⚙️</span>
          <div>
            <h3>Владислав — бэкенд-разработчик</h3>
            <p>Обеспечивает бесперебойную работу сложной серверной архитектуры платформы. Его решения гарантируют, что Sellex стабильно работает даже при обработке огромных объемов данных.</p>
          </div>
        </div>

        <div className="team-member">
          <span className="member-icon">🤫</span>
          <div>
            <h3>Федор — бэкенд-разработчик</h3>
            <p>Специализируется на оптимизации производительности системы и безопасности данных. Благодаря его работе пользователи могут быть уверены в надежности и конфиденциальности своей информации.</p>
          </div>
        </div>
      </section>

      {/* Блок преимуществ */}
      <section ref={featuresRef} className="features-section">
        <h2>Почему Sellex — это уникальное решение?</h2>
        
        <div className="feature-card">
          <h3>Единственная платформа, объединяющая инструменты для продаж, аналитику и обучение</h3>
        </div>

        <div className="feature-card">
          <h3>Автоматизированная система рекомендаций для увеличения прибыли</h3>
        </div>

        <div className="feature-card">
          <h3>Эксклюзивные методики работы с Wildberries, недоступные в других сервисах</h3>
        </div>

        <div className="feature-card">
          <h3>Постоянное обновление функционала в соответствии с изменениями на маркетплейсе</h3>
        </div>

        <div className="conclusion">
          <p>Мы не просто создаем продукт — мы формируем новый стандарт работы на Wildberries. Sellex — это революционный подход к e-commerce, который уже сегодня помогает тысячам продавцов достигать невероятных результатов.</p>
          <p className="slogan">Sellex — нет конкурентов, есть только результат! 🚀</p>
        </div>
      </section>
    </div>
  );
}