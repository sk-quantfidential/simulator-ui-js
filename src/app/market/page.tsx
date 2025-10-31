'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/presentation/components/metric-card'
import { PriceChart } from '@/presentation/components/price-chart'
import { OrderBookView } from '@/presentation/components/order-book'
import type { MarketPrice, OrderBook, Trade, CryptoAsset } from '@/domain/types'
import { RestMarketData } from '@/infrastructure/adapters/rest-market-data'
import { formatUSD, formatPercent, formatDateTime } from '@/domain/services/formatters'

export default function MarketPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>('BTC')
  const [priceHistory, setPriceHistory] = useState<{ timestamp: number; price: number }[]>([])
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const marketData = new RestMarketData()

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const [pricesData, historyData, orderBookData, tradesData] = await Promise.all([
          marketData.getAllPrices(),
          marketData.getHistoricalData(selectedAsset, '1h', 24),
          marketData.getOrderBook(selectedAsset, 10),
          marketData.getRecentTrades(selectedAsset, 20),
        ])

        setPrices(pricesData)
        setPriceHistory(historyData.map(bar => ({
          timestamp: bar.timestamp,
          price: bar.close,
        })))
        setOrderBook(orderBookData)
        setRecentTrades(tradesData)
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Subscribe to real-time price updates via SSE
    const unsubscribePrices = marketData.subscribeTopriceUpdates(
      ['BTC', 'ETH', 'SOL'],
      (updatedPrice) => {
        // Update prices list
        setPrices((prevPrices) => {
          const index = prevPrices.findIndex((p) => p.asset === updatedPrice.asset)
          if (index >= 0) {
            const newPrices = [...prevPrices]
            newPrices[index] = updatedPrice
            return newPrices
          }
          return [...prevPrices, updatedPrice]
        })

        // Update price history for selected asset
        if (updatedPrice.asset === selectedAsset) {
          setPriceHistory((prevHistory) => [
            ...prevHistory.slice(-23), // Keep last 23 points
            { timestamp: updatedPrice.timestamp, price: updatedPrice.price }
          ])
        }
      }
    )

    // Poll for order book and trades (less frequent updates)
    const dataInterval = setInterval(async () => {
      try {
        const [orderBookData, tradesData] = await Promise.all([
          marketData.getOrderBook(selectedAsset, 10),
          marketData.getRecentTrades(selectedAsset, 20),
        ])
        setOrderBook(orderBookData)
        setRecentTrades(tradesData)
      } catch (error) {
        console.error('Failed to fetch order book/trades:', error)
      }
    }, 10000) // 10 seconds for order book/trades

    return () => {
      unsubscribePrices()
      clearInterval(dataInterval)
    }
  }, [selectedAsset])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Market Data
        </h1>
        <p className="text-text-secondary">
          Real-time cryptocurrency prices and market information
        </p>
      </div>

      {/* Current Prices */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Current Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prices.map((price) => (
            <MetricCard
              key={price.asset}
              title={`${price.asset} / USD`}
              value={formatUSD(price.price)}
              change={price.changePercent24h}
              subtitle={`24h: ${formatPercent(price.changePercent24h)}`}
              color="default"
            />
          ))}
        </div>
      </div>

      {/* Asset Selector */}
      <div className="flex space-x-2">
        {(['BTC', 'ETH', 'SOL'] as CryptoAsset[]).map((asset) => (
          <button
            key={asset}
            onClick={() => setSelectedAsset(asset)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedAsset === asset
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface-hover text-text-secondary'
            }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {/* Price Chart */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">{selectedAsset} Price Chart (24h)</h2>
        {priceHistory.length > 0 ? (
          <PriceChart asset={selectedAsset} data={priceHistory} />
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p>Loading chart...</p>
          </div>
        )}
      </div>

      {/* Order Book */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">{selectedAsset} Order Book</h2>
        {orderBook ? (
          <OrderBookView orderBook={orderBook} />
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p>Loading order book...</p>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>
        {recentTrades.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-text-secondary pb-2 border-b border-border">
              <div>Time</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Side</div>
            </div>
            {recentTrades.map((trade) => (
              <div key={trade.id} className="grid grid-cols-4 gap-4 text-sm py-2 hover:bg-surface-hover rounded">
                <div className="text-text-tertiary">
                  {formatDateTime(trade.timestamp).split(', ')[1]}
                </div>
                <div className="font-medium">{formatUSD(trade.price)}</div>
                <div className="text-text-secondary">{trade.quantity.toFixed(4)}</div>
                <div>
                  <span className={`badge ${
                    trade.side === 'buy' ? 'bg-success/20 text-success border-success' : 'bg-danger/20 text-danger border-danger'
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p>No recent trades</p>
          </div>
        )}
      </div>
    </div>
  )
}
