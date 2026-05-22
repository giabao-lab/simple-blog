import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Simple Blog',
  description: 'A simple blog built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} flex min-h-full flex-col bg-white text-slate-900 antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
