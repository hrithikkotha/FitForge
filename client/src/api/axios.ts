import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('fitforge_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    }
    return config;
});

export default API;
