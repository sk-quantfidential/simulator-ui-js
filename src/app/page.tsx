'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/presentation/components/metric-card'
import { ServiceHealthIndicator } from '@/presentation/components/service-health-indicator'
import type { ServiceHealth, MarketPrice } from '@/domain/types'
import { RestServiceRegistry } from '@/infrastructure/adapters/rest-service-registry'
import { RestMarketData } from '@/infrastructure/adapters/rest-market-data'
import { formatUSD, formatPercent } from '@/domain/services/formatters'

export default function DashboardPage() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const serviceRegistry = new RestServiceRegistry()
    const marketData = new RestMarketData()

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const [servicesData, pricesData] = await Promise.all([
          serviceRegistry.getAllServices(),
          marketData.getAllPrices(),
        ])

        setServices(servicesData)
        setPrices(pricesData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Subscribe to real-time price updates via SSE
    const unsubscribePrices = marketData.subscribeTopriceUpdates(
      ['BTC', 'ETH', 'SOL'],
      (updatedPrice) => {
        setPrices((prevPrices) => {
          const index = prevPrices.findIndex((p) => p.asset === updatedPrice.asset)
          if (index >= 0) {
            const newPrices = [...prevPrices]
            newPrices[index] = updatedPrice
            return newPrices
          }
          return [...prevPrices, updatedPrice]
        })
      }
    )

    // Poll for service health updates (SSE for services not implemented yet)
    const serviceInterval = setInterval(async () => {
      try {
        const servicesData = await serviceRegistry.getAllServices()
        setServices(servicesData)
      } catch (error) {
        console.error('Failed to fetch services:', error)
      }
    }, 5000)

    return () => {
      unsubscribePrices()
      clearInterval(serviceInterval)
    }
  }, [])

  const servicesUp = services.filter((s) => s.status === 'up').length
  const servicesTotal = services.length || 9 // Default to 9 services

  const btcPrice = prices.find((p) => p.asset === 'BTC')
  const ethPrice = prices.find((p) => p.asset === 'ETH')
  const solPrice = prices.find((p) => p.asset === 'SOL')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Trading Ecosystem Dashboard
        </h1>
        <p className="text-text-secondary">
          Real-time monitoring of distributed crypto trading simulation system
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="System Health"
          value={`${servicesUp}/${servicesTotal}`}
          subtitle="Services Online"
          color={servicesUp === servicesTotal ? 'success' : 'warning'}
        />
        <MetricCard
          title="Active Trades"
          value="12"
          change={8.5}
          subtitle="Open Positions"
          color="default"
        />
        <MetricCard
          title="Total Exposure"
          value={formatUSD(245000)}
          change={-2.3}
          subtitle="USD"
          color="warning"
        />
        <MetricCard
          title="Portfolio PnL"
          value={formatUSD(12450)}
          change={5.2}
          subtitle="24h"
          color="success"
        />
      </div>

      {/* Market Prices */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Market Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Bitcoin (BTC)"
            value={btcPrice ? formatUSD(btcPrice.price) : '-'}
            change={btcPrice?.changePercent24h}
            color="default"
          />
          <MetricCard
            title="Ethereum (ETH)"
            value={ethPrice ? formatUSD(ethPrice.price) : '-'}
            change={ethPrice?.changePercent24h}
            color="default"
          />
          <MetricCard
            title="Solana (SOL)"
            value={solPrice ? formatUSD(solPrice.price) : '-'}
            change={solPrice?.changePercent24h}
            color="default"
          />
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Service Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceHealthIndicator
                key={service.name}
                name={service.name}
                status={service.status}
                instance={service.instance}
                uptime={service.uptime}
                version={service.version}
                showDetails
              />
            ))
          ) : (
            <div className="col-span-2 card text-center py-12">
              <p className="text-text-secondary">
                No services detected. Make sure the infrastructure is running.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-hover cursor-pointer" onClick={() => window.location.href = '/market'}>
          <h3 className="text-xl font-bold mb-2">Market Data</h3>
          <p className="text-text-secondary text-sm">
            View real-time price charts and order books
          </p>
        </div>
        <div className="card-hover cursor-pointer" onClick={() => window.location.href = '/risk'}>
          <h3 className="text-xl font-bold mb-2">Risk Monitor</h3>
          <p className="text-text-secondary text-sm">
            Portfolio risk metrics and VaR analysis
          </p>
        </div>
        <div className="card-hover cursor-pointer" onClick={() => window.location.href = '/testing'}>
          <h3 className="text-xl font-bold mb-2">Chaos Testing</h3>
          <p className="text-text-secondary text-sm">
            Run chaos scenarios and stress tests
          </p>
        </div>
      </div>
    </div>
  )
}
