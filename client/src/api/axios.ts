import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
});

// ── Request interceptor: attach bearer token ──────────────────────────────
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

// ── Response interceptor: force-logout suspended / deleted accounts ────────
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message: string = error?.response?.data?.message || '';

        const isSuspended =
            status === 403 &&
            (message.toLowerCase().includes('not active') ||
                message.toLowerCase().includes('suspended'));

        const isDeleted =
            (status === 401 && message.toLowerCase().includes('not authorized')) ||
            (status === 403 && message.toLowerCase().includes('not authorized'));

        if (isSuspended) {
            window.dispatchEvent(
                new CustomEvent('fitforge_force_logout', {
                    detail: 'Your account has been suspended. Please contact your gym admin.',
                })
            );
        } else if (isDeleted && localStorage.getItem('fitforge_user')) {
            // Only fire if we think we're logged in (avoids triggering on normal 401s)
            window.dispatchEvent(
                new CustomEvent('fitforge_force_logout', {
                    detail: 'Your account no longer exists. Please contact support.',
                })
            );
        }

        return Promise.reject(error);
    }
);

export default API;
