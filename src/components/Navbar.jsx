import { useState, useEffect } from 'react';
import { faBell, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Добавляем/удаляем класс размытия при открытии/закрытии модального окна
    if (isAuthModalOpen) {
      document.body.classList.add('body-blur');
    } else {
      document.body.classList.remove('body-blur');
    }

    // Очистка при размонтировании компонента
    return () => {
      document.body.classList.remove('body-blur');
    };
  }, [isAuthModalOpen]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-theme');
  };

  return (
    <>
      <nav>
        <ul className="nav-links">
          <li><a href="#">Главная</a></li>
          <li><a href="#">Клиенты</a></li>
          <li><a href="#">Заказы</a></li>
          <li><a href="#">Аналитика</a></li>
          <li><a href="#">Оптимизация</a></li>
        </ul>
        
        <div className="nav-right">
          <button className="nav-btn" id="notification-btn" onClick={() => alert('Здесь будут ваши уведомления')}>
            <FontAwesomeIcon icon={faBell} />
          </button>
          <button className="nav-btn" id="theme-toggle" onClick={toggleTheme}>
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          </button>
          <button 
            className="login-btn" 
            onClick={() => setIsAuthModalOpen(true)}
          >
            Войти
          </button>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}