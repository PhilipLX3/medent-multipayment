import { useAuthStore } from '@/shared/store/authStore';
import toast from 'react-hot-toast';

/**
 * Session management utilities
 */
export class SessionManager {
  private static instance: SessionManager;
  private readonly REFRESH_TOKEN_EXPIRED_MESSAGES = [
    'Refresh token has expired',
    'refresh token expired',
    'refresh token invalid',
    'token expired',
    'session expired'
  ];

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Check if an error indicates refresh token expiration
   */
  public isRefreshTokenExpired(error: any): boolean {
    const errorMessage = (
      error?.response?.data?.message || 
      error?.message || 
      ''
    ).toLowerCase();

    return (
      error?.response?.status === 401 &&
      this.REFRESH_TOKEN_EXPIRED_MESSAGES.some(msg => 
        errorMessage.includes(msg.toLowerCase())
      )
    );
  }

  /**
   * Handle session expiration with user-friendly messaging
   */
  public handleSessionExpired(): void {
    console.log('[SessionManager] Handling session expiration');
    
    const authStore = useAuthStore.getState();
    
    // Clear auth state
    authStore.logout();
    
    // Show user-friendly message
    toast.error('セッションが期限切れです。再度ログインしてください。', {
      duration: 5000,
      position: 'top-center',
    });
    
    // Redirect to login after a brief delay to allow the toast to show
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }, 1000);
  }

  /**
   * Check if the current session is valid
   */
  public isSessionValid(): boolean {
    const authStore = useAuthStore.getState();
    return !!(authStore.isAuthenticated && authStore.token && authStore.refreshToken);
  }

  /**
   * Clear invalid session data
   */
  public clearInvalidSession(): void {
    const authStore = useAuthStore.getState();
    if (!this.isSessionValid()) {
      authStore.logout();
    }
  }

  /**
   * Handle API errors and determine if they're session-related
   */
  public handleApiError(error: any): boolean {
    if (this.isRefreshTokenExpired(error)) {
      this.handleSessionExpired();
      return true; // Error was handled
    }
    return false; // Error not handled, let caller handle it
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Hook for React components
export const useSessionManager = () => {
  return sessionManager;
};
