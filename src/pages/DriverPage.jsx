import { useState, useEffect } from 'react';
import './DriverPage.css';
import ApiClient from '../ApiClient';

const DriverPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchPendingDrivers();

    const interval = setInterval(() => {
        fetchPendingDrivers();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const res = await ApiClient.get("/admin/drivers/pending")
      setDrivers(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    }
  };

  const handleApprove = async (id) => {
    if(!confirm("Xác nhận duyệt tài xế này?")) return;
    try {
      await ApiClient.post(`/admin/approve/${id}`); 
      
      alert("Đã duyệt thành công!");
      fetchPendingDrivers(); 
    } catch (error) {
      console.error(error);
      alert("Lỗi khi duyệt: " + (error.response?.data?.message || "Lỗi server"));
    }
  };

  const handleReject = async (id) => {
    if(!confirm("Bạn chắc chắn muốn TỪ CHỐI và XÓA hồ sơ này?")) return;
    try {
      await ApiClient.delete(`/admin/reject/${id}`); 
      
      alert("Đã từ chối và xóa hồ sơ!");
      fetchPendingDrivers();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi từ chối: " + (error.response?.data?.message || "Lỗi server"));
    }
  };

  return (
    <div>
      <h1>DANH SÁCH CHỜ DUYỆT ({drivers.length})</h1>
      
      <div className="table-container">
        <table border="1">
          <thead>
            <tr>
              <th style={{minWidth: 150}}>Tài xế</th>
              <th>Số CCCD</th>
              <th>Thông tin cá nhân</th>
              <th>Quê quán</th>
              <th>Thông tin Xe</th>
              <th>1. Chân dung</th>
              <th>2. CCCD (Trước)</th>
              <th>3. CCCD (Sau)</th>
              <th>4. Biển số xe</th>
              <th>5. Bằng lái</th>
              <th>6. Giấy tờ xe</th>
              <th style={{minWidth: 180}}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td>
                    <b>{d.name}</b><br/>
                    <span style={{color:'#009ef7'}}>{d.phone}</span>
                </td>
                <td><b>{d.cccdNumber || "---"}</b></td>
                <td>{d.birthday}<br/>{d.gender}</td>
                <td>{d.hometown || "Chưa cập nhật"}</td>
                <td>{d.vehicleType}<br/><b style={{color:'red'}}>{d.licensePlate}</b></td>

                <td><img src={d.portraitUrl} className="img-preview" onClick={() => setSelectedImage(d.portraitUrl)} /></td>
                <td><img src={d.cccdFrontUrl} className="img-preview" onClick={() => setSelectedImage(d.cccdFrontUrl)} /></td>
                <td><img src={d.cccdBackUrl} className="img-preview" onClick={() => setSelectedImage(d.cccdBackUrl)} /></td>
                <td><img src={d.vehiclePlateImageUrl} className="img-preview" onClick={() => setSelectedImage(d.vehiclePlateImageUrl)} /></td>
                <td><img src={d.licenseImageUrl} className="img-preview" onClick={() => setSelectedImage(d.licenseImageUrl)} /></td>
                <td><img src={d.vehiclePaperUrl} className="img-preview" onClick={() => setSelectedImage(d.vehiclePaperUrl)} /></td>
                
                <td>
                  <div style={{display: 'flex', gap: '5px'}}>
                      <button className="btn-approve" onClick={() => handleApprove(d.id)}>
                        ✓ Duyệt
                      </button>
                      
                      <button className="btn-reject" onClick={() => handleReject(d.id)}>
                        ✕ Hủy
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img src={selectedImage} alt="Full size" />
            <button className="close-btn" onClick={() => setSelectedImage(null)}>Đóng X</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverPage;