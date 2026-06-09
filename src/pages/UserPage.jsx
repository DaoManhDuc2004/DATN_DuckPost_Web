import { useState, useEffect, useCallback } from "react";
import ApiClient from "../ApiClient";
import "./UserPage.css";

const UserPage = () => {
  const [customers, setCustomers] = useState([]);
  const defaultFilters = {
    keyword: "",
    name: "",
    phone: "",
    email: "",
    hometown: "",
    gender: "",
    status: "",
  };

  const [filters, setFilters] = useState(defaultFilters);

  const [lockModal, setLockModal] = useState({
    open: false,
    customer: null,
    reason: "",
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const fetchCustomers = useCallback(
    async (currentFilters = filters) => {
      try {
        const params = new URLSearchParams();

        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value && value.trim()) {
            params.append(key, value.trim());
          }
        });

        const query = params.toString();
        const res = await ApiClient.get(`/admin/customers${query ? `?${query}` : ""}`);

        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Lỗi tải danh sách khách hàng:", error);
      }
    },
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchCustomers]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

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

  const openLockModal = (customer) => {
    setLockModal({
      open: true,
      customer,
      reason: "",
    });
  };

  const closeLockModal = () => {
    setLockModal({
      open: false,
      customer: null,
      reason: "",
    });
  };

  const handleLockCustomer = async () => {
    if (!lockModal.customer) return;

    const reason = lockModal.reason.trim();

    if (!reason) {
      alert("Vui lòng nhập lý do khóa tài khoản.");
      return;
    }

    if (!confirm(`Xác nhận khóa tài khoản khách hàng "${lockModal.customer.name}"?`)) {
      return;
    }

    try {
      setLoadingAction(true);

      const params = new URLSearchParams({
        customerId: lockModal.customer.id,
        reason,
      });

      await ApiClient.post(`/admin/customer/lock?${params.toString()}`);

      alert("Đã khóa tài khoản khách hàng.");
      closeLockModal();
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi khóa tài khoản khách hàng:", error);
      alert(error.response?.data || "Không thể khóa tài khoản khách hàng.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUnlockCustomer = async (customer) => {
    if (!confirm(`Xác nhận mở khóa tài khoản khách hàng "${customer.name}"?`)) {
      return;
    }

    try {
      setLoadingAction(true);

      await ApiClient.post(`/admin/customer/unlock?customerId=${customer.id}`);

      alert("Đã mở khóa tài khoản khách hàng.");
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi mở khóa tài khoản khách hàng:", error);
      alert(error.response?.data || "Không thể mở khóa tài khoản khách hàng.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="user-container">
      <h1>👥 QUẢN LÝ KHÁCH HÀNG ({customers.length})</h1>
      <div className="customer-filter-panel">
        <div className="customer-filter-header">
          <div>
            <h3>Bộ lọc khách hàng</h3>
            <p>Lọc theo tên, số điện thoại, email, quê quán, giới tính và trạng thái tài khoản.</p>
          </div>

          <div className="customer-filter-actions">
            <button className="btn-reset-customer" onClick={resetFilters}>
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="customer-filter-grid">
          <input placeholder="Tìm nhanh tên / SĐT / email..." value={filters.keyword} onChange={(e) => handleFilterChange("keyword", e.target.value)} />

          <input placeholder="Tên khách hàng" value={filters.name} onChange={(e) => handleFilterChange("name", e.target.value)} />

          <input placeholder="Số điện thoại" value={filters.phone} onChange={(e) => handleFilterChange("phone", e.target.value)} />

          <input placeholder="Email" value={filters.email} onChange={(e) => handleFilterChange("email", e.target.value)} />

          <input placeholder="Quê quán" value={filters.hometown} onChange={(e) => handleFilterChange("hometown", e.target.value)} />

          <select value={filters.gender} onChange={(e) => handleFilterChange("gender", e.target.value)}>
            <option value="">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      <div className="table-card full-table-card">
        <table className="user-table full-info-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã KH</th>
              <th>Họ và tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Quê quán</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hoạt động gần nhất</th>
              <th>Thông tin khóa</th>
              <th>Báo cáo sai hàng</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((user, index) => (
              <tr key={user.id || index}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>

                <td className="id-cell">{user.id || "---"}</td>

                <td>
                  <b>{user.name || "---"}</b>
                </td>

                <td className="phone-cell">{user.phone || "---"}</td>

                <td>{user.email || "---"}</td>

                <td>{user.birthday || "---"}</td>

                <td>{user.gender || "---"}</td>

                <td>{user.hometown || "---"}</td>

                <td>
                  {user.status === "ACTIVE" ? (
                    <span className="status-tag active-tag">Hoạt động</span>
                  ) : user.status === "LOCKED" ? (
                    <span className="status-tag locked-tag">Đã khóa</span>
                  ) : (
                    <span className="status-tag muted-tag">{user.status || "---"}</span>
                  )}
                </td>

                <td>{formatDateTime(user.createdAt)}</td>

                <td>{formatDateTime(user.lastActiveAt)}</td>

                <td>
                  {user.status === "LOCKED" ? (
                    <div className="lock-info">
                      <div className="lock-reason">{user.lockReason || "Không có lý do"}</div>
                      <div className="lock-time">{formatDateTime(user.lockedAt)}</div>
                    </div>
                  ) : (
                    <span className="sub-text">---</span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <b
                    style={{
                      color: (user.cargoMismatchReportCount || 0) >= 3 ? "#dc3545" : "#333",
                      fontSize: 16,
                    }}
                  >
                    {user.cargoMismatchReportCount || 0}
                  </b>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>lần</div>
                </td>

                <td>
                  {user.status === "LOCKED" ? (
                    <button className="btn-unlock-customer" disabled={loadingAction} onClick={() => handleUnlockCustomer(user)}>
                      Mở khóa
                    </button>
                  ) : (
                    <button className="btn-lock-customer" disabled={loadingAction} onClick={() => openLockModal(user)}>
                      Khóa TK
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <td colSpan="14" style={{ textAlign: "center", padding: 20, color: "#888" }}>
                  Chưa có khách hàng nào đăng ký.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {lockModal.open && (
        <div className="customer-lock-modal-overlay">
          <div className="customer-lock-modal">
            <div className="lock-modal-header">
              <div>
                <div className="lock-modal-badge">KHÓA TÀI KHOẢN</div>
                <h2>Khóa tài khoản khách hàng</h2>
                <p className="lock-modal-subtitle">Khách hàng sẽ không thể đăng nhập cho đến khi được mở khóa.</p>
              </div>

              <button type="button" className="lock-modal-close" onClick={closeLockModal} disabled={loadingAction}>
                ×
              </button>
            </div>

            <div className="customer-lock-info-box">
              <div className="customer-lock-avatar">{lockModal.customer?.name?.charAt(0)?.toUpperCase() || "K"}</div>

              <div>
                <div className="customer-lock-label">Khách hàng</div>
                <div className="customer-lock-name">{lockModal.customer?.name}</div>
              </div>
            </div>

            <label className="lock-reason-label">
              Lý do khóa <span>*</span>
            </label>

            <textarea
              className="lock-reason-textarea"
              value={lockModal.reason}
              onChange={(e) =>
                setLockModal({
                  ...lockModal,
                  reason: e.target.value,
                })
              }
              placeholder="Nhập lý do khóa tài khoản..."
              rows={5}
              maxLength={250}
              spellCheck={false}
            />

            <div className="lock-reason-meta">
              <span>Chọn lý do nhanh hoặc nhập lý do cụ thể.</span>
              <span>{lockModal.reason.length}/250</span>
            </div>

            <div className="quick-reasons">
              <button
                type="button"
                className={`reason-chip ${lockModal.reason === "Đặt đơn ảo nhiều lần" ? "active" : ""}`}
                onClick={() =>
                  setLockModal({
                    ...lockModal,
                    reason: "Đặt đơn ảo nhiều lần",
                  })
                }
              >
                Đặt đơn ảo
              </button>

              <button
                type="button"
                className={`reason-chip ${lockModal.reason === "Hủy đơn bất thường nhiều lần" ? "active" : ""}`}
                onClick={() =>
                  setLockModal({
                    ...lockModal,
                    reason: "Hủy đơn bất thường nhiều lần",
                  })
                }
              >
                Hủy đơn nhiều
              </button>

              <button
                type="button"
                className={`reason-chip ${lockModal.reason === "Cung cấp thông tin giao hàng sai lệch" ? "active" : ""}`}
                onClick={() =>
                  setLockModal({
                    ...lockModal,
                    reason: "Cung cấp thông tin giao hàng sai lệch",
                  })
                }
              >
                Thông tin sai
              </button>
              <button
                type="button"
                className={`reason-chip ${lockModal.reason === "Khai báo sai loại hàng nhiều lần" ? "active" : ""}`}
                onClick={() =>
                  setLockModal({
                    ...lockModal,
                    reason: "Khai báo sai loại hàng nhiều lần",
                  })
                }
              >
                Sai loại hàng
              </button>
            </div>

            <div className="lock-warning-box">Sau khi khóa, tài khoản khách hàng sẽ bị chặn đăng nhập trên ứng dụng.</div>

            <div className="modal-actions">
              <button className="btn-cancel-lock" onClick={closeLockModal} disabled={loadingAction}>
                Hủy
              </button>

              <button className="btn-confirm-lock" onClick={handleLockCustomer} disabled={loadingAction}>
                {loadingAction ? "Đang xử lý..." : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
