'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/shared/store/authStore'
import LoginPage from '../_components/LoginPage'
import { AuthLayout } from '@/shared/components/layouts/AuthLayout'

export default function Login() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/projects')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  )
}
