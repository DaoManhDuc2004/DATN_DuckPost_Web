import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./driverManagerByAdmin.css";
import ApiClient from "../ApiClient";

const DriverManagerByAdmin = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const defaultDriverFilters = {
    keyword: "",
    phone: "",
    email: "",
    cccdNumber: "",
    hometown: "",
    licensePlate: "",
    vehicleType: "",
    status: "",
  };

  const [filters, setFilters] = useState(defaultDriverFilters);

  const fetchAll = useCallback(async (currentFilters = {}) => {
    try {
      const params = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.append(key, value.trim());
        }
      });

      const query = params.toString();

      const res = await ApiClient.get(`/admin/drivers/all${query ? `?${query}` : ""}`);

      setDrivers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải danh sách tài xế:", e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchAll]);

  

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultDriverFilters);
  };
  const handleToggleLock = async (driverId, currentStatus, driverName) => {
    const newStatus = currentStatus === "LOCKED" ? "ACTIVE" : "LOCKED";
    const confirmMsg = newStatus === "LOCKED" ? `Bạn muốn KHÓA tài khoản của ${driverName}?` : `Bạn muốn MỞ KHÓA tài khoản cho ${driverName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await ApiClient.post(`/admin/driver/toggle-lock?driverId=${driverId}&status=${newStatus}`);
      alert("Thao tác thành công!");
      fetchAll(filters);
    } catch (error) {
      alert("Lỗi hệ thống khi thao tác!");
      console.error(error);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span style={{ color: "#6c757d", border: "1px solid #6c757d", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
            Đã duyệt (Offline)
          </span>
        );
      case "PENDING":
        return (
          <span style={{ color: "#fd7e14", border: "1px solid #fd7e14", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
            ⏳ Chờ duyệt
          </span>
        );
      case "READY":
        return (
          <span style={{ color: "#28a745", border: "1px solid #28a745", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
            🟢 Sẵn sàng (Online)
          </span>
        );
      case "BUSY":
        return (
          <span style={{ color: "#6f42c1", border: "1px solid #6f42c1", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
            🛵 Đang giao hàng
          </span>
        );
      case "LOCKED":
        return (
          <span style={{ color: "#dc3545", border: "1px solid #dc3545", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
            🔒 Đã Khóa
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="manager-container">
      <h1>QUẢN LÝ TÀI XẾ </h1>
      <div className="filter-panel">
        <div className="filter-header">
          <div>
            <h3>Bộ lọc tài xế</h3>
            <p>Lọc theo tên, email, số điện thoại, CCCD, quê quán, biển số, loại xe và trạng thái.</p>
          </div>

          <div className="filter-actions">
            <button className="btn-filter" onClick={() => fetchAll(filters)}>
              Lọc
            </button>
            <button className="btn-reset" onClick={resetFilters}>
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="filter-grid">
          <input placeholder="Tìm nhanh tên / SĐT / email..." value={filters.keyword} onChange={(e) => handleFilterChange("keyword", e.target.value)} />

          <input placeholder="Số điện thoại" value={filters.phone} onChange={(e) => handleFilterChange("phone", e.target.value)} />

          <input placeholder="Email" value={filters.email} onChange={(e) => handleFilterChange("email", e.target.value)} />

          <input placeholder="Số CCCD" value={filters.cccdNumber} onChange={(e) => handleFilterChange("cccdNumber", e.target.value)} />

          <input placeholder="Quê quán" value={filters.hometown} onChange={(e) => handleFilterChange("hometown", e.target.value)} />

          <input placeholder="Biển số xe" value={filters.licensePlate} onChange={(e) => handleFilterChange("licensePlate", e.target.value)} />

          <select value={filters.vehicleType} onChange={(e) => handleFilterChange("vehicleType", e.target.value)}>
            <option value="">Tất cả loại xe</option>
            <option value="Xe máy">Xe máy</option>
            <option value="Ô tô">Ô tô</option>
            <option value="Bán tải">Bán tải</option>
            <option value="BIKE">BIKE</option>
            <option value="CAR4">CAR4</option>
            <option value="CAR7">CAR7</option>
          </select>

          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="ACTIVE">Đã duyệt</option>
            <option value="READY">Online</option>
            <option value="BUSY">Đang giao</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

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
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td>
                  <b>{d.name}</b>
                  <br />
                  <span style={{ color: "#009ef7" }}>{d.phone}</span>
                </td>
                <td>
                  <span style={{ fontWeight: "bold", color: "#555" }}>{d.cccdNumber || "---"}</span>
                </td>
                <td>{d.hometown || "---"}</td>
                <td>{renderStatus(d.status)}</td>

                <td>
                  {(d.status === "ACTIVE" || d.status === "READY" || d.status === "BUSY") && (
                    <button className="btn-toggle-lock btn-lock" onClick={() => handleToggleLock(d.id, d.status, d.name)}>
                      🔒 Khóa TK
                    </button>
                  )}
                  {d.status === "LOCKED" && (
                    <button className="btn-toggle-lock btn-unlock" onClick={() => handleToggleLock(d.id, d.status, d.name)}>
                      ✅ Mở Khóa
                    </button>
                  )}
                  {d.status === "PENDING" && <span style={{ fontSize: "12px", color: "#888" }}>Đang chờ duyệt</span>}
                </td>

                <td>
                  {d.vehicleType}
                  <br />
                  <b style={{ color: "red" }}>{d.licensePlate}</b>
                </td>

                <td>
                  <img src={d.portraitUrl} className="thumb-img" onClick={() => setSelectedImage(d.portraitUrl)} />
                </td>
                <td>
                  <img src={d.cccdFrontUrl} className="thumb-img" onClick={() => setSelectedImage(d.cccdFrontUrl)} />
                </td>
                <td>
                  <img src={d.cccdBackUrl} className="thumb-img" onClick={() => setSelectedImage(d.cccdBackUrl)} />
                </td>
                <td>
                  <img src={d.vehiclePlateImageUrl} className="thumb-img" onClick={() => setSelectedImage(d.vehiclePlateImageUrl)} />
                </td>
                <td>
                  <img src={d.licenseImageUrl} className="thumb-img" onClick={() => setSelectedImage(d.licenseImageUrl)} />
                </td>
                <td>
                  <img src={d.vehiclePaperUrl} className="thumb-img" onClick={() => setSelectedImage(d.vehiclePaperUrl)} />
                </td>
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
