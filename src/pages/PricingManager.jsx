import { useState, useEffect } from 'react';
import ApiClient from '../ApiClient';
import './PricingManager.css';

const PricingManager = () => {
    const [configs, setConfigs] = useState([]);

    const defaultConfigs = [
        { vehicleType: 'BIKE', basePrice: 12000, baseDistance: 2, pricePerKm: 5000 },
        { vehicleType: 'CAR4', basePrice: 25000, baseDistance: 2, pricePerKm: 12000 },
        { vehicleType: 'CAR7', basePrice: 30000, baseDistance: 2, pricePerKm: 15000 }
    ];

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const res = await ApiClient.get("/admin/pricing");
            const dbData = res.data;

            const mergedConfigs = defaultConfigs.map(defConfig => {
                const foundInDb = dbData.find(item => item.vehicleType === defConfig.vehicleType);
                return foundInDb ? foundInDb : defConfig;
            });

            setConfigs(mergedConfigs);
        } catch (error) {
            console.error("Lỗi tải bảng giá:", error);
        }
    };

    const handleUpdate = async (config) => {
        try {
            await ApiClient.post("/admin/pricing/update", config);
            alert(`Đã cập nhật bảng giá cho ${getVehicleName(config.vehicleType)} thành công!`);
            fetchPricing();
        } catch (error) {
            alert("Lỗi khi lưu bảng giá!");
        }
    };

    const handleChange = (index, field, value) => {
        const newConfigs = [...configs];
        newConfigs[index][field] = Number(value);
        setConfigs(newConfigs);
    };

    const getVehicleName = (type) => {
        if (type === 'BIKE') return 'Giao hàng bằng Xe máy';
        if (type === 'CAR4') return 'Giao hàng bằng Ô tô (4 Chỗ)';
        if (type === 'CAR7') return 'Giao hàng bằng Ô tô (7 Chỗ)';
        return type;
    };

    return (
        <div className="pricing-container">
            <h2 className="pricing-title">Cấu hình Bảng giá cước</h2>
            <div className="pricing-grid">
                {configs.map((config, index) => (
                    <div key={index} className="pricing-card">
                        <h3 style={{ color: '#007bff' }}>{getVehicleName(config.vehicleType)}</h3>
                        <div className="form-group">
                            <label>Giá mở cửa (VNĐ)</label>
                            <input 
                                type="number" 
                                value={config.basePrice} 
                                onChange={(e) => handleChange(index, 'basePrice', e.target.value)} 
                            />
                        </div>
                        <div className="form-group">
                            <label>Khoảng cách áp dụng giá mở cửa (km)</label>
                            <input 
                                type="number" 
                                value={config.baseDistance} 
                                onChange={(e) => handleChange(index, 'baseDistance', e.target.value)} 
                            />
                        </div>
                        <div className="form-group">
                            <label>Giá mỗi km tiếp theo (VNĐ)</label>
                            <input 
                                type="number" 
                                value={config.pricePerKm} 
                                onChange={(e) => handleChange(index, 'pricePerKm', e.target.value)} 
                            />
                        </div>
                        <button className="btn-save" onClick={() => handleUpdate(config)}>
                            Lưu cấu hình
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PricingManager;