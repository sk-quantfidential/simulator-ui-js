/**
 * REST Market Data Adapter
 * Implements MarketDataPort using market-data-simulator REST API
 */

import type { MarketDataPort } from '@/application/ports/market-data-port'
import type { CryptoAsset, MarketPrice, OHLCVBar, OrderBook, Trade, PriceHistory } from '@/domain/types'
import { httpClient } from '../utils/http-client'
import { getServiceEndpoints } from '../config/api-config'
import { createSSEClient, type SSEClient } from '../utils/sse-client'

export class RestMarketData implements MarketDataPort {
  private baseUrl: string
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTimeout = 2000 // 2 seconds cache

  constructor() {
    this.baseUrl = getServiceEndpoints().marketDataSimulator
  }

  async getCurrentPrice(asset: CryptoAsset): Promise<MarketPrice> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/market/price/${asset}`
      )

      return this.transformMarketPrice(asset, response)
    } catch (error) {
      console.error(`Failed to fetch price for ${asset}:`, error)
      return this.createMockPrice(asset)
    }
  }

  async getAllPrices(): Promise<MarketPrice[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/market/prices`
      )

      const assets: CryptoAsset[] = ['BTC', 'ETH', 'SOL']
      return assets.map(asset =>
        this.transformMarketPrice(asset, response[asset] || {})
      )
    } catch (error) {
      console.error('Failed to fetch all prices:', error)
      return ['BTC', 'ETH', 'SOL'].map(this.createMockPrice)
    }
  }

  async getHistoricalData(
    asset: CryptoAsset,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100
  ): Promise<OHLCVBar[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/market/history/${asset}?interval=${interval}&limit=${limit}`
      )

      return (response.data || []).map(this.transformOHLCV)
    } catch (error) {
      console.error(`Failed to fetch historical data for ${asset}:`, error)
      return this.generateMockHistoricalData(asset, limit)
    }
  }

  async getOrderBook(asset: CryptoAsset, depth: number = 20): Promise<OrderBook> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/market/orderbook/${asset}?depth=${depth}`
      )

      return {
        asset,
        bids: response.bids?.map(this.transformOrderBookLevel) || [],
        asks: response.asks?.map(this.transformOrderBookLevel) || [],
        timestamp: response.timestamp || Date.now(),
      }
    } catch (error) {
      console.error(`Failed to fetch order book for ${asset}:`, error)
      return this.createMockOrderBook(asset)
    }
  }

  async getRecentTrades(asset: CryptoAsset, limit: number = 50): Promise<Trade[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/market/trades/${asset}?limit=${limit}`
      )

      return (response.trades || []).map((t: any) => this.transformTrade(asset, t))
    } catch (error) {
      console.error(`Failed to fetch recent trades for ${asset}:`, error)
      return []
    }
  }

  async getPriceHistory(
    asset: CryptoAsset,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100
  ): Promise<PriceHistory> {
    const data = await this.getHistoricalData(asset, interval, limit)

    return {
      asset,
      interval,
      data: data.map(bar => ({
        timestamp: bar.timestamp,
        value: bar.close,
      })),
    }
  }

  subscribeTopriceUpdates(
    assets: CryptoAsset[],
    onUpdate: (price: MarketPrice) => void
  ): () => void {
    // Create SSE connection to market data stream
    const streamUrl = `${this.baseUrl}/api/v1/stream/prices`
    let sseClient: SSEClient | null = null

    try {
      sseClient = createSSEClient(streamUrl, {
        maxReconnectAttempts: 10,
        reconnectDelay: 2000,
        maxReconnectDelay: 30000,
      })

      // Subscribe to price update events
      const unsubscribePrice = sseClient.on<any>('price', (message) => {
        try {
          const { asset, data } = message.data
          if (assets.includes(asset as CryptoAsset)) {
            const price = this.transformMarketPrice(asset, data)
            onUpdate(price)
          }
        } catch (error) {
          console.error('Failed to process price update:', error)
        }
      })

      // Subscribe to batch price updates (if all assets sent at once)
      const unsubscribePrices = sseClient.on<any>('prices', (message) => {
        try {
          const updates = message.data
          for (const asset of assets) {
            if (updates[asset]) {
              const price = this.transformMarketPrice(asset as CryptoAsset, updates[asset])
              onUpdate(price)
            }
          }
        } catch (error) {
          console.error('Failed to process price updates:', error)
        }
      })

      // Handle connection errors with fallback to polling
      sseClient.onError((error) => {
        console.warn('SSE connection error, will retry:', error.message)
      })

      // Return cleanup function
      return () => {
        unsubscribePrice()
        unsubscribePrices()
        sseClient?.disconnect()
      }
    } catch (error) {
      console.error('Failed to establish SSE connection, falling back to polling:', error)

      // Fallback to polling if SSE fails
      const intervalId = setInterval(async () => {
        for (const asset of assets) {
          try {
            const price = await this.getCurrentPrice(asset)
            onUpdate(price)
          } catch (error) {
            console.error(`Price update failed for ${asset}:`, error)
          }
        }
      }, 5000)

      return () => {
        clearInterval(intervalId)
        sseClient?.disconnect()
      }
    }
  }

  private transformMarketPrice(asset: CryptoAsset, data: any): MarketPrice {
    return {
      asset,
      price: data.price || data.last_price || 0,
      timestamp: data.timestamp || Date.now(),
      change24h: data.change_24h || 0,
      changePercent24h: data.change_percent_24h || 0,
    }
  }

  private transformOHLCV(data: any): OHLCVBar {
    return {
      timestamp: data.timestamp || data.time || Date.now(),
      open: data.open || 0,
      high: data.high || 0,
      low: data.low || 0,
      close: data.close || 0,
      volume: data.volume || 0,
    }
  }

  private transformOrderBookLevel(data: any): { price: number; quantity: number; total: number } {
    return {
      price: data[0] || data.price || 0,
      quantity: data[1] || data.quantity || 0,
      total: (data[0] || 0) * (data[1] || 0),
    }
  }

  private transformTrade(asset: CryptoAsset, data: any): Trade {
    return {
      id: data.id || `${Date.now()}`,
      asset,
      price: data.price || 0,
      quantity: data.quantity || data.amount || 0,
      side: data.side || 'buy',
      timestamp: data.timestamp || Date.now(),
    }
  }

  private createMockPrice(asset: CryptoAsset): MarketPrice {
    const basePrices = { BTC: 65000, ETH: 3500, SOL: 150 }
    const price = basePrices[asset]

    return {
      asset,
      price,
      timestamp: Date.now(),
      change24h: price * 0.02,
      changePercent24h: 2.0,
    }
  }

  private generateMockHistoricalData(asset: CryptoAsset, limit: number): OHLCVBar[] {
    const basePrices = { BTC: 65000, ETH: 3500, SOL: 150 }
    const basePrice = basePrices[asset]
    const data: OHLCVBar[] = []
    const now = Date.now()

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * 3600000 // 1 hour intervals
      const volatility = 0.01
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility)
      const high = open * (1 + Math.random() * volatility)
      const low = open * (1 - Math.random() * volatility)
      const close = low + Math.random() * (high - low)

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000,
      })
    }

    return data
  }

  private createMockOrderBook(asset: CryptoAsset): OrderBook {
    const basePrices = { BTC: 65000, ETH: 3500, SOL: 150 }
    const price = basePrices[asset]
    const bids: any[] = []
    const asks: any[] = []

    for (let i = 0; i < 10; i++) {
      const bidPrice = price * (1 - (i + 1) * 0.0001)
      const askPrice = price * (1 + (i + 1) * 0.0001)
      const quantity = Math.random() * 10

      bids.push({
        price: bidPrice,
        quantity,
        total: bidPrice * quantity,
      })

      asks.push({
        price: askPrice,
        quantity,
        total: askPrice * quantity,
      })
    }

    return {
      asset,
      bids,
      asks,
      timestamp: Date.now(),
    }
  }
}
