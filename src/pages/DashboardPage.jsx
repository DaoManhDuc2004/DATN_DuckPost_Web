import { useEffect, useMemo, useState } from "react";
import ApiClient from "../ApiClient";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Dashboard.css";

const COMPLETED_STATUSES = ["COMPLETED", "RETURNED_COMPLETED"];

const CANCELLED_STATUSES = ["CANCELLED", "CUSTOMER_CANCELLED", "DRIVER_CANCELLED"];

const TIMEOUT_STATUSES = ["TIMEOUT_ALL"];

const ACTIVE_ORDER_STATUSES = [
  "SEARCHING",
  "FOUND",
  "PICKING_UP",
  "ARRIVED_PICKUP",
  "DELIVERING",
  "RETURNING",
];

const STATUS_LABELS = {
  SEARCHING: "Đang tìm tài xế",
  FOUND: "Đã có tài xế",
  PICKING_UP: "Tài xế đang đến điểm lấy",
  ARRIVED_PICKUP: "Đã đến điểm lấy",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  CUSTOMER_CANCELLED: "Khách hủy",
  DRIVER_CANCELLED: "Tài xế hủy",
  RETURNING: "Đang hoàn hàng",
  RETURNED_COMPLETED: "Đã hoàn hàng",
  TIMEOUT_ALL: "Không tìm được TX",
};

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "SEARCHING", label: "Đang tìm tài xế" },
  { value: "FOUND", label: "Đã có tài xế" },
  { value: "PICKING_UP", label: "Tài xế đang đến điểm lấy" },
  { value: "ARRIVED_PICKUP", label: "Đã đến điểm lấy" },
  { value: "DELIVERING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "RETURNING", label: "Đang hoàn hàng" },
  { value: "RETURNED_COMPLETED", label: "Đã hoàn hàng" },
  { value: "TIMEOUT_ALL", label: "Không tìm được tài xế" },
];

const VEHICLE_LABELS = {
  BIKE: "Xe máy",
  CAR4: "Ô tô",
  CAR7: "Bán tải",
  "Xe máy": "Xe máy",
  "Ô tô": "Ô tô",
  "Bán tải": "Bán tải",
  "Xe tải nhỏ": "Ô tô",
  "Xe tải to": "Bán tải",
};

const VEHICLE_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả phương tiện" },
  { value: "BIKE", label: "Xe máy" },
  { value: "CAR4", label: "Ô tô / Xe tải nhỏ" },
  { value: "CAR7", label: "Bán tải / Xe tải to" },
];

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#475569",
];

const getDocumentId = (item) => {
  if (!item) return "";
  if (item.id) return item.id;
  if (typeof item._id === "string") return item._id;
  if (item._id?.$oid) return item._id.$oid;
  return "";
};

const parseDate = (value) => {
  if (!value) return null;

  if (value?.$date) {
    const date = new Date(value.$date);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseMoney = (value) => {
  if (typeof value === "number") return value;
  return Number(value?.toString().replace(/\D/g, "") || 0);
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const getDaysBetween = (start, end) => {
  if (!start || !end) return 0;

  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - start.getTime()) / oneDay);
};

const normalizeVehicleType = (value) => {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v.includes("BIKE") || v.includes("XE MÁY") || v.includes("MOTOR")) {
    return "BIKE";
  }

  if (v.includes("CAR7") || v.includes("BÁN TẢI") || v.includes("XE TẢI TO")) {
    return "CAR7";
  }

  if (
    v.includes("CAR4") ||
    v.includes("Ô TÔ") ||
    v.includes("OTO") ||
    v.includes("CAR") ||
    v.includes("XE TẢI NHỎ")
  ) {
    return "CAR4";
  }

  return v || "UNKNOWN";
};

const getOrderVehicleType = (order) => {
  return normalizeVehicleType(
    order.vehicleType ||
      order.type ||
      order.driverVehicleType ||
      order.vehicle ||
      order.driverVehicle ||
      ""
  );
};

const getVehicleLabel = (value) => {
  const code = normalizeVehicleType(value);
  return VEHICLE_LABELS[code] || VEHICLE_LABELS[value] || value || "Không rõ";
};

const getOrderStatus = (order) => {
  return String(order.status || "UNKNOWN")
    .trim()
    .toUpperCase();
};

const getCancelReason = (order) => {
  const reason =
    order.cancelReason ||
    order.reason ||
    order.cancel_reason ||
    order.cancelNote ||
    order.note ||
    "";

  const cleanedReason = String(reason || "").trim();

  if (!cleanedReason) {
    return "Không có lý do";
  }

  if (cleanedReason.length > 45) {
    return `${cleanedReason.substring(0, 45)}...`;
  }

  return cleanedReason;
};

const getPlatformRevenue = (order) => {
  const price = parseMoney(order.price);
  const status = getOrderStatus(order);

  if (!COMPLETED_STATUSES.includes(status) || price <= 0) {
    return 0;
  }

  const driverWage = (price - 5000) / 1.3;
  return Math.max(0, Math.round(price - driverWage));
};

const getGrossRevenue = (order) => {
  const status = getOrderStatus(order);

  if (!COMPLETED_STATUSES.includes(status)) return 0;
  return parseMoney(order.price);
};

const getFilterRange = (customRange) => {
  const start = customRange?.startDate
    ? new Date(`${customRange.startDate}T00:00:00`)
    : null;

  const endDisplay = customRange?.endDate
    ? new Date(`${customRange.endDate}T00:00:00`)
    : null;

  const end = endDisplay ? new Date(endDisplay) : null;

  if (end) {
    end.setDate(end.getDate() + 1);
  }

  const days = getDaysBetween(start, end);

  return {
    start,
    end,
    label:
      start && endDisplay
        ? `${start.toLocaleDateString("vi-VN")} - ${endDisplay.toLocaleDateString("vi-VN")}`
        : "Khoảng thời gian tùy chọn",
    groupType: days > 62 ? "MONTH" : "DAY",
  };
};

const isInRange = (value, range) => {
  const date = parseDate(value);

  if (!date) return false;
  if (range.start && date < range.start) return false;
  if (range.end && date >= range.end) return false;

  return true;
};

const getDayKey = (date) =>
  date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const getMonthKey = (date) => `T${date.getMonth() + 1}/${date.getFullYear()}`;

const buildTimeSeries = (orders, range) => {
  const map = new Map();

  if (range.groupType === "DAY" && range.start && range.end) {
    const cursor = new Date(range.start);

    while (cursor < range.end) {
      const key = getDayKey(cursor);

      map.set(key, {
        name: key,
        totalOrders: 0,
        completedOrders: 0,
        grossRevenue: 0,
        platformRevenue: 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    const dates = orders.map((order) => parseDate(order.createdAt)).filter(Boolean);

    if (dates.length === 0) {
      return [];
    }

    const start =
      range.start || new Date(Math.min(...dates.map((date) => date.getTime())));

    const end =
      range.end || new Date(Math.max(...dates.map((date) => date.getTime())));

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = new Date(end.getFullYear(), end.getMonth() + 1, 1);

    while (cursor < endCursor) {
      const key = getMonthKey(cursor);

      map.set(key, {
        name: key,
        totalOrders: 0,
        completedOrders: 0,
        grossRevenue: 0,
        platformRevenue: 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  orders.forEach((order) => {
    const date = parseDate(order.createdAt);
    if (!date) return;

    const key = range.groupType === "DAY" ? getDayKey(date) : getMonthKey(date);

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        totalOrders: 0,
        completedOrders: 0,
        grossRevenue: 0,
        platformRevenue: 0,
      });
    }

    const point = map.get(key);
    const status = getOrderStatus(order);

    point.totalOrders += 1;

    if (COMPLETED_STATUSES.includes(status)) {
      point.completedOrders += 1;
      point.grossRevenue += getGrossRevenue(order);
      point.platformRevenue += getPlatformRevenue(order);
    }
  });

  return Array.from(map.values());
};

const buildStatusData = (orders) => {
  const map = new Map();

  orders.forEach((order) => {
    const status = getOrderStatus(order);
    const label = STATUS_LABELS[status] || status;

    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

const buildVehicleData = (orders) => {
  const map = new Map();

  orders.forEach((order) => {
    const vehicleType = getOrderVehicleType(order);
    const label = getVehicleLabel(vehicleType);

    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

const buildCancelReasonData = (orders) => {
  const map = new Map();

  orders.forEach((order) => {
    const status = getOrderStatus(order);
    const hasCancelReason =
      order.cancelReason ||
      order.reason ||
      order.cancel_reason ||
      order.cancelNote ||
      order.note;

    if (!CANCELLED_STATUSES.includes(status) && !hasCancelReason) {
      return;
    }

    const reason = getCancelReason(order);
    map.set(reason, (map.get(reason) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

const buildTopDrivers = (orders, drivers) => {
  const driverMap = new Map();

  drivers.forEach((driver) => {
    driverMap.set(getDocumentId(driver), driver);
  });

  const map = new Map();

  orders.forEach((order) => {
    const status = getOrderStatus(order);

    if (!COMPLETED_STATUSES.includes(status)) return;

    const id = order.driverId || "UNKNOWN";
    const driver = driverMap.get(id);

    if (!map.has(id)) {
      map.set(id, {
        id,
        name: driver?.name || order.driverName || "Không rõ tài xế",
        phone: driver?.phone || order.driverPhone || "---",
        totalOrders: 0,
        grossRevenue: 0,
        platformRevenue: 0,
        averageRating: Number(driver?.averageRating || 0),
        walletBalance: Number(driver?.walletBalance || 0),
      });
    }

    const row = map.get(id);
    row.totalOrders += 1;
    row.grossRevenue += getGrossRevenue(order);
    row.platformRevenue += getPlatformRevenue(order);
  });

  return Array.from(map.values())
    .sort((a, b) => b.platformRevenue - a.platformRevenue)
    .slice(0, 6);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>

      {payload.map((item) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span>{item.name}:</span>
          <b>
            {item.dataKey?.toLowerCase().includes("revenue")
              ? formatMoney(item.value)
              : formatNumber(item.value)}
          </b>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const [customRange, setCustomRange] = useState({
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  });

  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);

  const [rawData, setRawData] = useState({
    orders: [],
    drivers: [],
    customers: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [driverRes, customerRes, orderRes] = await Promise.all([
        ApiClient.get("/admin/drivers/all"),
        ApiClient.get("/admin/customers"),
        ApiClient.get("/order/admin/all"),
      ]);

      setRawData({
        drivers: Array.isArray(driverRes.data)
          ? driverRes.data.filter((driver) => driver.role === "DRIVER")
          : [],
        customers: Array.isArray(customerRes.data) ? customerRes.data : [],
        orders: Array.isArray(orderRes.data) ? orderRes.data : [],
      });
    } catch (error) {
      console.error("Lỗi tải dữ liệu Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetAdvancedFilters = () => {
    setVehicleFilter("ALL");
    setStatusFilter("ALL");
  };

  const dashboard = useMemo(() => {
    const range = getFilterRange(customRange);

    const ordersInRange = rawData.orders.filter((order) =>
      isInRange(order.createdAt, range)
    );

    const filteredOrders = ordersInRange.filter((order) => {
      const orderVehicleType = getOrderVehicleType(order);
      const orderStatus = getOrderStatus(order);

      const matchVehicle =
        vehicleFilter === "ALL" || orderVehicleType === vehicleFilter;

      const matchStatus =
        statusFilter === "ALL" || orderStatus === statusFilter;

      return matchVehicle && matchStatus;
    });

    const filteredDrivers = rawData.drivers.filter((driver) =>
      isInRange(driver.createdAt, range)
    );

    const filteredCustomers = rawData.customers.filter((customer) =>
      isInRange(customer.createdAt, range)
    );

    const completedOrders = filteredOrders.filter((order) =>
      COMPLETED_STATUSES.includes(getOrderStatus(order))
    );

    const cancelledOrders = filteredOrders.filter((order) =>
      CANCELLED_STATUSES.includes(getOrderStatus(order))
    );

    const timeoutOrders = filteredOrders.filter((order) =>
      TIMEOUT_STATUSES.includes(getOrderStatus(order))
    );

    const activeOrders = filteredOrders.filter((order) =>
      ACTIVE_ORDER_STATUSES.includes(getOrderStatus(order))
    );

    const grossRevenue = completedOrders.reduce(
      (total, order) => total + getGrossRevenue(order),
      0
    );

    const platformRevenue = completedOrders.reduce(
      (total, order) => total + getPlatformRevenue(order),
      0
    );

    const averageOrderValue =
      completedOrders.length > 0 ? grossRevenue / completedOrders.length : 0;

    const completionRate =
      filteredOrders.length > 0
        ? (completedOrders.length / filteredOrders.length) * 100
        : 0;

    const cancelRate =
      filteredOrders.length > 0
        ? (cancelledOrders.length / filteredOrders.length) * 100
        : 0;

    const timeoutRate =
      filteredOrders.length > 0
        ? (timeoutOrders.length / filteredOrders.length) * 100
        : 0;

    const activeDrivers = rawData.drivers.filter((driver) =>
      ["ACTIVE", "READY", "BUSY"].includes(driver.status)
    );

    return {
      range,
      ordersInRange,
      filteredOrders,
      completedOrders,
      cancelledOrders,
      timeoutOrders,
      activeOrders,
      filteredDrivers,
      filteredCustomers,
      grossRevenue,
      platformRevenue,
      averageOrderValue,
      completionRate,
      cancelRate,
      timeoutRate,
      activeDrivers,
      chartData: buildTimeSeries(filteredOrders, range),
      statusData: buildStatusData(filteredOrders),
      vehicleData: buildVehicleData(filteredOrders),
      cancelReasonData: buildCancelReasonData(filteredOrders),
      topDrivers: buildTopDrivers(filteredOrders, rawData.drivers),
    };
  }, [rawData, customRange, vehicleFilter, statusFilter]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">DuckPost Admin</p>
          <h1>Tổng quan hệ thống</h1>
          <p>
            Thống kê doanh thu, đơn hàng, tài xế và khách hàng theo khoảng thời gian.
          </p>
        </div>

        <div className="dashboard-filter">
          <div className="date-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(event) =>
                handleCustomDateChange("startDate", event.target.value)
              }
            />
          </div>

          <div className="date-field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(event) =>
                handleCustomDateChange("endDate", event.target.value)
              }
            />
          </div>

          <div className="date-field">
            <span>Loại xe</span>
            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              style={{
                minWidth: 160,
                height: 38,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: "0 10px",
                fontWeight: 700,
                color: "#111827",
                background: "white",
              }}
            >
              {VEHICLE_FILTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="date-field">
            <span>Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{
                minWidth: 190,
                height: 38,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: "0 10px",
                fontWeight: 700,
                color: "#111827",
                background: "white",
              }}
            >
              {STATUS_FILTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-refresh-dashboard" onClick={resetAdvancedFilters}>
            Xóa lọc
          </button>

          <button className="btn-refresh-dashboard" onClick={fetchDashboardData}>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      <div className="stats-grid main-stats">
        <div className="stat-card primary">
          <div className="stat-icon">₫</div>
          <div>
            <div className="stat-title">Doanh thu hệ thống</div>
            <div className="stat-value">
              {formatMoney(dashboard.platformRevenue)}
            </div>
            <div className="stat-subtext">Chiết khấu từ đơn hoàn thành</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div>
            <div className="stat-title">Tổng đơn hàng</div>
            <div className="stat-value">
              {formatNumber(dashboard.filteredOrders.length)}
            </div>
            <div className="stat-subtext neutral">
              Tổng trong khoảng ngày: {formatNumber(dashboard.ordersInRange.length)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-title">Tỷ lệ hoàn thành</div>
            <div className="stat-value">
              {formatPercent(dashboard.completionRate)}
            </div>
            <div className="stat-subtext neutral">
              Hoàn thành: {formatNumber(dashboard.completedOrders.length)} đơn
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">💰</div>
          <div>
            <div className="stat-title">Giá trị đơn TB</div>
            <div className="stat-value">
              {formatMoney(dashboard.averageOrderValue)}
            </div>
            <div className="stat-subtext neutral">
              Tổng giá trị: {formatMoney(dashboard.grossRevenue)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div>
            <div className="stat-title">Tỷ lệ hủy đơn</div>
            <div className="stat-value">
              {formatPercent(dashboard.cancelRate)}
            </div>
            <div className="stat-subtext neutral">
              Đã hủy: {formatNumber(dashboard.cancelledOrders.length)} đơn
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🔎</div>
          <div>
            <div className="stat-title">Không tìm được tài xế</div>
            <div className="stat-value">
              {formatNumber(dashboard.timeoutOrders.length)}
            </div>
            <div className="stat-subtext neutral">
              Tỷ lệ: {formatPercent(dashboard.timeoutRate)}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid secondary-stats">
        <div className="mini-stat-card">
          <span>Tài xế mới</span>
          <b>{formatNumber(dashboard.filteredDrivers.length)}</b>
          <small>Tổng tài xế: {formatNumber(rawData.drivers.length)}</small>
        </div>

        <div className="mini-stat-card">
          <span>Khách hàng mới</span>
          <b>{formatNumber(dashboard.filteredCustomers.length)}</b>
          <small>Tổng khách hàng: {formatNumber(rawData.customers.length)}</small>
        </div>

        <div className="mini-stat-card">
          <span>Tài xế hoạt động</span>
          <b>{formatNumber(dashboard.activeDrivers.length)}</b>
          <small>ACTIVE / READY / BUSY</small>
        </div>

        <div className="mini-stat-card">
          <span>Đơn đang xử lý</span>
          <b>{formatNumber(dashboard.activeOrders.length)}</b>
          <small>Đang tìm, nhận, giao, hoàn hàng</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card wide">
          <div className="chart-header">
            <div>
              <h3>Doanh thu và số đơn theo thời gian</h3>
              <p>{dashboard.range.label}</p>
            </div>
          </div>

          <div className="chart-box">
            <ResponsiveContainer>
              <ComposedChart data={dashboard.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="platformRevenue"
                  name="Doanh thu hệ thống"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalOrders"
                  name="Số đơn"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Cơ cấu trạng thái đơn</h3>
              <p>Phân bổ theo trạng thái xử lý</p>
            </div>
          </div>

          <div className="pie-box">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dashboard.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {dashboard.statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} đơn`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Đơn theo loại xe</h3>
              <p>Xe máy, ô tô, bán tải</p>
            </div>
          </div>

          <div className="pie-box">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dashboard.vehicleData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={82}
                  label
                >
                  {dashboard.vehicleData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} đơn`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card wide">
          <div className="chart-header">
            <div>
              <h3>Lý do hủy đơn phổ biến</h3>
              <p>
                Thống kê từ các đơn đã hủy hoặc đơn có ghi nhận lý do hủy / sự cố
              </p>
            </div>
          </div>

          <div className="chart-box small">
            {dashboard.cancelReasonData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart
                  data={dashboard.cancelReasonData}
                  layout="vertical"
                  margin={{ left: 20, right: 25, top: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => `${value} đơn`} />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Số đơn"
                    fill="#dc2626"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: "100%",
                  minHeight: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Chưa có dữ liệu lý do hủy trong khoảng lọc hiện tại.
              </div>
            )}
          </div>
        </div>

        <div className="chart-card wide">
          <div className="chart-header">
            <div>
              <h3>Top tài xế theo doanh thu hệ thống</h3>
              <p>Tính từ các đơn hoàn thành</p>
            </div>
          </div>

          <div className="chart-box small">
            <ResponsiveContainer>
              <BarChart
                data={dashboard.topDrivers}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "Số đơn" ? `${value} đơn` : formatMoney(value)
                  }
                />
                <Legend />
                <Bar
                  dataKey="platformRevenue"
                  name="Doanh thu hệ thống"
                  fill="#16a34a"
                  radius={[0, 6, 6, 0]}
                />
                <Bar
                  dataKey="totalOrders"
                  name="Số đơn"
                  fill="#f97316"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;