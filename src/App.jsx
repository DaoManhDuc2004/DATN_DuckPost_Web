import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DriverPage from './pages/DriverPage';
import UserPage from './pages/UserPage';
import OrderPage from './pages/OrderPage';
import DriverManagerByAdmin from './pages/DriverManagerTemp';
import WalletPage from './pages/WalletPage';
import DashboardPage from './pages/DashboardPage';
import PricingManager from './pages/PricingManager';
import Login from './pages/Login'; 
import './App.css';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    return <Login />;
  }

  return (
    <div className={`admin-container ${isCollapsed ? 'collapsed' : ''}`}>
      <Header />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="main-content">
        <Routes>
          <Route path="/" element={<DriverPage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/drivers-all" element={<DriverManagerByAdmin />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pricing" element={<PricingManager />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;