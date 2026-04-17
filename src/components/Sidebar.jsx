import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Sidebar.css';
import ApiClient from '../ApiClient';
import { FaUserCheck, FaUsers, FaTruck, FaClipboardList, FaWallet, FaChartBar, FaCog, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [serverCount, setServerCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const location = useLocation();
  const checkPendingCount = async () => {
    try {
      const res = await ApiClient.get("/admin/drivers/pending");
      const currentTotal = res.data.length;
      
      setServerCount(currentTotal);
      
      if (window.location.pathname === '/') {
        setSeenCount(currentTotal);
      }
    } catch (error) {
      console.error("Loi check thong bao");
    }
  };

  useEffect(() => {
    checkPendingCount();
    const interval = setInterval(checkPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
        setSeenCount(serverCount);
    }
  }, [location, serverCount]);

  const displayCount = Math.max(0, serverCount - seenCount);

const handleLogout = () => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    
    if (isConfirm) {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUsername");
      window.location.href = "/";
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>ADMIN</h2>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      
      <NavLink to="/">
        <FaUserCheck className="nav-icon" />
        <span className="nav-text">Duyệt Tài Xế</span>
        {displayCount > 0 && (
            <span className="badge-count">{displayCount}</span>
        )}
      </NavLink>
      
      <NavLink to="/users">
        <FaUsers className="nav-icon" />
        <span className="nav-text">Quản Lý Khách Hàng</span>
      </NavLink>
      <NavLink to="/drivers-all">
        <FaTruck className="nav-icon" />
        <span className="nav-text">Quản lý Driver</span>
      </NavLink>
      <NavLink to="/orders">
        <FaClipboardList className="nav-icon" />
        <span className="nav-text">Quản Lý Đơn</span>
      </NavLink>
      <NavLink to="/wallet">
        <FaWallet className="nav-icon" />
        <span className="nav-text">Quản Lý Ví</span>
      </NavLink>
      <NavLink to="/dashboard">
        <FaChartBar className="nav-icon" />
        <span className="nav-text">Dashboard Tổng Quan</span>
      </NavLink>
      <NavLink to="/pricing">
        <FaCog className="nav-icon" />
        <span className="nav-text">Cấu Hình Bảng Giá</span>
      </NavLink>

      <div style={{marginTop: 'auto', borderTop: '1px solid #444', paddingTop: 20}}>
        <a 
          onClick={handleLogout} 
          style={{color: '#ff6b6b', cursor: 'pointer', display: 'block'}}
          className="logout-btn"
        >
          <FaSignOutAlt className="nav-icon" />
          <span className="nav-text">🚪 Đăng Xuất</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;