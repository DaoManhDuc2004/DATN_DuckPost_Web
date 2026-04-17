import axios from 'axios';

// const BASE_URL = 'http://192.168.28.152:8000/api'; 
const BASE_URL = 'https://datn-duckpost-backend.onrender.com/api'; 
const ApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

ApiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

ApiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            alert("Phiên đăng nhập đã hết hạn hoặc tài khoản đang được sử dụng ở thiết bị khác!");
            
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminUsername');
            
            window.location.href = '/'; 
        }
        return Promise.reject(error);
    }
);

export default ApiClient;