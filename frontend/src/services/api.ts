import axios from 'axios';

/**
 * Resolves and normalizes the backend API base URL.
 * Supports VITE_API_BASE_URL from environment variables (e.g. on Vercel),
 * and safely defaults to '/api' for local Vite proxy development.
 * Automatically prevents duplicate `/api/api` slashes.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }
  let cleanUrl = envUrl.trim();
  // Strip trailing slashes
  while (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  // Ensure base URL ends with /api
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }
  return cleanUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Resolves full media URLs for streaming audio and uploaded images.
 * If path is already absolute (starts with http/https/blob), returns as-is.
 * Otherwise, prepends the backend origin so assets load reliably on Vercel.
 */
export const getFullMediaUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // If path starts with /api/, route directly via API_BASE_URL to avoid /api/api
  if (cleanPath.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanPath.slice(4)}`;
  }
  // If API_BASE_URL is a full URL (e.g. https://.../api), strip /api to get origin for static uploads
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${backendOrigin}${cleanPath}`;
  }
  // In local dev with relative proxy, return clean relative path
  return cleanPath;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: attach JWT Bearer token & handle FormData
api.interceptors.request.use(
  (config) => {
    // If URL begins with /api/, strip leading /api because baseURL already includes /api
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.slice(4);
    }

    const token = localStorage.getItem('playx_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If payload is FormData, delete Content-Type so browser sets boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthPath = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthPath) {
        localStorage.removeItem('playx_token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
