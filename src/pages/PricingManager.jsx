import { useState, useEffect } from "react";
import ApiClient from "../ApiClient";
import "./PricingManager.css";

const PricingManager = () => {
  const defaultPricingConfigs = [
    {
      vehicleType: "BIKE",
      basePrice: 12000,
      baseDistance: 2,
      pricePerKm: 5000,
    },
    {
      vehicleType: "CAR4",
      basePrice: 25000,
      baseDistance: 2,
      pricePerKm: 12000,
    },
    {
      vehicleType: "CAR7",
      basePrice: 30000,
      baseDistance: 2,
      pricePerKm: 15000,
    },
  ];

  const defaultSurchargeConfigs = [
    {
      code: "MORNING_PEAK",
      name: "Phụ phí cao điểm sáng",
      enabled: true,
      startTime: "07:00",
      endTime: "09:00",
      percentage: 10,
      timeBased: true,
      description: "Tự động áp dụng trong khung giờ cao điểm buổi sáng.",
    },
    {
      code: "EVENING_PEAK",
      name: "Phụ phí cao điểm chiều",
      enabled: true,
      startTime: "17:00",
      endTime: "19:00",
      percentage: 10,
      timeBased: true,
      description: "Tự động áp dụng trong khung giờ cao điểm buổi chiều.",
    },
    {
      code: "NIGHT",
      name: "Phụ phí ban đêm",
      enabled: true,
      startTime: "21:00",
      endTime: "06:00",
      percentage: 20,
      timeBased: true,
      description: "Tự động áp dụng cho các đơn phát sinh vào ban đêm.",
    },
    {
      code: "WEATHER",
      name: "Phụ phí thời tiết xấu",
      enabled: false,
      startTime: null,
      endTime: null,
      percentage: 15,
      timeBased: false,
      description: "Admin bật thủ công khi trời mưa, bão hoặc thời tiết xấu.",
    },
  ];

  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [surchargeConfigs, setSurchargeConfigs] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [loadingSurcharge, setLoadingSurcharge] = useState(false);

  useEffect(() => {
    fetchPricing();
    fetchSurcharges();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);

      const res = await ApiClient.get("/admin/pricing");
      const dbData = Array.isArray(res.data) ? res.data : [];

      const mergedConfigs = defaultPricingConfigs.map((defaultConfig) => {
        const foundInDb = dbData.find(
          (item) => item.vehicleType === defaultConfig.vehicleType
        );

        return foundInDb ? { ...defaultConfig, ...foundInDb } : defaultConfig;
      });

      setPricingConfigs(mergedConfigs);
    } catch (error) {
      console.error("Lỗi tải bảng giá:", error);
      setPricingConfigs(defaultPricingConfigs);
    } finally {
      setLoadingPricing(false);
    }
  };

  const fetchSurcharges = async () => {
    try {
      setLoadingSurcharge(true);

      const res = await ApiClient.get("/admin/surcharge");
      const dbData = Array.isArray(res.data) ? res.data : [];

      const mergedConfigs = defaultSurchargeConfigs.map((defaultConfig) => {
        const foundInDb = dbData.find((item) => item.code === defaultConfig.code);

        return foundInDb
          ? {
              ...defaultConfig,
              ...foundInDb,
              description: defaultConfig.description,
            }
          : defaultConfig;
      });

      setSurchargeConfigs(mergedConfigs);
    } catch (error) {
      console.error("Lỗi tải cấu hình phụ phí:", error);
      setSurchargeConfigs(defaultSurchargeConfigs);
    } finally {
      setLoadingSurcharge(false);
    }
  };

  const handlePricingChange = (index, field, value) => {
    const newConfigs = [...pricingConfigs];

    newConfigs[index] = {
      ...newConfigs[index],
      [field]: Number(value),
    };

    setPricingConfigs(newConfigs);
  };

  const handleSurchargeChange = (index, field, value) => {
    const newConfigs = [...surchargeConfigs];

    newConfigs[index] = {
      ...newConfigs[index],
      [field]: value,
    };

    setSurchargeConfigs(newConfigs);
  };

  const handleUpdatePricing = async (config) => {
    try {
      await ApiClient.post("/admin/pricing/update", {
        ...config,
        basePrice: Number(config.basePrice),
        baseDistance: Number(config.baseDistance),
        pricePerKm: Number(config.pricePerKm),
      });

      alert(`Đã cập nhật bảng giá cho ${getVehicleName(config.vehicleType)} thành công!`);
      fetchPricing();
    } catch (error) {
      console.error("Lỗi lưu bảng giá:", error);
      alert("Lỗi khi lưu bảng giá!");
    }
  };

  const handleUpdateSurcharge = async (config) => {
    try {
      const payload = {
        code: config.code,
        name: config.name,
        enabled: Boolean(config.enabled),
        startTime: config.timeBased ? config.startTime || "00:00" : null,
        endTime: config.timeBased ? config.endTime || "00:00" : null,
        percentage: Number(config.percentage),
        timeBased: Boolean(config.timeBased),
      };

      await ApiClient.post("/admin/surcharge/update", payload);

      alert(`Đã cập nhật ${config.name} thành công!`);
      fetchSurcharges();
    } catch (error) {
      console.error("Lỗi lưu phụ phí:", error);
      alert("Lỗi khi lưu cấu hình phụ phí!");
    }
  };

  const getVehicleName = (type) => {
    if (type === "BIKE") return "Giao hàng bằng Xe máy";
    if (type === "CAR4") return "Giao hàng bằng Ô tô 4 chỗ";
    if (type === "CAR7") return "Giao hàng bằng Ô tô 7 chỗ";
    return type;
  };

  const getVehicleIcon = (type) => {
    if (type === "BIKE") return "🏍️";
    if (type === "CAR4") return "🚗";
    if (type === "CAR7") return "🚙";
    return "🚚";
  };

  const getSurchargeIcon = (code) => {
    if (code === "MORNING_PEAK") return "🌅";
    if (code === "EVENING_PEAK") return "🌆";
    if (code === "NIGHT") return "🌙";
    if (code === "WEATHER") return "🌧️";
    return "➕";
  };

  const getSurchargeTypeLabel = (config) => {
    return config.timeBased ? "Tự động theo khung giờ" : "Bật / tắt thủ công";
  };

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <div>
          <p className="pricing-eyebrow">Quản trị hệ thống</p>
          <h2 className="pricing-title">Cấu hình bảng giá & phụ phí</h2>
          <p className="pricing-subtitle">
            Điều chỉnh giá cước theo loại xe, phụ phí cao điểm, ban đêm và thời tiết.
          </p>
        </div>

        <div className="pricing-header-card">
          <span className="header-card-label">Trạng thái</span>
          <strong>Đang áp dụng</strong>
        </div>
      </div>

      <section className="pricing-section">
        <div className="section-heading">
          <div>
            <h3>Bảng giá cước cơ bản</h3>
            <p>Giá nền được dùng làm cơ sở tính cước trước khi cộng phụ phí.</p>
          </div>

          {loadingPricing && <span className="loading-badge">Đang tải...</span>}
        </div>

        <div className="pricing-grid">
          {pricingConfigs.map((config, index) => (
            <div key={config.vehicleType} className="pricing-card">
              <div className="card-top">
                <div className="vehicle-icon">{getVehicleIcon(config.vehicleType)}</div>
                <div>
                  <h3>{getVehicleName(config.vehicleType)}</h3>
                  <p>Mã loại xe: {config.vehicleType}</p>
                </div>
              </div>

              <div className="price-preview">
                <div>
                  <span>Giá mở cửa</span>
                  <strong>{formatMoney(config.basePrice)}</strong>
                </div>
                <div>
                  <span>Sau mốc đầu</span>
                  <strong>{formatMoney(config.pricePerKm)} / km</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Giá mở cửa (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={config.basePrice}
                  onChange={(e) =>
                    handlePricingChange(index, "basePrice", e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Khoảng cách áp dụng giá mở cửa (km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={config.baseDistance}
                  onChange={(e) =>
                    handlePricingChange(index, "baseDistance", e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Giá mỗi km tiếp theo (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={config.pricePerKm}
                  onChange={(e) =>
                    handlePricingChange(index, "pricePerKm", e.target.value)
                  }
                />
              </div>

              <button
                className="btn-save"
                onClick={() => handleUpdatePricing(config)}
              >
                Lưu bảng giá
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-section">
        <div className="section-heading">
          <div>
            <h3>Cấu hình phụ phí</h3>
            <p>
              Phụ phí cao điểm, ban đêm được áp dụng tự động theo giờ. Phụ phí
              thời tiết do admin bật thủ công.
            </p>
          </div>

          {loadingSurcharge && <span className="loading-badge">Đang tải...</span>}
        </div>

        <div className="surcharge-grid">
          {surchargeConfigs.map((config, index) => (
            <div
              key={config.code}
              className={`surcharge-card ${config.enabled ? "is-enabled" : "is-disabled"}`}
            >
              <div className="surcharge-top">
                <div className="surcharge-icon">{getSurchargeIcon(config.code)}</div>

                <div className="surcharge-main">
                  <div className="surcharge-title-row">
                    <h3>{config.name}</h3>
                    <span
                      className={`status-pill ${
                        config.enabled ? "active" : "inactive"
                      }`}
                    >
                      {config.enabled ? "Đang bật" : "Đang tắt"}
                    </span>
                  </div>

                  <p>{config.description}</p>
                  <span className="surcharge-type">
                    {getSurchargeTypeLabel(config)}
                  </span>
                </div>
              </div>

              <div className="surcharge-toggle-row">
                <div>
                  <strong>Kích hoạt phụ phí</strong>
                  <span>
                    {config.enabled
                      ? "Phụ phí này đang được tính vào giá đơn"
                      : "Phụ phí này chưa áp dụng"}
                  </span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(config.enabled)}
                    onChange={(e) =>
                      handleSurchargeChange(index, "enabled", e.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="form-group">
                <label>Tỷ lệ phụ phí (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.percentage}
                  onChange={(e) =>
                    handleSurchargeChange(
                      index,
                      "percentage",
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              {config.timeBased ? (
                <div className="time-row">
                  <div className="form-group">
                    <label>Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={config.startTime || ""}
                      onChange={(e) =>
                        handleSurchargeChange(index, "startTime", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Giờ kết thúc</label>
                    <input
                      type="time"
                      value={config.endTime || ""}
                      onChange={(e) =>
                        handleSurchargeChange(index, "endTime", e.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="manual-note">
                  <strong>Phụ phí thủ công</strong>
                  <span>
                    Khi bật, hệ thống sẽ cộng phụ phí này vào đơn hàng cho đến
                    khi admin tắt lại.
                  </span>
                </div>
              )}

              <div className="surcharge-preview">
                <span>Giá tăng thêm</span>
                <strong>+{Number(config.percentage || 0)}%</strong>
              </div>

              <button
                className="btn-save surcharge-save"
                onClick={() => handleUpdateSurcharge(config)}
              >
                Lưu phụ phí
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PricingManager;