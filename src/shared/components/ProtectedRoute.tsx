'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Lightweight client-side authentication guard
 * 
 * This component provides a final safety check for authentication on the client side.
 * Most authentication checking is now handled by middleware, but this provides
 * a fallback for edge cases and ensures the auth state is properly loaded.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If the middleware let us through but we don't have authentication state,
    // redirect to login (this handles edge cases)
    if (!isAuthenticated) {
      console.log('[ProtectedRoute] No client-side authentication state, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // If not authenticated, show loading spinner while redirect happens
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};