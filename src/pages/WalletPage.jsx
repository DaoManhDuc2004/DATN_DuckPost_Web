import { useState, useEffect } from 'react';
import ApiClient from '../ApiClient'; 
import './WalletPage.css';

const WalletPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [totalAppRevenue, setTotalAppRevenue] = useState(0);
  
  const [transactions, setTransactions] = useState([]);
  const [filterDriverId, setFilterDriverId] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdding, setIsAdding] = useState(true);

  useEffect(() => {
    fetchData();
    fetchTransactions();
  }, []);

  const fetchData = async () => {
    try {
      const drvRes = await ApiClient.get("/admin/drivers/all");
      setDrivers(drvRes.data.filter(d => d.role === "DRIVER"));

      const ordRes = await ApiClient.get("/order/admin/all");
      let revenue = 0;
      ordRes.data.forEach(order => {
        if (order.status === 'COMPLETED' || order.status === 'RETURNED_COMPLETED') {
            const priceNum = parseInt(order.price?.toString().replace(/\D/g, '') || 0);
            if (priceNum > 0) {
                const driverWage = (priceNum - 5000) / 1.3;
                revenue += (priceNum - driverWage);
            }
        }
      });
      setTotalAppRevenue(revenue);
    } catch (error) { console.error("Lỗi lấy dữ liệu:", error); }
  };

  const fetchTransactions = async () => {
      try {
          const res = await ApiClient.get("/admin/wallet/transactions/all");
          setTransactions(res.data);
      } catch (e) { console.error("Lỗi lấy lịch sử:", e); }
  };

  const filteredTransactions = transactions.filter(t => {
      let passDriver = filterDriverId === 'ALL' || t.driverId === filterDriverId;
      let passDate = true;
      if (filterStartDate) passDate = passDate && new Date(t.createdAt) >= new Date(filterStartDate);
      if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59);
          passDate = passDate && new Date(t.createdAt) <= end;
      }
      return passDriver && passDate;
  });

  const handleAdjustSubmit = async () => {
    if (!adjustAmount || isNaN(adjustAmount) || Number(adjustAmount) <= 0) return alert("Số tiền không hợp lệ!");
    if (!adjustReason) return alert("Vui lòng nhập lý do!");

    const finalAmount = isAdding ? Number(adjustAmount) : -Math.abs(Number(adjustAmount));

    try {
      const url = `/admin/wallet/adjust?driverId=${selectedDriver.id}&amount=${finalAmount}&reason=${encodeURIComponent(adjustReason)}`;
      await ApiClient.post(url);
      
      alert(`Thành công!`);
      setIsModalOpen(false);
      fetchData(); 
      fetchTransactions();
    } catch (error) { alert("Lỗi cập nhật!"); }
  };

  const openAdjustModal = (driver, type) => {
    setSelectedDriver(driver);
    setIsAdding(type === 'ADD');
    setAdjustAmount('');
    setAdjustReason(type === 'ADD' ? 'Thưởng hệ thống' : 'Truy thu vi phạm');
    setIsModalOpen(true);
  };

  return (
    <div className="wallet-container">
      <h1>💰 QUẢN LÝ TÀI CHÍNH DuckPost</h1>

      <div className="dashboard-row">
        <div className="stat-card revenue">
            <div className="stat-title">Doanh thu chiết khấu (App)</div>
            <div className="stat-value">{Math.round(totalAppRevenue).toLocaleString()} đ</div>
        </div>
        <div className="stat-card liabilities">
            <div className="stat-title">Tổng tiền trong ví tài xế</div>
            <div className="stat-value">{Math.round(drivers.reduce((s, d) => s + (d.walletBalance || 0), 0)).toLocaleString()} đ</div>
        </div>
      </div>

      <div className="section-card">
          <h3>💳 Danh sách Ví đối tác</h3>
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Thông tin Tài xế</th>
                <th>Số dư hiện tại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id}>
                    <td><b>{driver.name}</b><br/><small>{driver.phone}</small></td>
                    <td><b style={{color: driver.walletBalance < 0 ? 'red' : '#28a745'}}>{Math.round(driver.walletBalance || 0).toLocaleString()} đ</b></td>
                    <td>
                        <button className="btn-sm btn-add" onClick={() => openAdjustModal(driver, 'ADD')}>+ Thưởng</button>
                        <button className="btn-sm btn-sub" onClick={() => openAdjustModal(driver, 'SUB')}>- Phạt</button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      <div className="section-card" style={{marginTop: '30px'}}>
          <div className="history-header">
              <h3>📜 Nhật ký biến động số dư</h3>
              <div className="history-filters">
                  <select value={filterDriverId} onChange={e => setFilterDriverId(e.target.value)}>
                      <option value="ALL">Tất cả tài xế</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                  <span>đến</span>
                  <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
          </div>

          <table className="history-table">
              <thead>
                  <tr>
                      <th>Thời gian</th>
                      <th>Tài xế</th>
                      <th>Số tiền</th>
                      <th>Loại</th>
                      <th>Nội dung</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredTransactions.map(t => (
                      <tr key={t.id}>
                          <td style={{fontSize: '12px'}}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                          <td>{drivers.find(d => d.id === t.driverId)?.name || 'N/A'}</td>
                          <td>
                              <b style={{color: t.amount > 0 ? '#28a745' : 'red'}}>
                                  {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} đ
                              </b>
                          </td>
                          <td>
                              <span className={`type-tag ${t.type}`}>
                                  {t.type === 'SYSTEM_ADJUST' ? 'Điều chỉnh' : (t.type === 'DEDUCTION' ? 'Chiết khấu' : 'Nạp tiền')}
                              </span>
                          </td>
                          <td style={{fontSize: '13px', fontStyle: 'italic'}}>{t.note}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {filteredTransactions.length === 0 && <p className="empty-msg">Không có dữ liệu giao dịch phù hợp.</p>}
      </div>

      {isModalOpen && (
          <div className="modal-overlay">
              <div className="modal-box">
                  <h3 style={{color: isAdding ? '#28a745' : '#dc3545'}}>{isAdding ? '➕ CỘNG TIỀN' : '➖ TRỪ TIỀN'}</h3>
                  <div className="input-group">
                      <label>Số tiền (VNĐ):</label>
                      <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
                  </div>
                  <div className="input-group">
                      <label>Lý do:</label>
                      <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
                  </div>
                  <div className="modal-actions">
                      <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                      <button className="btn-save" style={{backgroundColor: isAdding ? '#28a745' : '#dc3545'}} onClick={handleAdjustSubmit}>Xác nhận</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default WalletPage;