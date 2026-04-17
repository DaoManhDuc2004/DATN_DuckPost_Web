import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  const username = sessionStorage.getItem('adminUsername') || 'Admin';

  return (
    <header className="header">
      <div className="header-left">
        <span className="duck-icon">🦆</span>
        <span className="app-name">DuckPost</span>
      </div>
      <div className="header-right">
        <span className="current-time">{formatTime(currentTime)}</span>
        <span className="user-info">Welcome, {username}</span>
      </div>
    </header>
  );
};

export default Header;