'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Market Data', href: '/market' },
  { name: 'Trading', href: '/trading' },
  { name: 'Risk Monitor', href: '/risk' },
  { name: 'Audit Log', href: '/audit' },
  { name: 'Chaos Testing', href: '/testing' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="bg-surface border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">₿</span>
              </div>
              <span className="text-xl font-bold text-gradient">
                Crypto Trading Simulator
              </span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Grafana
            </a>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Prometheus
            </a>
            <a
              href="http://localhost:16686"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Jaeger
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
