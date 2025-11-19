import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/shared/store/authStore';
import { sessionManager } from '@/shared/utils/sessionManager';

// Simple API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.medent-finance.com/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshAttempts: number = 0;
  private readonly maxRefreshAttempts: number = 3;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        config.headers['x-api-key'] = process.env.NEXT_PUBLIC_API_KEY;
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Reset refresh attempts on any successful response
        this.refreshAttempts = 0;
        return response;
      },
      async (error) => {
        // ネットワークエラーの詳細をログ出力
        if (!error.response) {
          console.error('Network Error - Backend API is not reachable:', {
            message: error.message,
            baseURL: API_BASE_URL,
            config: error.config?.url
          });
        }
        
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          // 1) Check if this is a login request or refresh token request
          const isLoginRequest = originalRequest.url?.includes('/v1/auth/login');
          const isRefreshRequest = originalRequest.url?.includes('/v1/auth/refresh-token');
          
          if(isLoginRequest) {
            console.log('[API] 401 error on login URL:', originalRequest.url);
            return Promise.reject(error);
          }
          
          if(isRefreshRequest) {
            console.log('[API] 401 error on refresh token URL:', originalRequest.url, 'letting authService handle it');
            return Promise.reject(error);
          }

          // Try to refresh token only once per request
          originalRequest._retry = true;
          
          const authStore = useAuthStore.getState();
          
          // Check if this is a refresh token expiration error (skip for login and refresh requests)
          if (!isLoginRequest && !isRefreshRequest && sessionManager.isRefreshTokenExpired(error)) {
            console.log('[API] Refresh token expired, handling session expiration');
            sessionManager.handleSessionExpired();
            return Promise.reject(error);
          }
          
          console.log('[API] 401 error, attempting token refresh...');
          
          // Don't try to refresh if this is already a refresh request
          if (isRefreshRequest) {
            this.refreshAttempts++;
            console.log(`[API] Refresh request failed, attempt ${this.refreshAttempts}/${this.maxRefreshAttempts}`);
            
            if (this.refreshAttempts >= this.maxRefreshAttempts) {
              console.log('[API] Max refresh attempts reached, handling session expiration');
              this.refreshAttempts = 0; // Reset for next session
              sessionManager.handleSessionExpired();
              return Promise.reject(error);
            }
            
            console.log(`[API] Retrying refresh token request immediately`);
            return Promise.reject(error);
          }
          
          // Only try to refresh if we actually have a refresh token
          if (!authStore.refreshToken) {
            console.log('[API] No refresh token available, logging out');
            sessionManager.handleSessionExpired();
            return Promise.reject(error);
          }

          // Try to refresh token up to maxRefreshAttempts times
          for (let attempt = 1; attempt <= this.maxRefreshAttempts; attempt++) {
            console.log(`[API] Attempting token refresh, try ${attempt}/${this.maxRefreshAttempts}`);
            
            const refreshSuccess = await authStore.refreshAuthToken();
            
            if (refreshSuccess) {
              console.log('[API] Token refreshed successfully, retrying request');
              this.refreshAttempts = 0; // Reset attempts on successful refresh
              // Update the original request with new token
              const newToken = useAuthStore.getState().token;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Retry the original request
              return this.client(originalRequest);
            } else {
              console.log(`[API] Token refresh failed on attempt ${attempt}`);
              
              if (attempt >= this.maxRefreshAttempts) {
                console.log('[API] All refresh attempts failed, handling session expiration');
                this.refreshAttempts = 0; // Reset for next session
                sessionManager.handleSessionExpired();
                return Promise.reject(error);
              }
              // Continue to next attempt (no delay, immediate retry)
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get axios() {
    return this.client;
  }
}

export const api = new ApiClient().axios;
export default api;