import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api/v1';

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finanapp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize API responses & errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: unknown; message?: unknown; details?: unknown }>) => {
    if (error.response) {
      const { status, data } = error.response;
      const rawMessage = data?.error || data?.message;
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : rawMessage && typeof rawMessage === 'object' && 'message' in rawMessage &&
              typeof rawMessage.message === 'string'
            ? rawMessage.message
            : `Error del servidor (${status})`;

      // If token expired or unauthorized on protected route, clean token
      if (status === 401 && !error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('finanapp_token');
        localStorage.removeItem('finanapp_user');
      }

      return Promise.reject(new ApiError(message, status, data?.details));
    }

    if (error.request) {
      return Promise.reject(
        new ApiError('No se pudo establecer conexión con el servidor. Verifique su red.', 0)
      );
    }

    return Promise.reject(new ApiError(error.message, 500));
  }
);

// Seamless wrapper for typed requests compatible with existing features
export async function apiClient<T>(
  endpoint: string,
  options: {
    method?: string;
    data?: unknown;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const config: AxiosRequestConfig = {
    url: cleanEndpoint,
    method: options.method || (options.data ? 'POST' : 'GET'),
    data: options.data,
    params: options.params,
    headers: options.headers,
  };

  const response = await axiosInstance.request<T>(config);
  return response.data;
}
