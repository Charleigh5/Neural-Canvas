/**
 * API Service
 * Centralized service for communicating with the FastAPI backend.
 * Handles authentication, token refresh, and all API calls.
 */

// API base URL from environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'neural_canvas_access_token';
const REFRESH_TOKEN_KEY = 'neural_canvas_refresh_token';

// Types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface ApiAsset {
  id: string;
  owner_id: string;
  storage_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  tags: string[] | null;
  local_tags: string[] | null;
  caption: string | null;
  analyzed: boolean;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetPayload {
  storage_url: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  tags?: string[];
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
}

export interface UpdateAssetPayload {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  tags?: string[];
  caption?: string;
  analyzed?: boolean;
}

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public endpoint: string
  ) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiError';
  }
}

/**
 * Token management
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

/**
 * Core fetch wrapper with auth and error handling
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = tokenManager.getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(endpoint, options, false);
    }
    // Refresh failed - logout
    tokenManager.clearTokens();
    throw new ApiError(401, 'Session expired. Please log in again.', endpoint);
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed', endpoint);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const tokens: AuthTokens = await response.json();
    tokenManager.setTokens(tokens);
    return true;
  } catch {
    return false;
  }
}

/**
 * Authentication API
 */
export const authApi = {
  register: async (email: string, password: string, displayName?: string): Promise<UserProfile> => {
    return apiFetch<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  },

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const tokens = await apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    tokenManager.setTokens(tokens);
    return tokens;
  },

  logout: (): void => {
    tokenManager.clearTokens();
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return apiFetch<UserProfile>('/users/me');
  },

  updateProfile: async (data: {
    display_name?: string;
    avatar_url?: string;
  }): Promise<UserProfile> => {
    return apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Assets API
 */
export const assetsApi = {
  list: async (skip = 0, limit = 100): Promise<ApiAsset[]> => {
    return apiFetch<ApiAsset[]>(`/assets?skip=${skip}&limit=${limit}`);
  },

  get: async (assetId: string): Promise<ApiAsset> => {
    return apiFetch<ApiAsset>(`/assets/${assetId}`);
  },

  create: async (data: CreateAssetPayload): Promise<ApiAsset> => {
    return apiFetch<ApiAsset>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (assetId: string, data: UpdateAssetPayload): Promise<ApiAsset> => {
    return apiFetch<ApiAsset>(`/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (assetId: string): Promise<void> => {
    return apiFetch<void>(`/assets/${assetId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Health check
 */
export const healthApi = {
  check: async (): Promise<{ status: string; service: string; version: string }> => {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.json();
  },

  detailed: async (): Promise<{ status: string; database: string; environment: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

/**
 * Sync service - bridges IndexedDB (offline) with API (cloud)
 */
export const syncService = {
  /**
   * Sync local assets to cloud (future implementation)
   * This would compare IndexedDB with API and reconcile differences
   */
  syncAssets: async (): Promise<void> => {
    // TODO: Implement bidirectional sync
    console.debug('[SyncService] Asset sync not yet implemented');
  },
};

// Unified API service export
export const apiService = {
  auth: authApi,
  assets: assetsApi,
  health: healthApi,
  sync: syncService,
  tokens: tokenManager,
};

export default apiService;
