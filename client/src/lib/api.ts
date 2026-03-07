import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401s (Unauthorized)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Check if we are not already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Handle Network Errors (Server unreachable)
        if (!error.response && error.code === 'ERR_NETWORK') {
            console.error('❌ Network Error: Unable to connect to the server.');
            toast.error('Network Error: Server unreachable', {
                description: 'Please check your internet connection or server status.'
            });
        }

        // Handle Server Errors (500, 502, etc)
        if (error.response?.status && error.response.status >= 500) {
            toast.error('Server error occurred', {
                description: 'We are experiencing some issues. Please try again later.'
            });
        }

        // Handle Validation/Bad Request (400) - but only if it's not a logic error handled by the page
        // Actually, pages usually handle 400s themselves to show specific field errors.
        // But for generic 400/403, we can show a toast.
        if (error.response?.status === 403) {
            toast.error('Permission denied', {
                description: 'You do not have access to this resource.'
            });
        }

        // Standard error rejection
        return Promise.reject(error);
    }
);

export default api;
