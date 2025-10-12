import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/presentation/components/nav-bar'

export const metadata: Metadata = {
  title: 'Crypto Trading Simulator',
  description: 'Production-grade distributed crypto trading simulation and risk management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
