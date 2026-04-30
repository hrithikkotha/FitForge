import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3001/api',
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
let _forceLogoutFired = false;

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

        if (isSuspended && !_forceLogoutFired) {
            _forceLogoutFired = true;
            window.dispatchEvent(
                new CustomEvent('fitforge_force_logout', {
                    detail: 'Your account has been suspended. Please contact your gym admin.',
                })
            );
            // Reset after a short delay so the guard doesn't block future sessions
            setTimeout(() => { _forceLogoutFired = false; }, 10_000);
        } else if (isDeleted && localStorage.getItem('fitforge_user') && !_forceLogoutFired) {
            _forceLogoutFired = true;
            // Only fire if we think we're logged in (avoids triggering on normal 401s)
            window.dispatchEvent(
                new CustomEvent('fitforge_force_logout', {
                    detail: 'Your account no longer exists. Please contact support.',
                })
            );
            setTimeout(() => { _forceLogoutFired = false; }, 10_000);
        }

        return Promise.reject(error);
    }
);

export default API;
