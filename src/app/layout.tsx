import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from '@/components/layout/AuthProvider'
import AuthGuard from '@/components/layout/AuthGuard'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: '나의 가계부',
  description: '자산 관리의 시작',
  manifest: '/manifest.json',
  icons: {
    apple: '/imgs/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Header />
          <AuthGuard>
            <div className="min-h-screen">{children}</div>
          </AuthGuard>
          <Footer />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
