import { useState, useEffect, useCallback } from "react";
import "./driverManagerByAdmin.css";
import ApiClient from "../ApiClient";

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

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

const formatDateTime = (value) => {
  if (!value) return "---";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getDriverId = (driver) => {
  if (!driver) return "";
  if (driver.id) return driver.id;
  if (typeof driver._id === "string") return driver._id;
  if (driver._id?.$oid) return driver._id.$oid;
  return "";
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const documentFields = [
  { key: "portraitUrl", label: "Ảnh chân dung" },
  { key: "cccdFrontUrl", label: "CCCD mặt trước" },
  { key: "cccdBackUrl", label: "CCCD mặt sau" },
  { key: "vehiclePlateImageUrl", label: "Ảnh biển số" },
  { key: "licenseImageUrl", label: "Bằng lái" },
  { key: "vehiclePaperUrl", label: "Giấy tờ xe" },
];

const DriverManagerByAdmin = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
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
    } catch (error) {
      console.error("Lỗi tải danh sách tài xế:", error);
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
      setSelectedDriver(null);
    } catch (error) {
      alert("Lỗi hệ thống khi thao tác!");
      console.error(error);
    }
  };

  const handleRestoreRank = async (driver) => {
    const driverId = getDriverId(driver);

    if (!driverId) {
      alert("Không tìm thấy mã tài xế.");
      return;
    }

    const reason = window.prompt(`Nhập lý do phục hồi hạng cho tài xế "${driver.name}":`, "Tài xế nghỉ có phép / có lý do chính đáng và đã báo cáo qua Zalo");

    if (reason === null) return;

    if (!window.confirm(`Xác nhận phục hồi 1 hạng cho tài xế "${driver.name}"?`)) {
      return;
    }

    try {
      const params = new URLSearchParams({
        driverId,
        reason: reason.trim() || "Tài xế có lý do nghỉ hợp lệ",
      });

      const res = await ApiClient.post(`/admin/driver/restore-rank?${params.toString()}`);

      alert(res.data || "Đã phục hồi hạng tài xế.");
      fetchAll(filters);
      setSelectedDriver(null);
    } catch (error) {
      console.error("Lỗi phục hồi hạng:", error);
      alert(error.response?.data || "Không thể phục hồi hạng tài xế.");
    }
  };

  const renderStatus = (status) => {
    const statusMap = {
      ACTIVE: { label: "Đã duyệt", className: "status-active" },
      PENDING: { label: "Chờ duyệt", className: "status-pending" },
      READY: { label: "Sẵn sàng", className: "status-ready" },
      BUSY: { label: "Đang giao", className: "status-busy" },
      LOCKED: { label: "Đã khóa", className: "status-locked" },
    };

    const current = statusMap[status] || {
      label: status || "---",
      className: "status-muted",
    };

    return <span className={`status-badge ${current.className}`}>{current.label}</span>;
  };

  const renderDocumentSummary = (driver) => {
    const total = documentFields.length;
    const uploaded = documentFields.filter((item) => !!driver[item.key]).length;

    return (
      <div className="doc-summary">
        <b>
          {uploaded}/{total}
        </b>
        <span> giấy tờ</span>
      </div>
    );
  };

  const renderActionButton = (driver) => {
    const driverId = getDriverId(driver);

    if (driver.status === "PENDING") {
      return <span className="sub-text">Đang chờ duyệt</span>;
    }

    if (driver.status === "LOCKED") {
      return (
        <button className="btn-toggle-lock btn-unlock" onClick={() => handleToggleLock(driverId, driver.status, driver.name)}>
          Mở khóa
        </button>
      );
    }

    return (
      <button className="btn-toggle-lock btn-lock" onClick={() => handleToggleLock(driverId, driver.status, driver.name)}>
        Khóa TK
      </button>
    );
  };

  return (
    <div className="manager-container">
      <div className="page-heading">
        <div>
          <h1>Quản lý tài xế</h1>
          <p>Quản lý hồ sơ, giấy tờ, trạng thái hoạt động và ví tài xế.</p>
        </div>

        <div className="driver-count-card">
          <span>Tổng tài xế</span>
          <b>{drivers.length}</b>
        </div>
      </div>

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

      <div className="table-responsive driver-table-card">
        <table className="manager-table driver-compact-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tài xế</th>
              <th>Liên hệ</th>
              <th>Thông tin xe</th>
              <th>Trạng thái</th>
              <th>Ví / Chuyến</th>
              <th>Đánh giá</th>
              <th>Hồ sơ</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {drivers.map((driver, index) => {
              const driverId = getDriverId(driver);

              return (
                <tr key={driverId || index}>
                  <td className="index-cell">{index + 1}</td>

                  <td className="driver-info-cell">
                    <div className="driver-profile">
                      <div className="driver-avatar">{getInitials(driver.name)}</div>

                      <div>
                        <div className="driver-name">{driver.name || "---"}</div>
                        <div className="sub-text id-line">ID: {driverId || "---"}</div>
                        <div className="sub-text">{driver.hometown || "---"}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="primary-text">{driver.phone || "---"}</div>
                    <div className="sub-text wrap-text">{driver.email || "---"}</div>
                    <div className="sub-text">CCCD: {driver.cccdNumber || "---"}</div>
                  </td>

                  <td>
                    <div className="primary-text">{driver.vehicleType || "---"}</div>
                    <div className="license-plate-text">{driver.licensePlate || "---"}</div>
                  </td>

                  <td>{renderStatus(driver.status)}</td>

                  <td>
                    <div className="primary-text">{money(driver.walletBalance)}</div>
                    <div className="sub-text">{driver.weeklyTrips ?? 0} chuyến/tuần</div>
                    <div className="sub-text">Hạng: {driver.driverRank || "NONE"}</div>
                  </td>

                  <td>
                    <div className="primary-text">{Number(driver.averageRating || 0).toFixed(1)} ⭐</div>
                    <div className="sub-text">{driver.totalRatings || 0} lượt</div>
                  </td>

                  <td>
                    {renderDocumentSummary(driver)}
                    <button className="btn-detail" onClick={() => setSelectedDriver(driver)}>
                      Xem chi tiết
                    </button>
                  </td>

                  <td>
                    <div>{formatDateTime(driver.createdAt)}</div>
                    <div className="sub-text">Online: {formatDateTime(driver.lastActiveAt)}</div>
                  </td>

                  <td>{renderActionButton(driver)}</td>
                </tr>
              );
            })}

            {drivers.length === 0 && (
              <tr>
                <td colSpan="10" className="empty-cell">
                  Chưa có tài xế nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDriver && (
        <div className="modal-backdrop" onClick={() => setSelectedDriver(null)}>
          <div className="driver-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedDriver.name || "Chi tiết tài xế"}</h2>
                <p>{selectedDriver.email || "---"}</p>
              </div>

              <button className="btn-close-modal" onClick={() => setSelectedDriver(null)}>
                ✕
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <h3>Thông tin cá nhân</h3>
                <p>
                  <b>Mã tài xế:</b> {getDriverId(selectedDriver) || "---"}
                </p>
                <p>
                  <b>Số điện thoại:</b> {selectedDriver.phone || "---"}
                </p>
                <p>
                  <b>CCCD:</b> {selectedDriver.cccdNumber || "---"}
                </p>
                <p>
                  <b>Ngày sinh:</b> {selectedDriver.birthday || "---"}
                </p>
                <p>
                  <b>Giới tính:</b> {selectedDriver.gender || "---"}
                </p>
                <p>
                  <b>Quê quán:</b> {selectedDriver.hometown || "---"}
                </p>
              </div>

              <div className="detail-section">
                <h3>Xe & hoạt động</h3>
                <p>
                  <b>Loại xe:</b> {selectedDriver.vehicleType || "---"}
                </p>
                <p>
                  <b>Biển số:</b> {selectedDriver.licensePlate || "---"}
                </p>
                <p>
                  <b>Trạng thái:</b> {renderStatus(selectedDriver.status)}
                </p>
                <p>
                  <b>Hạng:</b> {selectedDriver.driverRank || "NONE"}
                </p>
                <button className="btn-restore-rank" onClick={() => handleRestoreRank(selectedDriver)}>
                  Phục hồi 1 hạng
                </button>
                <p>
                  <b>Chuyến/tuần:</b> {selectedDriver.weeklyTrips ?? 0}
                </p>
              </div>

              <div className="detail-section">
                <h3>Ví & đánh giá</h3>
                <p>
                  <b>Số dư ví:</b> {money(selectedDriver.walletBalance)}
                </p>
                <p>
                  <b>Đánh giá TB:</b> {Number(selectedDriver.averageRating || 0).toFixed(1)} ⭐
                </p>
                <p>
                  <b>Lượt đánh giá:</b> {selectedDriver.totalRatings || 0}
                </p>
                <p>
                  <b>Ngày tạo:</b> {formatDateTime(selectedDriver.createdAt)}
                </p>
                <p>
                  <b>Hoạt động gần nhất:</b> {formatDateTime(selectedDriver.lastActiveAt)}
                </p>
              </div>

              <div className="detail-section">
                <h3>Thông tin khóa</h3>
                <p>
                  <b>Lý do:</b> {selectedDriver.lockReason || "---"}
                </p>
                <p>
                  <b>Thời gian khóa:</b> {formatDateTime(selectedDriver.lockedAt)}
                </p>
                <div className="modal-actions">{renderActionButton(selectedDriver)}</div>
              </div>
            </div>

            <div className="document-section">
              <h3>Hình ảnh hồ sơ</h3>

              <div className="document-grid">
                {documentFields.map((item) => (
                  <div className="document-card" key={item.key}>
                    <span>{item.label}</span>

                    {selectedDriver[item.key] ? (
                      <img src={selectedDriver[item.key]} alt={item.label} onClick={() => setSelectedImage(selectedDriver[item.key])} />
                    ) : (
                      <div className="empty-image">Chưa có ảnh</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
