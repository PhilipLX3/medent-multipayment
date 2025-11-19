'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/store/authStore';
import { useSessionManager } from '@/shared/utils/sessionManager';
import { useRouter } from 'next/navigation';

interface SessionGuardProps {
  children: React.ReactNode;
}

/**
 * SessionGuard component that handles session validation and expiration
 * Should wrap protected routes or the entire app
 */
export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
  const { isAuthenticated, token, refreshToken, validateToken } = useAuthStore();
  const sessionManager = useSessionManager();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Skip validation for unauthenticated users
      if (!isAuthenticated) {
        return;
      }

      // Check if session data is valid
      if (!sessionManager.isSessionValid()) {
        console.log('[SessionGuard] Invalid session detected, clearing');
        sessionManager.clearInvalidSession();
        router.replace('/login');
        return;
      }

      // Validate token with backend
      try {
        const isValid = await validateToken();
        if (!isValid) {
          console.log('[SessionGuard] Token validation failed');
          sessionManager.handleSessionExpired();
        }
      } catch (error) {
        console.error('[SessionGuard] Session validation error:', error);
        // Handle the error through session manager
        const handled = sessionManager.handleApiError(error);
        if (!handled) {
          // If not a session-related error, just log it
          console.error('[SessionGuard] Non-session error during validation:', error);
        }
      }
    };

    // Only check session if we have authentication data
    if (isAuthenticated && token) {
      checkSession();
    }
  }, [isAuthenticated, token, refreshToken, validateToken, sessionManager, router]);

  // Set up periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (sessionManager.isSessionValid()) {
        try {
          const isValid = await validateToken();
          if (!isValid) {
            console.log('[SessionGuard] Periodic validation failed');
            sessionManager.handleSessionExpired();
          }
        } catch (error) {
          sessionManager.handleApiError(error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, validateToken, sessionManager]);

  return <>{children}</>;
};

export default SessionGuard;
