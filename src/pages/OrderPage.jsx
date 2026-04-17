import { useState, useEffect } from "react";
import ApiClient from "../ApiClient";
import "./OrderPage.css";

const VEHICLE_NAME_MAP = {
  BIKE: "Xe máy",
  CAR4: "Xe 4 chỗ",
  CAR7: "Xe 7 chỗ",
};

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orderIdSearch, setOrderIdSearch] = useState("");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ApiClient.get("/order/admin/all");
      setOrders(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn:", error);
    }
  };

  const handleLockDriver = async (driverId, driverName) => {
    if (window.confirm(`Bạn có chắc chắn muốn KHÓA tài khoản của tài xế ${driverName} vì chuyến đi này không?`)) {
      try {
        await ApiClient.post(`/admin/driver/toggle-lock?driverId=${driverId}&status=LOCKED`);
        alert(`Đã khóa tài khoản tài xế ${driverName} thành công!`);
      } catch (error) {
        alert("Lỗi khi khóa tài xế!");
        console.error(error);
      }
    }
  };
  const filteredOrders = orders.filter((order) => {
    let passTime = true;
    if (order.createdAt) {
      const orderDate = new Date(order.createdAt).getTime();
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start.getTime()) passTime = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end.getTime()) passTime = false;
      }
    }

    let passCustomer = true;
    if (customerSearch) {
      const search = customerSearch.toLowerCase();
      const cusName = (order.customerName || "").toLowerCase();
      const cusPhone = (order.customerPhone || "").toLowerCase();
      passCustomer = cusName.includes(search) || cusPhone.includes(search);
    }

    let passDriver = true;
    if (driverSearch) {
      const search = driverSearch.toLowerCase();
      const drvId = (order.driverId || "").toLowerCase();
      const drvName = (order.driverName || "").toLowerCase();
      const drvPhone = (order.driverPhone || "").toLowerCase();
      passDriver = drvId.includes(search) || drvName.includes(search) || drvPhone.includes(search);
    }

    let passStatus = true;
    if (statusFilter !== "ALL") {
      passStatus = order.status === statusFilter;
    }

    let passOrderId = true;
    if (orderIdSearch) {
      const search = orderIdSearch.toLowerCase().trim();
      const currentId = (order.id || order._id || "").toLowerCase();
      passOrderId = currentId.includes(search);
    }

    return passTime && passCustomer && passDriver && passStatus && passOrderId;
  });

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCustomerSearch("");
    setDriverSearch("");
    setStatusFilter("ALL");
    setOrderIdSearch("");
  };

  const formatFullDate = (isoString) => {
    if (!isoString) return "---";
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return "---";
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return <span style={{ color: "#ccc", fontSize: "11px" }}>Chưa có</span>;
    return (
      <div className="rating-stars">
        {"★".repeat(rating)}
        {"☆".repeat(5 - rating)}
      </div>
    );
  };

  const renderStatus = (status) => {
    switch (status) {
      case "SEARCHING":
        return <span className="badge badge-searching">Đang tìm xế</span>;
      case "FOUND":
      case "PICKING_UP":
      case "ARRIVED_PICKUP":
        return <span className="badge badge-searching">Đang lấy hàng</span>;
      case "DELIVERING":
        return <span className="badge badge-delivering">Đang giao</span>;
      case "COMPLETED":
        return <span className="badge badge-completed">Hoàn thành</span>;
      case "CANCELLED":
        return <span className="badge badge-cancelled">Đã hủy</span>;
      case "RETURNING":
        return <span className="badge badge-returning">Đang hoàn hàng</span>;
      case "RETURNED_COMPLETED":
        return <span className="badge badge-returned">Đã trả hàng</span>;
      case "TIMEOUT_ALL":
        return <span className="badge badge-cancelled">Không có xe</span>;
      default:
        return <span className="badge badge-searching">{status}</span>;
    }
  };

  return (
    <div className="order-container">
      <h1>QUẢN LÝ TẤT CẢ ĐƠN HÀNG</h1>

      <div className="filter-container">
        <div className="filter-group">
          <label>Từ ngày</label>
          <input type="date" className="filter-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Đến ngày</label>
          <input type="date" className="filter-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Mã đơn hàng</label>
          <input type="text" className="filter-input" placeholder="Nhập mã đơn..." value={orderIdSearch} onChange={(e) => setOrderIdSearch(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Khách hàng (Tên, SĐT)</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Nhập tên hoặc sđt khách..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tài xế (Mã, Tên, SĐT)</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Nhập mã ID, tên, sđt xế..."
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Trạng thái đơn</label>
          <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="COMPLETED">✅ Hoàn thành</option>
            <option value="DELIVERING">🚚 Đang giao hàng</option>
            <option value="SEARCHING">⏳ Đang tìm xế</option>
            <option value="CANCELLED">❌ Đã hủy</option>
            <option value="RETURNING">⚠️ Đang quay đầu</option>
            <option value="RETURNED_COMPLETED">📦 Đã trả lại hàng</option>
            <option value="TIMEOUT_ALL">🚫 Không có xe</option>
          </select>
        </div>

        <button className="btn-reset-filter" onClick={clearFilters}>
          Xóa Lọc
        </button>
      </div>

      <div style={{ marginBottom: 10, fontWeight: "bold", color: "#666" }}>Kết quả: Tìm thấy {filteredOrders.length} đơn hàng</div>

      {/* ========================================= */}
      {/* BẢNG HIỂN THỊ DỮ LIỆU ĐÃ LỌC              */}
      {/* ========================================= */}
      <div className="table-card">
        <table className="order-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Timelines (Thời gian)</th>
              <th>Khách hàng</th>
              <th>Tài xế nhận</th>
              <th>Lộ trình (A ➡️ B)</th>
              <th>Hàng hóa & Cước phí</th>
              <th>Đánh giá (Review)</th>
              <th>Trạng thái</th>
              <th>Bằng chứng</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id || order._id}>
                <td>
                  <div
                    style={{
                      color: "black",
                      fontWeight: "bold",
                      fontSize: "12px",
                      width: "100px",
                      wordBreak: "break-all",
                      lineHeight: "1.2",
                    }}
                  >
                    {order.id || order._id}
                  </div>
                </td>

                <td style={{ minWidth: "130px" }}>
                  <div className="text-time">
                    <b>Tạo:</b> {formatFullDate(order.createdAt)}
                  </div>
                  <div className="text-time">
                    <b>Nhận:</b> {formatTimeOnly(order.acceptedAt)}
                  </div>
                  <div className="text-time">
                    <b>Xong:</b> {formatTimeOnly(order.completedAt)}
                  </div>
                </td>

                {/* 3. Khách hàng */}
                <td style={{ minWidth: "150px" }}>
                  <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: "5px", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: "#888" }}>Người gửi:</span>
                    <br />
                    <b style={{ fontSize: "14px" }}>{order.customerName}</b>
                    <br />
                    <span style={{ color: "#007bff", fontWeight: "500" }}>{order.customerPhone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#888" }}>Người nhận:</span>
                    <br />
                    <b style={{ fontSize: "13px", color: "#e67e22" }}>{order.receiverName || "---"}</b>
                    <br />
                    <span style={{ color: "#007bff" }}>{order.receiverPhone || "---"}</span>
                  </div>
                </td>

                {/* 4. Tài xế */}
                <td style={{ minWidth: "150px" }}>
                  {order.driverId ? (
                    <>
                      <b style={{ fontSize: "14px", color: "#28a745" }}>{order.driverName || "Tài xế"}</b>
                      <br />
                      {/* HIỂN THỊ SĐT TÀI XẾ RÕ RÀNG */}
                      <span style={{ fontWeight: "bold", color: "#007bff", fontSize: "13px" }}>SĐT: {order.driverPhone || "---"}</span>
                      <br />
                      {/* HIỂN THỊ TÊN XE TIẾNG VIỆT */}
                      <span style={{ fontSize: "11px", color: "#666" }}>Xe: {VEHICLE_NAME_MAP[order.vehicleType] || order.vehicleType}</span>
                      <br />
                      {/* ID CHIA LÀM 2 DÒNG */}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#666",
                          width: "110px",
                          wordBreak: "break-all",
                          marginTop: "5px",
                          lineHeight: "1.2",
                        }}
                      >
                        ID: {order.driverId}
                      </div>

                      <button
                        className="btn-lock-mini"
                        style={{ marginTop: "8px", padding: "4px 8px", fontSize: "11px" }}
                        onClick={() => handleLockDriver(order.driverId, order.driverName)}
                      >
                        🔒 Khóa Tài xế
                      </button>
                    </>
                  ) : (
                    <span style={{ color: "#ccc", fontStyle: "italic" }}>Chưa có tài xế</span>
                  )}
                </td>

                {/* 5. Lộ trình */}
                <td style={{ minWidth: "250px", maxWidth: "300px" }}>
                  <div className="route-box">
                    <div className="route-text">
                      <b style={{ color: "#007bff" }}>Đón:</b> {order.pickupAddress}
                    </div>
                    <div className="route-text" style={{ marginTop: "4px" }}>
                      <b style={{ color: "#dc3545" }}>Giao:</b> {order.destinationAddress}
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "#888", fontWeight: "bold" }}>Km: {order.distance}</div>
                  </div>
                </td>

                {/* 6. Hàng hóa & Cước */}
                <td style={{ minWidth: "160px" }}>
                  <b style={{ color: "#d35400", fontSize: "15px" }}>{order.price}</b>
                  <span style={{ fontSize: "11px", marginLeft: 5, padding: "2px 4px", background: "#eee", borderRadius: 4 }}>
                    {order.paymentMethod === "SENDER" ? "Gửi trả ship" : "Nhận trả ship"}
                  </span>
                  <br />

                  <span style={{ fontWeight: "bold", color: order.shippingMode === "COD" ? "#dc3545" : "#28a745", fontSize: "13px" }}>
                    {order.shippingMode === "COD" ? `COD: ${order.goodsValue}đ` : "SHIP THƯỜNG"}
                  </span>
                  <br />

                  <span style={{ fontWeight: "500", color: "#333" }}>{order.cargoType}</span>
                  <br />
                  {order.goodsDetail && <div className="text-note">"{order.goodsDetail}"</div>}
                </td>

                {/* 7. Đánh giá từ Khách */}
                <td style={{ minWidth: "140px", maxWidth: "200px" }}>
                  {renderStars(order.customerRating)}
                  {order.customerReview && <div className="review-text">"{order.customerReview}"</div>}
                </td>

                {/* 8. Trạng thái */}
                <td>
                  {renderStatus(order.status)}
                  {order.status === "CANCELLED" && order.cancelReason && (
                    <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "5px", fontWeight: "bold" }}>Lý do: {order.cancelReason}</div>
                  )}
                </td>

                {/* 9. Ảnh bằng chứng */}
                <td style={{ textAlign: "center" }}>
                  {order.deliveryPhotoUrl && (
                    <img src={order.deliveryPhotoUrl} className="img-proof" onClick={() => setSelectedImage(order.deliveryPhotoUrl)} title="Ảnh giao hàng" />
                  )}
                  {order.cancelPhotoUrl && (
                    <img
                      src={order.cancelPhotoUrl}
                      className="img-proof"
                      style={{ borderColor: "red" }}
                      onClick={() => setSelectedImage(order.cancelPhotoUrl)}
                      title="Ảnh sự cố"
                    />
                  )}
                  {!order.deliveryPhotoUrl && !order.cancelPhotoUrl && <span style={{ color: "#ccc" }}>---</span>}
                </td>
              </tr>
            ))}

            {/* BÁO KẾT QUẢ RỖNG NẾU LỌC KHÔNG RA */}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: 30, color: "#888" }}>
                  Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL PHÓNG TO ẢNH BẰNG CHỨNG */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            style={{
              position: "absolute",
              top: "20px",
              right: "30px",
              background: "white",
              border: "none",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              fontWeight: "bold",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          <img src={selectedImage} alt="Bằng chứng" style={{ maxWidth: "90%", maxHeight: "90vh", borderRadius: "8px" }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default OrderPage;
