/**
 * REST Trading Adapter
 * Implements TradingPort using exchange-simulator REST API
 */

import type { TradingPort } from '@/application/ports/trading-port'
import type { Position, Order, ExchangeAccount, AccountBalance, CryptoAsset } from '@/domain/types'
import { httpClient } from '../utils/http-client'
import { getServiceEndpoints } from '../config/api-config'
import { createSSEClient, type SSEClient } from '../utils/sse-client'

export class RestTrading implements TradingPort {
  private baseUrl: string

  constructor() {
    this.baseUrl = getServiceEndpoints().exchangeSimulator
  }

  async getOpenPositions(): Promise<Position[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/positions`
      )

      return (response.positions || []).map(this.transformPosition)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
      return this.createMockPositions()
    }
  }

  async getPosition(positionId: string): Promise<Position> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/positions/${positionId}`
      )

      return this.transformPosition(response)
    } catch (error) {
      console.error(`Failed to fetch position ${positionId}:`, error)
      throw error
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/orders`
      )

      return (response.orders || []).map(this.transformOrder)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      return []
    }
  }

  async getExchangeAccount(accountId: string): Promise<ExchangeAccount> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/accounts/${accountId}`
      )

      return this.transformExchangeAccount(response)
    } catch (error) {
      console.error(`Failed to fetch account ${accountId}:`, error)
      throw error
    }
  }

  async getAllExchangeAccounts(): Promise<ExchangeAccount[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/accounts`
      )

      return (response.accounts || []).map(this.transformExchangeAccount)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      return [this.createMockAccount()]
    }
  }

  async getAccountBalances(accountId: string): Promise<AccountBalance[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/accounts/${accountId}/balances`
      )

      return (response.balances || []).map(this.transformBalance)
    } catch (error) {
      console.error(`Failed to fetch balances for ${accountId}:`, error)
      return this.createMockBalances()
    }
  }

  subscribeToPositionUpdates(onUpdate: (position: Position) => void): () => void {
    // Create SSE connection to positions stream
    const streamUrl = `${this.baseUrl}/api/v1/stream/positions`
    let sseClient: SSEClient | null = null

    try {
      sseClient = createSSEClient(streamUrl, {
        maxReconnectAttempts: 10,
        reconnectDelay: 2000,
        maxReconnectDelay: 30000,
      })

      // Subscribe to position update events
      const unsubscribePosition = sseClient.on<any>('position', (message) => {
        try {
          const position = this.transformPosition(message.data)
          onUpdate(position)
        } catch (error) {
          console.error('Failed to process position update:', error)
        }
      })

      // Subscribe to batch position updates
      const unsubscribePositions = sseClient.on<any>('positions', (message) => {
        try {
          const positions = (message.data.positions || []).map(this.transformPosition.bind(this))
          positions.forEach(onUpdate)
        } catch (error) {
          console.error('Failed to process positions update:', error)
        }
      })

      // Handle connection errors
      sseClient.onError((error) => {
        console.warn('SSE connection error for position updates, will retry:', error.message)
      })

      // Return cleanup function
      return () => {
        unsubscribePosition()
        unsubscribePositions()
        sseClient?.disconnect()
      }
    } catch (error) {
      console.error('Failed to establish SSE connection for positions, falling back to polling:', error)

      // Fallback to polling if SSE fails
      const intervalId = setInterval(async () => {
        try {
          const positions = await this.getOpenPositions()
          positions.forEach(onUpdate)
        } catch (error) {
          console.error('Position update failed:', error)
        }
      }, 5000)

      return () => {
        clearInterval(intervalId)
        sseClient?.disconnect()
      }
    }
  }

  subscribeToOrderUpdates(onUpdate: (order: Order) => void): () => void {
    // Create SSE connection to orders stream
    const streamUrl = `${this.baseUrl}/api/v1/stream/orders`
    let sseClient: SSEClient | null = null

    try {
      sseClient = createSSEClient(streamUrl, {
        maxReconnectAttempts: 10,
        reconnectDelay: 2000,
        maxReconnectDelay: 30000,
      })

      // Subscribe to order update events
      const unsubscribeOrder = sseClient.on<any>('order', (message) => {
        try {
          const order = this.transformOrder(message.data)
          onUpdate(order)
        } catch (error) {
          console.error('Failed to process order update:', error)
        }
      })

      // Subscribe to batch order updates
      const unsubscribeOrders = sseClient.on<any>('orders', (message) => {
        try {
          const orders = (message.data.orders || []).map(this.transformOrder.bind(this))
          orders.forEach(onUpdate)
        } catch (error) {
          console.error('Failed to process orders update:', error)
        }
      })

      // Handle connection errors
      sseClient.onError((error) => {
        console.warn('SSE connection error for order updates, will retry:', error.message)
      })

      // Return cleanup function
      return () => {
        unsubscribeOrder()
        unsubscribeOrders()
        sseClient?.disconnect()
      }
    } catch (error) {
      console.error('Failed to establish SSE connection for orders, falling back to polling:', error)

      // Fallback to polling if SSE fails
      const intervalId = setInterval(async () => {
        try {
          const orders = await this.getOrders()
          orders.forEach(onUpdate)
        } catch (error) {
          console.error('Order update failed:', error)
        }
      }, 5000)

      return () => {
        clearInterval(intervalId)
        sseClient?.disconnect()
      }
    }
  }

  private transformPosition(data: any): Position {
    return {
      id: data.id || data.position_id || `pos-${Date.now()}`,
      asset: data.asset || data.symbol || 'BTC',
      side: data.side || 'long',
      quantity: data.quantity || data.amount || 0,
      entryPrice: data.entry_price || data.avg_price || 0,
      currentPrice: data.current_price || data.mark_price || 0,
      unrealizedPnL: data.unrealized_pnl || 0,
      realizedPnL: data.realized_pnl || 0,
      marginUsed: data.margin_used || data.initial_margin || 0,
      liquidationPrice: data.liquidation_price || 0,
      timestamp: data.timestamp || data.created_at || Date.now(),
    }
  }

  private transformOrder(data: any): Order {
    return {
      id: data.id || data.order_id || `order-${Date.now()}`,
      asset: data.asset || data.symbol || 'BTC',
      side: data.side || 'buy',
      type: data.type || data.order_type || 'market',
      quantity: data.quantity || data.amount || 0,
      price: data.price,
      stopPrice: data.stop_price,
      status: data.status || 'pending',
      filledQuantity: data.filled_quantity || data.executed_qty || 0,
      averagePrice: data.average_price || data.avg_fill_price || 0,
      timestamp: data.timestamp || data.created_at || Date.now(),
      updatedAt: data.updated_at || Date.now(),
    }
  }

  private transformExchangeAccount(data: any): ExchangeAccount {
    return {
      accountId: data.account_id || data.id || 'default',
      balances: (data.balances || []).map(this.transformBalance),
      totalEquityUSD: data.total_equity_usd || data.total_value || 0,
      timestamp: data.timestamp || Date.now(),
    }
  }

  private transformBalance(data: any): AccountBalance {
    return {
      asset: data.asset || data.currency || 'BTC',
      available: data.available || data.free || 0,
      locked: data.locked || data.used || 0,
      total: data.total || (data.available || 0) + (data.locked || 0),
    }
  }

  private createMockPositions(): Position[] {
    const assets: CryptoAsset[] = ['BTC', 'ETH']
    const basePrices = { BTC: 65000, ETH: 3500, SOL: 150 }

    return assets.map((asset, i) => {
      const entryPrice = basePrices[asset]
      const currentPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.05)
      const quantity = Math.random() * 2
      const side: 'long' | 'short' = i % 2 === 0 ? 'long' : 'short'

      return {
        id: `pos-${i + 1}`,
        asset,
        side,
        quantity,
        entryPrice,
        currentPrice,
        unrealizedPnL: (currentPrice - entryPrice) * quantity * (side === 'long' ? 1 : -1),
        realizedPnL: 0,
        marginUsed: entryPrice * quantity * 0.1,
        liquidationPrice: side === 'long' ? entryPrice * 0.8 : entryPrice * 1.2,
        timestamp: Date.now() - Math.random() * 86400000,
      }
    })
  }

  private createMockAccount(): ExchangeAccount {
    return {
      accountId: 'main-account',
      balances: this.createMockBalances(),
      totalEquityUSD: 100000,
      timestamp: Date.now(),
    }
  }

  private createMockBalances(): AccountBalance[] {
    return [
      {
        asset: 'BTC',
        available: 0.5,
        locked: 0.1,
        total: 0.6,
      },
      {
        asset: 'ETH',
        available: 10.0,
        locked: 2.5,
        total: 12.5,
      },
      {
        asset: 'SOL',
        available: 100.0,
        locked: 20.0,
        total: 120.0,
      },
    ]
  }
}
