import { useEffect, useState } from 'react';
import { faVk, faTelegram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SocialPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`social-popup ${visible ? 'visible' : ''}`} id="socialPopup">
      <div className="social-icons">
        <a href="#" className="social-icon"><FontAwesomeIcon icon={faVk} /></a>
        <a href="#" className="social-icon"><FontAwesomeIcon icon={faTelegram} /></a>
        <a href="#" className="social-icon"><FontAwesomeIcon icon={faWhatsapp} /></a>
      </div>
    </div>
  );
}