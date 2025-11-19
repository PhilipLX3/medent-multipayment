import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User } from '@/shared/types';
import { authService } from '@/shared/services';
import toast from 'react-hot-toast';

// Add a flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

// Custom storage that saves to both localStorage and cookies
const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    
    // Save to localStorage
    localStorage.setItem(name, value);
    
    // Also save to cookie for middleware access
    try {
      // Set cookie with 30 day expiration
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
    } catch (error) {
      console.error('Failed to set auth cookie:', error);
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    
    // Remove from localStorage
    localStorage.removeItem(name);
    
    // Remove cookie
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  },
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login(email, password);
          const data = response.data.data;

          const user: User = {
            id: data.user.uuid,
            name: `${data.user.profile.firstName} ${data.user.profile.lastName}`,
            email: data.user.profile.email,
            role: 'admin' // Might be necessary to adjust access to certain pages based on user permissions
          };

          set({
            user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });

          toast.success('ログインしました');
        } catch (error) {
          toast.error('メールアドレスまたはパスワードが正しくありません');
          throw error;
        }
      },

      logout: () => {
        console.log('[Auth] Logging out user');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        
        // Force clear localStorage to ensure state is reset
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('auth-storage');
          } catch (error) {
            console.error('[Auth] Error clearing localStorage:', error);
          }
        }
        
        toast.success('ログアウトしました');
      },

      setAuth: (user: User, token: string, refreshToken?: string) => {
        set({
          user,
          token,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
        });
      },

      validateToken: async () => {
        const { token, isAuthenticated } = get();
        
        if (!isAuthenticated || !token) {
          return false;
        }

        try {
          const { authService } = await import('@/shared/services');
          await authService.me();
          return true;
        } catch (error) {
          console.log('[Auth] Token validation failed:', error);
          return false;
        }
      },

      refreshAuthToken: async () => {
        // Prevent multiple simultaneous refresh attempts
        if (isRefreshing) {
          console.log('[Auth] Refresh already in progress, waiting...');
          return new Promise((resolve) => {
            const checkRefresh = () => {
              if (!isRefreshing) {
                resolve(get().isAuthenticated);
              } else {
                setTimeout(checkRefresh, 100);
              }
            };
            checkRefresh();
          });
        }

        try {
          isRefreshing = true;
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            console.log('[Auth] No refresh token available');
            return false;
          }

          console.log('[Auth] Refreshing access token...');
          const response = await authService.refreshToken(currentRefreshToken);
          const data = response.data.data;

          set({
            token: data.accessToken,
            refreshToken: data.refreshToken, // Store new refresh token (rotation)
          });

          console.log('[Auth] Token refreshed successfully');
          return true;
        } catch (error: any) {
          console.error('[Auth] Token refresh failed:', error);
          
          // Clear auth state for any refresh token failure
          // The authService will handle the redirect to login
          console.log('[Auth] Clearing auth state due to refresh token failure');
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          
          return false;
        } finally {
          isRefreshing = false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: customStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);