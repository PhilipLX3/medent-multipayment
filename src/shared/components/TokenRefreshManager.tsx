'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * TokenRefreshManager - Automatic JWT token refresh
 * 
 * This component handles periodic token refresh to prevent expiration during user activity.
 * Initial authentication validation is now handled by middleware for better UX.
 * 
 * Refreshes tokens every 13 minutes (2 minutes before the 15-minute expiration)
 * to prevent authentication errors during user sessions.
 */
export function TokenRefreshManager() {
  const { isAuthenticated, refreshAuthToken } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout>();
  const pathname = usePathname();

  useEffect(() => {
    // Don't start refresh cycle on login page or if not authenticated
    if (!isAuthenticated || pathname === '/login') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Function to refresh token proactively
    const refreshTokenProactively = async () => {
      try {
        const success = await refreshAuthToken();
        if (success) {
          console.log('[TokenRefresh] Periodic token refresh successful');
        } else {
          console.log('[TokenRefresh] Periodic token refresh failed, user will be logged out');
        }
      } catch (error) {
        console.error('[TokenRefresh] Periodic token refresh error:', error);
      }
    };

    // Refresh token every 13 minutes (JWT expires at 15 minutes)
    // This gives us a 2-minute buffer before expiration
    const refreshInterval = 13 * 60 * 1000; // 13 minutes in milliseconds

    // Start the refresh interval
    intervalRef.current = setInterval(refreshTokenProactively, refreshInterval);

    console.log('[TokenRefresh] Started periodic token refresh');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('[TokenRefresh] Stopped periodic token refresh');
      }
    };
  }, [isAuthenticated, refreshAuthToken, pathname]);

  // This component doesn't render anything
  return null;
}
