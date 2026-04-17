import { useState, useEffect } from "react";
import axios from "axios";
import ApiClient from "../ApiClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Dashboard.css";

const DashboardPage = () => {
  const [timeFilter, setTimeFilter] = useState("WEEK"); 
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    newDrivers: 0,
    newCustomers: 0,
  });
  const [ordersData, setOrdersData] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchAndCalculate();
  }, [timeFilter]);

  const fetchAndCalculate = async () => {
    try {
      const [drvRes, cusRes, ordRes] = await Promise.all([
        ApiClient.get("/admin/drivers/all"), 
        ApiClient.get("/admin/customers"), 
        ApiClient.get("/order/admin/all"), 
      ]);

      const allOrders = ordRes.data;
      const allDrivers = drvRes.data.filter((d) => d.role === "DRIVER");
      const allCustomers = cusRes.data;

      const startDate = new Date();
      if (timeFilter === "WEEK") startDate.setDate(startDate.getDate() - 7);
      else if (timeFilter === "MONTH") startDate.setDate(startDate.getDate() - 30);
      else if (timeFilter === "YEAR") startDate.setFullYear(startDate.getFullYear() - 1);

      startDate.setHours(0, 0, 0, 0); 

      const filteredOrders = allOrders.filter((o) => new Date(o.createdAt) >= startDate);
      const filteredDrivers = allDrivers.filter((d) => new Date(d.createdAt) >= startDate);
      const filteredCustomers = allCustomers.filter((c) => new Date(c.createdAt) >= startDate);

      let totalRev = 0;
      filteredOrders.forEach((o) => {
        if (o.status === "COMPLETED" || o.status === "RETURNED_COMPLETED") {
          const priceNum = parseInt(o.price?.toString().replace(/\D/g, "") || 0);
          if (priceNum > 0) {
            const driverWage = (priceNum - 5000) / 1.3;
            totalRev += priceNum - driverWage;
          }
        }
      });

      setStats({
        revenue: Math.round(totalRev),
        orders: filteredOrders.length,
        newDrivers: filteredDrivers.length,
        newCustomers: filteredCustomers.length,
      });

      setOrdersData(allOrders); 
      buildChartData(allOrders, timeFilter);
    } catch (error) {
      console.error("Lỗi cập nhật Dashboard:", error);
    }
  };

  const buildChartData = (orders, filter) => {
    const data = [];
    const today = new Date();
    const days = filter === "WEEK" ? 7 : filter === "MONTH" ? 30 : 0;

    if (days > 0) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        data.push({ name: dateStr, Doanh_thu: 0, So_don: 0 });
      }
      orders.forEach((o) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        const point = data.find((item) => item.name === dateStr);
        if (point) {
          point.So_don += 1;
          if (o.status === "COMPLETED" || o.status === "RETURNED_COMPLETED") {
            const priceNum = parseInt(o.price?.toString().replace(/\D/g, "") || 0);
            point.Doanh_thu += Math.round(((priceNum - 5000) / 1.3) * 0.3 + 5000); 
          }
        }
      });
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `T${d.getMonth() + 1}/${d.getFullYear()}`;
        data.push({ name: monthStr, Doanh_thu: 0, So_don: 0 });
      }
      orders.forEach((o) => {
        const oDate = new Date(o.createdAt);
        const monthStr = `T${oDate.getMonth() + 1}/${oDate.getFullYear()}`;
        const point = data.find((item) => item.name === monthStr);
        if (point) {
          point.So_don += 1;
          if (o.status === "COMPLETED" || o.status === "RETURNED_COMPLETED") {
            const priceNum = parseInt(o.price?.toString().replace(/\D/g, "") || 0);
            point.Doanh_thu += Math.round(priceNum * 0.2); 
          }
        }
      });
    }
    setChartData(data);
  };

  const getLabel = () => {
    if (timeFilter === "WEEK") return "7 ngày qua";
    if (timeFilter === "MONTH") return "30 ngày qua";
    return "12 tháng qua";
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-main">
        <h1 className="dashboard-title">Tổng quan hệ thống</h1>
        <select className="global-filter" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
          <option value="WEEK">7 Ngày gần đây</option>
          <option value="MONTH">30 Ngày gần đây</option>
          <option value="YEAR">12 Tháng qua</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Doanh thu ({getLabel()})</div>
          <div className="stat-value">{stats.revenue.toLocaleString()} ₫</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tổng đơn hàng ({getLabel()})</div>
          <div className="stat-value">{stats.orders}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tài xế mới ({getLabel()})</div>
          <div className="stat-value">{stats.newDrivers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Khách hàng mới ({getLabel()})</div>
          <div className="stat-value">{stats.newCustomers}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>Biểu đồ Doanh thu (Chiết khấu)</h3>
        </div>
        <div style={{ width: "100%", height: 380 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="Doanh_thu" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
