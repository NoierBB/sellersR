import { useState } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true); // true - вход, false - регистрация
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    const message = isLogin 
      ? `Вход с email: ${email}`
      : `Регистрация: ${name}, ${email}`;
    
    alert(message);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h2>{isLogin ? 'Вход в аккаунт' : 'Регистрация'}</h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Имя</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{isLogin ? 'Пароль' : 'Придумайте пароль'}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Повторите пароль</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          {isLogin && (
            <div className="form-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Запомнить меня
              </label>
              <a href="#" className="forgot-password">Забыли пароль?</a>
            </div>
          )}
          
          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="auth-footer">
          {isLogin ? (
            <>Нет аккаунта? <a href="#" onClick={() => setIsLogin(false)}>Зарегистрироваться</a></>
          ) : (
            <>Уже есть аккаунт? <a href="#" onClick={() => setIsLogin(true)}>Войти</a></>
          )}
        </div>
      </div>
    </div>
  );
}