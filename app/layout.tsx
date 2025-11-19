import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'
import { AuthWrapper } from '@/shared/components'
import { TokenRefreshManager } from '@/shared/components/TokenRefreshManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Medical Payment',
  description: 'Medical Payment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthWrapper>
          <Providers>
            <TokenRefreshManager />
            {children}
          </Providers>
        </AuthWrapper>
      </body>
    </html>
  )
}
