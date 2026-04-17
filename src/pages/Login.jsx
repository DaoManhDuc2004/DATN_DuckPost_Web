import React, { useState } from "react";
import ApiClient from "../ApiClient";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa"; 
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await ApiClient.post("/admin/login", { username, password });
      
      if (res.data && res.data.token) {
        sessionStorage.setItem("adminToken", res.data.token);
        sessionStorage.setItem("adminUsername", res.data.username);
        
        window.location.href = "/";
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Tài khoản hoặc mật khẩu không chính xác!");
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">DP</div>
          <h1>DuckPost Admin</h1>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-box">
            <FaUser className="icon" />
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-box">
            <FaLock className="icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          <button type="submit" className={`login-button ${loading ? "loading" : ""}`} disabled={loading}>
            {loading ? <span className="loader"></span> : "ĐĂNG NHẬP HỆ THỐNG"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;