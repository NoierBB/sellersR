import { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import MainBanner from './components/MainBanner';
import FeatureCard from './components/FeatureCard';
import CtaSection from './components/CtaSection';
import SocialPopup from './components/SocialPopup';
import AboutPage from './components/AboutPage';
// import Analytic from './components/Analitic';


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
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* <Route path='/analitic' element={<AnalyticsDashboard/>}/> */}
      </Routes>
    </Router>
  );
}

