/**
 * Trading Port - Interface for trading operations and positions
 * Adapters must implement this interface to provide trading functionality
 */

import type { Position, Order, ExchangeAccount, AccountBalance } from '@/domain/types'

export interface TradingPort {
  /**
   * Get all open positions
   */
  getOpenPositions(): Promise<Position[]>

  /**
   * Get a specific position by ID
   */
  getPosition(positionId: string): Promise<Position>

  /**
   * Get all orders (active and recent)
   */
  getOrders(): Promise<Order[]>

  /**
   * Get exchange account information
   */
  getExchangeAccount(accountId: string): Promise<ExchangeAccount>

  /**
   * Get all exchange accounts
   */
  getAllExchangeAccounts(): Promise<ExchangeAccount[]>

  /**
   * Get account balances
   */
  getAccountBalances(accountId: string): Promise<AccountBalance[]>

  /**
   * Subscribe to position updates (SSE)
   */
  subscribeToPositionUpdates(
    onUpdate: (position: Position) => void
  ): () => void

  /**
   * Subscribe to order updates (SSE)
   */
  subscribeToOrderUpdates(
    onUpdate: (order: Order) => void
  ): () => void
}
