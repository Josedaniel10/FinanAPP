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

interface RequestOptions extends RequestInit {
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, params, headers: customHeaders, ...customOptions } = options;

  const headers = new Headers(customHeaders);
  if (data) {
    headers.set('Content-Type', 'application/json');
  }

  // Auto attach JWT token from localStorage if present
  const token = localStorage.getItem('finanapp_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let queryString = '';
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      queryString = `?${qs}`;
    }
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}${queryString}`;

  const response = await fetch(url, {
    ...customOptions,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  let responseData: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      responseData?.error ||
      responseData?.message ||
      `Error HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(errorMessage, response.status, responseData?.details);
  }

  return responseData;
}
