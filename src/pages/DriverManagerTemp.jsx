import { useState, useEffect } from 'react';
import axios from 'axios';
import './driverManagerByAdmin.css'; 
import ApiClient from '../ApiClient';

const DriverManagerByAdmin = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
        const res = await ApiClient.get("/admin/drivers/all"); 
        setDrivers(res.data);
    } catch (e) { console.error(e); }
  };
  const handleToggleLock = async (driverId, currentStatus, driverName) => {
      const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
      const confirmMsg = newStatus === 'LOCKED' 
            ? `Bạn muốn KHÓA tài khoản của ${driverName}?` 
            : `Bạn muốn MỞ KHÓA tài khoản cho ${driverName}?`;
      
      if (!window.confirm(confirmMsg)) return;

      try {
          await ApiClient.post(`/admin/driver/toggle-lock?driverId=${driverId}&status=${newStatus}`)
          alert("Thao tác thành công!");
          fetchAll();
      } catch (error) {
          alert("Lỗi hệ thống khi thao tác!");
          console.error(error);
      }
  };

const renderStatus = (status) => {
    switch (status) {
        case 'ACTIVE': 
            return <span style={{color: '#6c757d', border: '1px solid #6c757d', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>Đã duyệt (Offline)</span>;
        case 'PENDING': 
            return <span style={{color: '#fd7e14', border: '1px solid #fd7e14', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>⏳ Chờ duyệt</span>;
        case 'READY': 
            return <span style={{color: '#28a745', border: '1px solid #28a745', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>🟢 Sẵn sàng (Online)</span>;
        case 'BUSY': 
            return <span style={{color: '#6f42c1', border: '1px solid #6f42c1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>🛵 Đang giao hàng</span>;
        case 'LOCKED': 
            return <span style={{color: '#dc3545', border: '1px solid #dc3545', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>🔒 Đã Khóa</span>;
        default: 
            return <span>{status}</span>;
    }
  };

  return (
    <div className="manager-container">
      <h1>QUẢN LÝ TÀI XẾ </h1>
      
      <div className="table-responsive">
        <table className="manager-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tài xế</th>
              <th>Số CCCD</th>
              <th>Quê quán</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
              <th>Xe & Biển số</th>
              <th>Ảnh Chân dung</th>
              <th>CCCD (Trước)</th>
              <th>CCCD (Sau)</th>
              <th>Ảnh Xe</th>
              <th>Bằng lái</th>
              <th>Giấy tờ xe</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d, index) => (
              <tr key={d.id}>
                <td style={{textAlign: 'center'}}>{index + 1}</td>
                <td>
                    <b>{d.name}</b><br/>
                    <span style={{color:'#009ef7'}}>{d.phone}</span>
                </td>
                <td>
                    <span style={{fontWeight: 'bold', color: '#555'}}>{d.cccdNumber || "---"}</span>
                </td>
                <td>{d.hometown || "---"}</td>
                <td>{renderStatus(d.status)}</td>
                
  <td>
                    {(d.status === 'ACTIVE' || d.status === 'READY' || d.status === 'BUSY') && (
                        <button className="btn-toggle-lock btn-lock" onClick={() => handleToggleLock(d.id, d.status, d.name)}>🔒 Khóa TK</button>
                    )}
                    {d.status === 'LOCKED' && (
                        <button className="btn-toggle-lock btn-unlock" onClick={() => handleToggleLock(d.id, d.status, d.name)}>✅ Mở Khóa</button>
                    )}
                    {d.status === 'PENDING' && (
                        <span style={{fontSize: '12px', color: '#888'}}>Đang chờ duyệt</span>
                    )}
                </td>

                <td>{d.vehicleType}<br/><b style={{color:'red'}}>{d.licensePlate}</b></td>
                
                <td><img src={d.portraitUrl} className="thumb-img" onClick={() => setSelectedImage(d.portraitUrl)} /></td>
                <td><img src={d.cccdFrontUrl} className="thumb-img" onClick={() => setSelectedImage(d.cccdFrontUrl)} /></td>
                <td><img src={d.cccdBackUrl} className="thumb-img" onClick={() => setSelectedImage(d.cccdBackUrl)} /></td>
                <td><img src={d.vehiclePlateImageUrl} className="thumb-img" onClick={() => setSelectedImage(d.vehiclePlateImageUrl)} /></td>
                <td><img src={d.licenseImageUrl} className="thumb-img" onClick={() => setSelectedImage(d.licenseImageUrl)} /></td>
                <td><img src={d.vehiclePaperUrl} className="thumb-img" onClick={() => setSelectedImage(d.vehiclePaperUrl)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <div className="overlay-viewer" onClick={() => setSelectedImage(null)}>
            <button className="btn-close-viewer">✕</button>
            <img src={selectedImage} alt="Full" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default DriverManagerByAdmin;