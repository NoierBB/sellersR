import { useState, useEffect } from 'react';
import { faBell, faMoon, faSun, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AuthModal from './AuthModal';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
    
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
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowUserMenu(false);
    window.location.reload();
  };

  return (
    <>
      <nav>
        <ul className="nav-links">
          <li><Link to="/">Главная</Link></li>
          {/* <li><a href="#">Клиенты</a></li> */}
          {/* <li><a href="#">Заказы</a></li> */}
          <li><Link to="/analytics">Аналитика</Link></li>
          {/* <li><a href="#">Оптимизация</a></li> */}
          <li><Link to="/about">О нас</Link></li>
        </ul>
        
        <div className="nav-right">
          <button className="nav-btn" id="notification-btn" onClick={() => alert('Здесь будут ваши уведомления')}>
            <FontAwesomeIcon icon={faBell} />
          </button>
          {/* <button className="nav-btn" id="theme-toggle" onClick={toggleTheme}>
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          </button> */}
          
          {isLoggedIn ? (
            <div className="user-menu-container">
              <button 
                className="user-btn" 
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <FontAwesomeIcon icon={faUser} />
                <span>{user?.firstName || 'Пользователь'}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p>{user?.firstName} {user?.lastName}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                  <ul>
                    <li><Link to="/profile">Профиль</Link></li>
                    <li><Link to="/subscription">Подписка</Link></li>
                    <li><button onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} /> Выйти
                    </button></li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="login-btn" 
              onClick={() => setIsAuthModalOpen(true)}
            >
              Войти
            </button>
          )}
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}