import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sharda Vidhyalaya - School Management System',
  description: 'Complete school management solution',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon/fonts/remixicon.css" rel="stylesheet" />
        <link rel="icon" href="/logo.png" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={`${inter.className} bg-[color:var(--sv-bg)]`}> 
        <ThemeProvider>
          <div className="min-h-screen sv-container">
            {children}
            <Toaster position="top-right" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
