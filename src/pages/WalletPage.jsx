import { useState, useEffect, useMemo } from "react";
import ApiClient from "../ApiClient";
import "./WalletPage.css";

const TRANSACTION_TYPES = [
  { value: "ALL", label: "Tất cả loại giao dịch" },
  { value: "TOPUP", label: "Nạp tiền VNPAY" },
  { value: "ORDER_DEDUCTION", label: "Trừ phí đơn hàng" },
  { value: "RANK_BONUS", label: "Thưởng hạng" },
  { value: "MILESTONE_BONUS", label: "Thưởng mốc chuyến" },
  { value: "ADMIN_ADD", label: "Admin cộng tiền" },
  { value: "ADMIN_DEDUCT", label: "Admin trừ tiền" },
  { value: "WITHDRAW", label: "Rút tiền" },
  { value: "REFUND", label: "Hoàn tiền" },
  { value: "SYSTEM_ADJUST", label: "Điều chỉnh hệ thống" },
  { value: "DEDUCTION", label: "Trừ chiết khấu cũ" },
  { value: "DEPOSIT", label: "Nạp tiền cũ" },
  {
    value: "WITHDRAW_REQUEST",
    label: "Yêu cầu rút tiền",
  },
  {
    value: "WITHDRAW_REFUND",
    label: "Hoàn tiền yêu cầu rút",
  },
];

const WalletPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [totalAppRevenue, setTotalAppRevenue] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [filterDriverId, setFilterDriverId] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [relatedCode, setRelatedCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
    fetchTransactions();
    fetchWithdrawals();
  }, []);

  const fetchData = async () => {
    try {
      const drvRes = await ApiClient.get("/admin/drivers/all");
      const driverList = Array.isArray(drvRes.data) ? drvRes.data.filter((d) => d.role === "DRIVER") : [];
      setDrivers(driverList);

      const ordRes = await ApiClient.get("/order/admin/all");
      let revenue = 0;

      if (Array.isArray(ordRes.data)) {
        ordRes.data.forEach((order) => {
          if (order.status === "COMPLETED" || order.status === "RETURNED_COMPLETED") {
            const priceNum = parseInt(order.price?.toString().replace(/\D/g, "") || 0, 10);
            if (priceNum > 0) {
              const driverWage = (priceNum - 5000) / 1.3;
              revenue += priceNum - driverWage;
            }
          }
        });
      }

      setTotalAppRevenue(revenue);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu ví:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get("/admin/wallet/transactions/all");
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi lấy lịch sử giao dịch:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setWithdrawalLoading(true);

      const res = await ApiClient.get("/admin/withdrawals");

      setWithdrawals(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi lấy yêu cầu rút tiền:", error);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const getDriverById = (driverId) => {
    return drivers.find((d) => d.id === driverId || d._id === driverId);
  };

  const getDriverName = (transaction) => {
    if (transaction.driverName) return transaction.driverName;
    return getDriverById(transaction.driverId)?.name || "Không rõ tài xế";
  };

  const getDriverPhone = (transaction) => {
    if (transaction.driverPhone) return transaction.driverPhone;
    return getDriverById(transaction.driverId)?.phone || "--";
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const driverName = getDriverName(t).toLowerCase();
      const driverPhone = getDriverPhone(t).toLowerCase();
      const note = (t.note || "").toLowerCase();
      const orderCode = (t.orderId || "").toLowerCase();
      const referenceCode = (t.referenceCode || "").toLowerCase();

      const search = searchText.trim().toLowerCase();
      const codeSearch = relatedCode.trim().toLowerCase();

      const passDriver = filterDriverId === "ALL" || t.driverId === filterDriverId;
      const passType = filterType === "ALL" || t.type === filterType;

      let passDate = true;

      if (filterStartDate) {
        passDate = passDate && new Date(t.createdAt) >= new Date(filterStartDate);
      }

      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        passDate = passDate && new Date(t.createdAt) <= end;
      }

      const passSearch = !search || driverName.includes(search) || driverPhone.includes(search) || note.includes(search);

      const passRelatedCode = !codeSearch || orderCode.includes(codeSearch) || referenceCode.includes(codeSearch);

      return passDriver && passType && passDate && passSearch && passRelatedCode;
    });
  }, [transactions, drivers, filterDriverId, filterType, filterStartDate, filterEndDate, searchText,relatedCode]);

  const filteredWithdrawals = useMemo(() => {
    if (withdrawalStatusFilter === "ALL") {
      return withdrawals;
    }

    return withdrawals.filter((item) => item.status === withdrawalStatusFilter);
  }, [withdrawals, withdrawalStatusFilter]);

  const stats = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);

        if (item.type === "TOPUP" || item.type === "DEPOSIT") {
          acc.totalTopup += amount;
        }

        if (item.type === "ORDER_DEDUCTION" || item.type === "DEDUCTION") {
          acc.totalOrderDeduction += Math.abs(amount);
        }

        if (item.type === "ADMIN_ADD") {
          acc.totalAdminAdd += Math.abs(amount);
        }

        if (item.type === "ADMIN_DEDUCT") {
          acc.totalAdminDeduct += Math.abs(amount);
        }

        if (amount > 0) {
          acc.totalIn += amount;
        }

        if (amount < 0) {
          acc.totalOut += Math.abs(amount);
        }

        return acc;
      },
      {
        totalTopup: 0,
        totalOrderDeduction: 0,
        totalAdminAdd: 0,
        totalAdminDeduct: 0,
        totalIn: 0,
        totalOut: 0,
      },
    );
  }, [filteredTransactions]);

  const handleAdjustSubmit = async () => {
    if (!selectedDriver) {
      alert("Chưa chọn tài xế!");
      return;
    }

    if (!adjustAmount || isNaN(adjustAmount) || Number(adjustAmount) <= 0) {
      alert("Số tiền không hợp lệ!");
      return;
    }

    if (!adjustReason.trim()) {
      alert("Vui lòng nhập lý do cộng/trừ ví!");
      return;
    }

    const amountNumber = Number(adjustAmount);
    const currentBalance = Number(selectedDriver.walletBalance || 0);

    if (!isAdding && amountNumber > currentBalance) {
      alert(`Không thể trừ ${amountNumber.toLocaleString("vi-VN")} đ. ` + `Số dư hiện tại của tài xế chỉ có ` + `${currentBalance.toLocaleString("vi-VN")} đ.`);
      return;
    }
    const finalAmount = isAdding ? amountNumber : -amountNumber;

    try {
      const url = `/admin/wallet/adjust` + `?driverId=${selectedDriver.id}` + `&amount=${finalAmount}` + `&reason=${encodeURIComponent(adjustReason.trim())}`;

      await ApiClient.post(url);

      alert("Cập nhật ví tài xế thành công!");
      setIsModalOpen(false);
      fetchData();
      fetchTransactions();
    } catch (error) {
      console.error("Lỗi cập nhật ví:", error);

      const message = error.response?.data || "Lỗi cập nhật ví tài xế!";

      alert(typeof message === "string" ? message : message.message || "Lỗi cập nhật ví tài xế!");
    }
  };

  const handleCompleteWithdrawal = async (withdrawal) => {
    const confirmed = window.confirm(
      `Xác nhận đã chuyển ${formatMoney(withdrawal.amount)} tới tài khoản:\n\n` +
        `${withdrawal.bankName}\n` +
        `${withdrawal.bankAccountNumber}\n` +
        `${withdrawal.bankAccountHolder}\n\n` +
        `Sau khi xác nhận, yêu cầu sẽ được đánh dấu hoàn tất.`,
    );

    if (!confirmed) return;

    try {
      await ApiClient.put(`/admin/withdrawals/${withdrawal.id}/complete`, {
        note: "Admin xác nhận đã chuyển khoản thủ công",
      });

      alert("Đã xác nhận giải ngân thành công!");

      await Promise.all([fetchWithdrawals(), fetchData(), fetchTransactions()]);
    } catch (error) {
      console.error("Lỗi xác nhận giải ngân:", error);

      const message = error.response?.data?.message || error.response?.data || "Không thể xác nhận giải ngân!";

      alert(message);
    }
  };

  const handleRejectWithdrawal = async (withdrawal) => {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu rút tiền:", "Thông tin tài khoản ngân hàng không hợp lệ");

    if (reason === null) return;

    if (!reason.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }

    const confirmed = window.confirm(`Từ chối yêu cầu và hoàn lại ${formatMoney(withdrawal.amount)} vào ví tài xế?`);

    if (!confirmed) return;

    try {
      await ApiClient.put(`/admin/withdrawals/${withdrawal.id}/reject`, {
        note: reason.trim(),
      });

      alert("Đã từ chối yêu cầu và hoàn tiền vào ví tài xế!");

      await Promise.all([fetchWithdrawals(), fetchData(), fetchTransactions()]);
    } catch (error) {
      console.error("Lỗi từ chối yêu cầu:", error);

      const message = error.response?.data?.message || error.response?.data || "Không thể từ chối yêu cầu!";

      alert(message);
    }
  };

  const openAdjustModal = (driver, type) => {
    setSelectedDriver(driver);
    setIsAdding(type === "ADD");
    setAdjustAmount("");
    setAdjustReason(type === "ADD" ? "Admin cộng tiền trực tiếp" : "Admin trừ tiền trực tiếp");
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setFilterDriverId("ALL");
    setFilterType("ALL");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchText("");
    setRelatedCode("");
  };

  const formatMoney = (value) => {
    const number = Number(value || 0);
    return `${Math.round(number).toLocaleString("vi-VN")} đ`;
  };

  const formatSignedMoney = (value) => {
    const number = Number(value || 0);
    return `${number > 0 ? "+" : ""}${Math.round(number).toLocaleString("vi-VN")} đ`;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleString("vi-VN");
  };

  const getTypeLabel = (type) => {
    const found = TRANSACTION_TYPES.find((item) => item.value === type);
    return found ? found.label : type || "Giao dịch ví";
  };

  const getTypeClass = (type) => {
    if (["TOPUP", "DEPOSIT"].includes(type)) return "topup";
    if (["ORDER_DEDUCTION", "DEDUCTION", "ADMIN_DEDUCT", "WITHDRAW", "WITHDRAW_REQUEST"].includes(type)) {
      return "deduct";
    }
    if (["RANK_BONUS", "MILESTONE_BONUS", "ADMIN_ADD", "REFUND", "WITHDRAW_REFUND"].includes(type)) {
      return "bonus";
    }
    return "neutral";
  };

  const getWithdrawalStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Chờ giải ngân";

      case "COMPLETED":
        return "Đã chuyển khoản";

      case "REJECTED":
        return "Đã từ chối";

      default:
        return status || "--";
    }
  };

  const getWithdrawalStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "pending";

      case "COMPLETED":
        return "completed";

      case "REJECTED":
        return "rejected";

      default:
        return "";
    }
  };

  const getProviderLabel = (provider) => {
    if (!provider) return "SYSTEM";
    return provider;
  };

  return (
    <div className="wallet-container">
      <div className="wallet-page-header">
        <div>
          <p className="wallet-eyebrow">DuckPost Finance</p>
          <h1>Quản lý ví & giao dịch tài xế</h1>
          <p>Theo dõi nạp tiền, trừ phí đơn hàng, thưởng và điều chỉnh ví từ admin.</p>
        </div>

        <button
          className="btn-refresh"
          onClick={() => {
            fetchData();
            fetchTransactions();
            fetchWithdrawals();
          }}
        >
          Làm mới dữ liệu
        </button>
      </div>

      <div className="dashboard-row">
        <div className="stat-card revenue">
          <div className="stat-title">Doanh thu chiết khấu app</div>
          <div className="stat-value">{formatMoney(totalAppRevenue)}</div>
        </div>

        <div className="stat-card liabilities">
          <div className="stat-title">Tổng tiền trong ví tài xế</div>
          <div className="stat-value">{formatMoney(drivers.reduce((s, d) => s + (d.walletBalance || 0), 0))}</div>
        </div>

        <div className="stat-card topup">
          <div className="stat-title">Tổng tiền đã nạp</div>
          <div className="stat-value">{formatMoney(stats.totalTopup)}</div>
        </div>

        <div className="stat-card deduction">
          <div className="stat-title">Tổng phí đơn đã trừ</div>
          <div className="stat-value">{formatMoney(stats.totalOrderDeduction)}</div>
        </div>
      </div>

      <div className="section-card withdrawal-admin-section">
        <div className="section-title-row">
          <div>
            <h3>Yêu cầu rút tiền</h3>

            <p>Admin kiểm tra thông tin ngân hàng, thực hiện chuyển khoản thủ công và xác nhận kết quả.</p>
          </div>

          <select className="withdrawal-filter" value={withdrawalStatusFilter} onChange={(e) => setWithdrawalStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>

            <option value="PENDING">Chờ giải ngân</option>

            <option value="COMPLETED">Đã chuyển khoản</option>

            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>

        <div className="withdrawal-summary">
          <div>
            <span>Đang chờ xử lý</span>

            <b>{withdrawals.filter((item) => item.status === "PENDING").length} phiếu</b>
          </div>

          <div>
            <span>Tổng tiền chờ giải ngân</span>

            <b className="money-negative">
              {formatMoney(withdrawals.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.amount || 0), 0))}
            </b>
          </div>
        </div>

        <div className="table-scroll">
          <table className="withdrawal-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Tài xế</th>
                <th>Ngân hàng</th>
                <th>Số tài khoản</th>
                <th>Chủ tài khoản</th>
                <th>Số tiền</th>
                <th>Thời gian tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredWithdrawals.map((item) => (
                <tr key={item.id || item._id}>
                  <td className="withdrawal-code">{item.referenceCode}</td>

                  <td>
                    <b>{item.driverName}</b>
                    <br />
                    <small>{item.driverPhone}</small>
                  </td>

                  <td>{item.bankName}</td>

                  <td>
                    <b>{item.bankAccountNumber}</b>
                  </td>

                  <td>{item.bankAccountHolder}</td>

                  <td>
                    <b className="money-negative">{formatMoney(item.amount)}</b>
                  </td>

                  <td className="date-cell">{formatDate(item.createdAt)}</td>

                  <td>
                    <span className={`withdrawal-status ${getWithdrawalStatusClass(item.status)}`}>{getWithdrawalStatusLabel(item.status)}</span>

                    {item.adminNote && <div className="withdrawal-note">{item.adminNote}</div>}
                  </td>

                  <td>
                    {item.status === "PENDING" ? (
                      <div className="withdrawal-actions">
                        <button className="btn-withdraw-complete" onClick={() => handleCompleteWithdrawal(item)}>
                          Đã chuyển
                        </button>

                        <button className="btn-withdraw-reject" onClick={() => handleRejectWithdrawal(item)}>
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="processed-text">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {withdrawalLoading && <p className="empty-msg">Đang tải yêu cầu rút tiền...</p>}

        {!withdrawalLoading && filteredWithdrawals.length === 0 && <p className="empty-msg">Không có yêu cầu rút tiền phù hợp.</p>}
      </div>

      <div className="section-card">
        <div className="section-title-row">
          <div>
            <h3>Danh sách ví đối tác</h3>
            <p>Admin có thể cộng hoặc trừ tiền ví tài xế. Mỗi thao tác sẽ sinh lịch sử giao dịch.</p>
          </div>
        </div>

        <table className="wallet-table">
          <thead>
            <tr>
              <th>Thông tin tài xế</th>
              <th>Số dư hiện tại</th>
              <th>Trạng thái ví</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <b>{driver.name}</b>
                  <br />
                  <small>{driver.phone}</small>
                </td>

                <td>
                  <b className={driver.walletBalance < 0 ? "money-negative" : "money-positive"}>{formatMoney(driver.walletBalance)}</b>
                </td>

                <td>
                  <span className={driver.walletBalance < 0 ? "wallet-status danger" : "wallet-status good"}>
                    {driver.walletBalance < 0 ? "Âm ví" : "Bình thường"}
                  </span>
                </td>

                <td>
                  <button className="btn-sm btn-add" onClick={() => openAdjustModal(driver, "ADD")}>
                    + Cộng ví
                  </button>

                  <button className="btn-sm btn-sub" onClick={() => openAdjustModal(driver, "SUB")}>
                    - Trừ ví
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-card history-section">
        <div className="history-header">
          <div>
            <h3>Nhật ký giao dịch ví</h3>
            <p>Lưu lại số dư trước/sau, loại giao dịch, mã đơn hoặc mã tham chiếu để tra cứu về sau.</p>
          </div>
        </div>

        <div className="history-filters advanced">
          <input type="text" placeholder="Tìm tên, SĐT, ghi chú, mã giao dịch..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            <input
  type="text"
  placeholder="Lọc mã đơn hoặc mã tham chiếu..."
  value={relatedCode}
  onChange={(e) => setRelatedCode(e.target.value)}
/>
          <select value={filterDriverId} onChange={(e) => setFilterDriverId(e.target.value)}>
            <option value="ALL">Tất cả tài xế</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} - {d.phone}
              </option>
            ))}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            {TRANSACTION_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />

          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />

          <button className="btn-reset-filter" onClick={resetFilters}>
            Xóa lọc
          </button>
        </div>

        <div className="transaction-summary-row">
          <div>
            <span>Tiền vào</span>
            <b className="money-positive">{formatMoney(stats.totalIn)}</b>
          </div>

          <div>
            <span>Tiền ra</span>
            <b className="money-negative">{formatMoney(stats.totalOut)}</b>
          </div>

          <div>
            <span>Admin cộng</span>
            <b className="money-positive">{formatMoney(stats.totalAdminAdd)}</b>
          </div>

          <div>
            <span>Admin trừ</span>
            <b className="money-negative">{formatMoney(stats.totalAdminDeduct)}</b>
          </div>
        </div>

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tài xế</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Số dư trước</th>
                <th>Số dư sau</th>
                <th>Mã liên quan</th>
                <th>Nguồn</th>
                <th>Chi tiết</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id || t._id || `${t.createdAt}-${t.referenceCode}`}>
                  <td className="date-cell">{formatDate(t.createdAt)}</td>

                  <td>
                    <b>{getDriverName(t)}</b>
                    <br />
                    <small>{getDriverPhone(t)}</small>
                  </td>

                  <td>
                    <span className={`type-tag ${getTypeClass(t.type)}`}>{getTypeLabel(t.type)}</span>
                  </td>

                  <td>
                    <b className={Number(t.amount || 0) >= 0 ? "money-positive" : "money-negative"}>{formatSignedMoney(t.amount)}</b>
                  </td>

                  <td>{t.balanceBefore !== undefined ? formatMoney(t.balanceBefore) : "--"}</td>

                  <td>{t.balanceAfter !== undefined ? formatMoney(t.balanceAfter) : "--"}</td>

                  <td className="ref-cell">{t.orderId || t.referenceCode || "--"}</td>

                  <td>{getProviderLabel(t.paymentProvider)}</td>

                  <td>
                    <button className="btn-detail" onClick={() => setSelectedTransaction(t)}>
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <p className="empty-msg">Đang tải lịch sử giao dịch...</p>}

        {!loading && filteredTransactions.length === 0 && <p className="empty-msg">Không có dữ liệu giao dịch phù hợp.</p>}
      </div>

      {isModalOpen && selectedDriver && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className={isAdding ? "modal-title-add" : "modal-title-sub"}>{isAdding ? "Cộng tiền ví" : "Trừ tiền ví"}</h3>

            <p className="modal-driver-name">
              {selectedDriver.name} - {selectedDriver.phone}
            </p>

            <div className="input-group">
              <label>Số tiền (VNĐ)</label>
              <input type="number" min="0" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Lý do</label>
              <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            </div>

            <div className="modal-note-box">Thao tác này sẽ thay đổi số dư ví và tạo một giao dịch lịch sử. Không nên sửa/xóa lịch sử giao dịch thủ công.</div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                Hủy
              </button>

              <button className="btn-save" style={{ backgroundColor: isAdding ? "#16a34a" : "#dc2626" }} onClick={handleAdjustSubmit}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-box transaction-detail-modal">
            <h3>Chi tiết giao dịch ví</h3>

            <div className="detail-grid">
              <div>
                <span>Tài xế</span>
                <b>{getDriverName(selectedTransaction)}</b>
              </div>

              <div>
                <span>Số điện thoại</span>
                <b>{getDriverPhone(selectedTransaction)}</b>
              </div>

              <div>
                <span>Loại giao dịch</span>
                <b>{getTypeLabel(selectedTransaction.type)}</b>
              </div>

              <div>
                <span>Số tiền</span>
                <b className={Number(selectedTransaction.amount || 0) >= 0 ? "money-positive" : "money-negative"}>
                  {formatSignedMoney(selectedTransaction.amount)}
                </b>
              </div>

              <div>
                <span>Số dư trước</span>
                <b>{selectedTransaction.balanceBefore !== undefined ? formatMoney(selectedTransaction.balanceBefore) : "--"}</b>
              </div>

              <div>
                <span>Số dư sau</span>
                <b>{selectedTransaction.balanceAfter !== undefined ? formatMoney(selectedTransaction.balanceAfter) : "--"}</b>
              </div>

              <div>
                <span>Mã đơn</span>
                <b>{selectedTransaction.orderId || "--"}</b>
              </div>

              <div>
                <span>Mã tham chiếu</span>
                <b>{selectedTransaction.referenceCode || "--"}</b>
              </div>

              <div>
                <span>Nguồn</span>
                <b>{getProviderLabel(selectedTransaction.paymentProvider)}</b>
              </div>

              <div>
                <span>Trạng thái</span>
                <b>{selectedTransaction.status || "SUCCESS"}</b>
              </div>

              <div className="detail-full">
                <span>Ghi chú</span>
                <b>{selectedTransaction.note || "Không có ghi chú"}</b>
              </div>

              <div className="detail-full">
                <span>Thời gian</span>
                <b>{formatDate(selectedTransaction.createdAt)}</b>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedTransaction(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
