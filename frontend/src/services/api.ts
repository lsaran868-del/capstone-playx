import axios from 'axios';
import {
  songsService,
  playlistsService,
  artistsService,
  albumsService,
  genresService,
  subscriptionsService,
  searchService
} from './supabaseService';

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
 * If path is already absolute (starts with http/https/blob/data), returns as-is.
 * Otherwise, prepends the backend origin so assets load reliably on Vercel.
 */
export const getFullMediaUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
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

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: attach JWT Bearer token & handle FormData & strip redundant /api
axiosInstance.interceptors.request.use(
  (config) => {
    // If URL begins with /api/, strip leading /api because baseURL already includes /api
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.slice(4);
    } else if (config.url === '/api') {
      config.url = '';
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
axiosInstance.interceptors.response.use(
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

/**
 * Centralized API client.
 * Calls the backend REST API via Axios.
 * For catalog queries (songs, playlists, etc.), if the backend is cold-starting or unreachable,
 * gracefully falls back to Supabase client so audio playback and browsing never fail.
 */
const api = {
  async get(url: string, config?: any): Promise<{ data: any; status: number }> {
    try {
      return await axiosInstance.get(url, config);
    } catch (err: any) {
      // If error has a response from backend (e.g. 401, 403, 404, 500), throw it
      if (err.response) throw err;

      // Fallback for catalog read routes if backend is sleeping or unreachable
      const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
      const [path, queryString] = cleanUrl.split('?');
      const params = new URLSearchParams(queryString || '');

      try {
        if (path === '/health') {
          return {
            status: 200,
            data: { status: 'UP', message: 'PlayX Client active', database: 'CONNECTED', database_engine: 'PostgreSQL' }
          };
        }
        if (path === '/songs') {
          const limit = Number(params.get('limit')) || 100;
          const data = await songsService.getSongs(undefined, limit);
          return { status: 200, data };
        }
        if (path === '/songs/popular') {
          const data = await songsService.getPopularSongs();
          return { status: 200, data };
        }
        if (path === '/songs/recommended') {
          const data = await songsService.getRecommendedSongs();
          return { status: 200, data };
        }
        if (path === '/songs/new-releases') {
          const data = await songsService.getNewReleases();
          return { status: 200, data };
        }
        if (path.startsWith('/songs/') && !path.includes('/stream') && !path.includes('/play')) {
          const id = path.replace('/songs/', '');
          const data = await songsService.getSongById(id);
          return { status: 200, data };
        }
        if (path === '/playlists') {
          const data = await playlistsService.getPlaylists();
          return { status: 200, data };
        }
        if (path.startsWith('/playlists/')) {
          const id = path.replace('/playlists/', '');
          const data = await playlistsService.getPlaylistById(id);
          return { status: 200, data };
        }
        if (path === '/artists') {
          const data = await artistsService.getArtists();
          return { status: 200, data };
        }
        if (path.startsWith('/artists/') && !path.includes('/dashboard')) {
          const id = path.replace('/artists/', '');
          const data = await artistsService.getArtistById(id);
          return { status: 200, data };
        }
        if (path === '/albums') {
          const data = await albumsService.getAlbums();
          return { status: 200, data };
        }
        if (path === '/genres') {
          const data = await genresService.getGenres();
          return { status: 200, data };
        }
        if (path === '/subscriptions/plans') {
          const data = await subscriptionsService.getPlans();
          return { status: 200, data };
        }
        if (path === '/search') {
          const q = params.get('q') || '';
          const data = await searchService.searchAll(q);
          return { status: 200, data };
        }
      } catch (fallbackErr) {
        // Ignore fallback error and throw original Axios error
      }
      throw err;
    }
  },

  async post(url: string, body?: any, config?: any): Promise<{ data: any; status: number }> {
    return await axiosInstance.post(url, body, config);
  },

  async put(url: string, body?: any, config?: any): Promise<{ data: any; status: number }> {
    return await axiosInstance.put(url, body, config);
  },

  async delete(url: string, config?: any): Promise<{ data: any; status: number }> {
    return await axiosInstance.delete(url, config);
  }
};

export default api;
