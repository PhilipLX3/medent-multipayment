'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/shared/store/authStore'
import { authService } from '@/shared/services'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, token, refreshAuthToken, logout } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const validateAndRedirect = async () => {
      try {
        console.log('[HomePage] Authentication state:', { isAuthenticated, hasToken: !!token });
        
        // If no token at all, go to login immediately
        if (!token) {
          console.log('[HomePage] No token found, redirecting to login')
          setIsValidating(false)
          router.replace('/login')
          return
        }

        // If we have a token, validate it by making API call
        if (isAuthenticated && token) {
          console.log('[HomePage] Validating existing token with API call...')
          
          try {
            // Validate token by calling /v1/auth/me
            await authService.me()
            console.log('[HomePage] Token valid, redirecting to projects')
            router.replace('/projects')
          } catch (error: any) {
            console.log('[HomePage] Token validation failed:', error?.response?.status)
            
            // If token is invalid (401), try to refresh it once
            if (error?.response?.status === 401) {
              console.log('[HomePage] Attempting token refresh')
              try {
                const refreshSuccess = await refreshAuthToken()
                if (refreshSuccess) {
                  console.log('[HomePage] Token refresh successful, redirecting to projects')
                  router.replace('/projects')
                } else {
                  console.log('[HomePage] Token refresh failed, redirecting to login')
                  logout()
                  setTimeout(() => {
                    router.replace('/login')
                  }, 100)
                }
              } catch (refreshError) {
                console.log('[HomePage] Token refresh error:', refreshError)
                logout()
                setTimeout(() => {
                  router.replace('/login')
                }, 100)
              }
            } else {
              // For other errors, logout and redirect
              console.log('[HomePage] Authentication error, redirecting to login')
              logout()
              setTimeout(() => {
                router.replace('/login')
              }, 100)
            }
          }
        } else {
          console.log('[HomePage] Not authenticated, redirecting to login')
          router.replace('/login')
        }
      } catch (error) {
        console.error('[HomePage] Validation error:', error)
        logout()
        setTimeout(() => {
          router.replace('/login')
        }, 100)
      } finally {
        setIsValidating(false)
      }
    }

    // Small delay to ensure auth store is hydrated from localStorage
    const timer = setTimeout(validateAndRedirect, 50)
    
    return () => clearTimeout(timer)
  }, []) // Only run once on mount

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {isValidating ? '認証確認中...' : 'リダイレクト中...'}
        </p>
      </div>
    </div>
  )
}
