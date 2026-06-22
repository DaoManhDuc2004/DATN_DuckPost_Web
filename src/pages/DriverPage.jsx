import {
  useState,
  useEffect,
  useCallback,
} from "react";
import "./DriverPage.css";
import ApiClient from "../ApiClient";

const DriverPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
const defaultDateFilters = {
  createdFrom: "",
  createdTo: "",
};

const [dateFilters, setDateFilters] =
  useState(defaultDateFilters);

const invalidDateRange =
  dateFilters.createdFrom &&
  dateFilters.createdTo &&
  dateFilters.createdFrom > dateFilters.createdTo;

const fetchPendingDrivers = useCallback(
  async (currentFilters = {}) => {
    try {
      const params = new URLSearchParams();

      if (currentFilters.createdFrom) {
        params.append(
          "createdFrom",
          currentFilters.createdFrom,
        );
      }

      if (currentFilters.createdTo) {
        params.append(
          "createdTo",
          currentFilters.createdTo,
        );
      }

      const query = params.toString();

      const res = await ApiClient.get(
        `/admin/drivers/pending${
          query ? `?${query}` : ""
        }`,
      );

      setDrivers(
        Array.isArray(res.data) ? res.data : [],
      );
    } catch (error) {
      console.error(
        "Lỗi tải danh sách tài xế:",
        error,
      );
    }
  },
  [],
);

useEffect(() => {
  if (invalidDateRange) {
    return undefined;
  }

  fetchPendingDrivers(dateFilters);

  const interval = setInterval(() => {
    fetchPendingDrivers(dateFilters);
  }, 5000);

  return () => clearInterval(interval);
}, [
  dateFilters,
  invalidDateRange,
  fetchPendingDrivers,
]);

const formatDateTime = (value) => {
  if (!value) return "---";

  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

  const handleApprove = async (id) => {
    if (!confirm("Xác nhận duyệt tài xế này?")) return;
    try {
      await ApiClient.post(`/admin/approve/${id}`);

      alert("Đã duyệt thành công!");
      fetchPendingDrivers(dateFilters);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi duyệt: " + (error.response?.data || "Lỗi server"));
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Nhập lý do từ chối hồ sơ tài xế:", "Hồ sơ chưa đáp ứng yêu cầu xác minh của hệ thống");

    if (reason === null) return;

    if (!confirm("Bạn chắc chắn muốn TỪ CHỐI và XÓA hồ sơ này?")) return;

    try {
      const params = new URLSearchParams({
        reason: reason.trim() || "Hồ sơ chưa đáp ứng yêu cầu xác minh của hệ thống",
      });

      await ApiClient.delete(`/admin/reject/${id}?${params.toString()}`);

      alert("Đã từ chối, xóa hồ sơ và gửi email thông báo!");
      fetchPendingDrivers(dateFilters);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi từ chối: " + (error.response?.data || "Lỗi server"));
    }
  };

  return (
    <div>
      <h1>DANH SÁCH CHỜ DUYỆT ({drivers.length})</h1>
      <div className="driver-date-filter-panel">
  <div className="driver-date-filter-title">
    <div>
      <h3>Lọc theo ngày đăng ký</h3>
    </div>

    <button
      type="button"
      className="btn-reset-driver-date"
      onClick={() =>
        setDateFilters(defaultDateFilters)
      }
    >
      Xóa lọc
    </button>
  </div>

  <div className="driver-date-filter-fields">
    <label>
      <span>Từ ngày</span>

      <input
        type="date"
        value={dateFilters.createdFrom}
        onChange={(e) =>
          setDateFilters((prev) => ({
            ...prev,
            createdFrom: e.target.value,
          }))
        }
      />
    </label>

    <label>
      <span>Đến ngày</span>

      <input
        type="date"
        value={dateFilters.createdTo}
        min={dateFilters.createdFrom || undefined}
        onChange={(e) =>
          setDateFilters((prev) => ({
            ...prev,
            createdTo: e.target.value,
          }))
        }
      />
    </label>
  </div>

  {invalidDateRange && (
    <div className="driver-date-filter-error">
      Ngày bắt đầu không được lớn hơn ngày kết thúc.
    </div>
  )}
</div>
      <div className="table-container">
        <table border="1">
          <thead>
            <tr>
              <th style={{ minWidth: 150 }}>Tài xế</th>
              <th>Email</th>
              <th>Ngày đăng ký</th>
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
              <th style={{ minWidth: 180 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>
                  <b>{d.name}</b>
                  <br />
                  <span style={{ color: "#009ef7" }}>{d.phone}</span>
                </td>
                <td>{d.email || "Chưa có email"}</td>
                <td>{formatDateTime(d.createdAt)}</td>
                <td>
                  <b>{d.cccdNumber || "---"}</b>
                </td>
                <td>
                  {d.birthday}
                  <br />
                  {d.gender}
                </td>
                <td>{d.hometown || "Chưa cập nhật"}</td>
                <td>
                  {d.vehicleType}
                  <br />
                  <b style={{ color: "red" }}>{d.licensePlate}</b>
                </td>

                <td>
                  <img src={d.portraitUrl} className="img-preview" onClick={() => setSelectedImage(d.portraitUrl)} />
                </td>
                <td>
                  <img src={d.cccdFrontUrl} className="img-preview" onClick={() => setSelectedImage(d.cccdFrontUrl)} />
                </td>
                <td>
                  <img src={d.cccdBackUrl} className="img-preview" onClick={() => setSelectedImage(d.cccdBackUrl)} />
                </td>
                <td>
                  <img src={d.vehiclePlateImageUrl} className="img-preview" onClick={() => setSelectedImage(d.vehiclePlateImageUrl)} />
                </td>
                <td>
                  <img src={d.licenseImageUrl} className="img-preview" onClick={() => setSelectedImage(d.licenseImageUrl)} />
                </td>
                <td>
                  <img src={d.vehiclePaperUrl} className="img-preview" onClick={() => setSelectedImage(d.vehiclePaperUrl)} />
                </td>

                <td>
                  <div style={{ display: "flex", gap: "5px" }}>
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
            <button className="close-btn" onClick={() => setSelectedImage(null)}>
              Đóng X
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPage;
