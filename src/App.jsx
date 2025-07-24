import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import MainBanner from './components/MainBanner';
import FeatureCard from './components/FeatureCard';
import CtaSection from './components/CtaSection';
import SocialPopup from './components/SocialPopup';
import AboutPage from './components/AboutPage';
import Analytics from './components/Analitic';
import SubscriptionPage from './components/SubscriptionPage';
import ProfilePage from './components/ProfilePage';

// Set up axios defaults
axios.defaults.baseURL = 'http://localhost:8080';

// Настройка axios interceptors для работы с JWT
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // Явно добавляем префикс Bearer к токену
      config.headers.Authorization = `Bearer ${token}`;
      
      // Для отладки выводим заголовки запроса
      console.log('Request headers:', config.headers);
      console.log('Request URL:', config.url);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Обработка ошибок аутентификации
axios.interceptors.response.use(
  response => {
    console.log('Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  error => {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
      
      // Если получаем 401 Unauthorized, значит токен недействителен или истек
      if (error.response.status === 401) {
        console.log('Unauthorized access detected');
        
        // Проверяем, не связан ли запрос с авторизацией
        if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
          console.log('Token might be invalid, attempting to refresh session');
          
          // Получаем данные пользователя из localStorage
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          // Если есть email и сохраненный пароль, можно попробовать повторно авторизоваться
          if (userData.email && userData._savedPassword) {
            console.log('Attempting to re-login with saved credentials');
            
            // Создаем новый экземпляр axios без перехватчиков для предотвращения цикла
            const axiosInstance = axios.create({
              baseURL: 'http://localhost:8080'
            });
            
            // Пытаемся повторно войти в систему
            return axiosInstance.post('/api/auth/login', {
              email: userData.email,
              password: userData._savedPassword
            })
            .then(response => {
              if (response.data.success) {
                console.log('Re-login successful, updating token');
                
                // Обновляем токен и данные пользователя
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify({
                  ...response.data.user,
                  _savedPassword: userData._savedPassword // Сохраняем пароль для будущих повторных авторизаций
                }));
                
                // Повторяем оригинальный запрос с новым токеном
                error.config.headers.Authorization = `Bearer ${response.data.token}`;
                return axios(error.config);
              } else {
                // Если повторная авторизация не удалась, отклоняем промис
                return Promise.reject(error);
              }
            })
            .catch(reLoginError => {
              console.error('Re-login failed:', reLoginError);
              return Promise.reject(error);
            });
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

function HomePage() {
  return (
    <>
      <MainBanner />
      <div className="features-container">
        <div className="features">
          <FeatureCard 
            type="1"
            title="Управление ставкой CPM"
            description="Используйте одну из 5 стратегий автобиддера для управления CPM, чтобы занять самые лучшие позиции по нужным ключам с минимально возможными затратами."
            image="ico1-Photoroom.png"
          />
          <FeatureCard 
            type="2"
            title="Управление ключами"
            description="Автоминусация фраз и работа только по «белому списку» ключей. Управление ключами и кластерами на полном и очень эффективном автопилоте."
            image="ico2-Photoroom.png"
          />
        </div>
        <CtaSection />
      </div>
      <SocialPopup />
    </>
  );
}

export default function App() {
  // Проверка валидности токена при загрузке приложения
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found in localStorage');
      
      // Проверяем токен, делая запрос к API
      axios.get('/api/subscription/info')
        .then(response => {
          console.log('Token is valid:', response.data);
        })
        .catch(error => {
          console.error('Token validation error:', error);
          
          // Если токен недействителен и нет сохраненных учетных данных для повторного входа,
          // можно очистить localStorage и перенаправить на главную страницу
          if (error.response && error.response.status === 401) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (!userData._savedPassword) {
              console.log('Token is invalid and no saved credentials, clearing localStorage');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // window.location.href = '/';
            }
          }
        });
    }
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

