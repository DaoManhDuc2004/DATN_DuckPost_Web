import { useState, useEffect } from 'react';
import ApiClient from '../ApiClient';
import './UserPage.css';

const UserPage = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await ApiClient.get("/admin/customers")
      setCustomers(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách khách hàng:", error);
    }
  };

  return (
    <div className="user-container">
      <h1>👥 QUẢN LÝ KHÁCH HÀNG ({customers.length})</h1>
      
      <div className="table-card">
        <table className="user-table">
          <thead>
            <tr>
              <th style={{width: '50px'}}>STT</th>
              <th>Họ và Tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Thông tin cá nhân</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((user, index) => (
              <tr key={user.id || index}>
                <td style={{textAlign: 'center'}}>{index + 1}</td>
                
                <td>
                    <b>{user.name}</b>
                </td>
                
                <td style={{color: '#009ef7', fontWeight: 'bold'}}>
                    {user.phone}
                </td>
                
                <td>
                    {user.email || <span style={{color: '#999'}}>---</span>}
                </td>

                <td>
                    {user.gender} - {user.birthday}
                </td>

                <td>
                    {user.status === 'ACTIVE' ? (
                        <span className="status-tag active-tag">Hoạt động</span>
                    ) : (
                        <span className="status-tag locked-tag">{user.status}</span>
                    )}
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
                <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: 20, color: '#888'}}>
                        Chưa có khách hàng nào đăng ký.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPage;