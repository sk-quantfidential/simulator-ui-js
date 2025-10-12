/**
 * Market Data Port - Interface for cryptocurrency market data
 * Adapters must implement this interface to provide market data
 */

import type { CryptoAsset, MarketPrice, OHLCVBar, OrderBook, Trade, PriceHistory } from '@/domain/types'

export interface MarketDataPort {
  /**
   * Get current price for an asset
   */
  getCurrentPrice(asset: CryptoAsset): Promise<MarketPrice>

  /**
   * Get current prices for all assets
   */
  getAllPrices(): Promise<MarketPrice[]>

  /**
   * Get historical OHLCV data
   */
  getHistoricalData(
    asset: CryptoAsset,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit?: number
  ): Promise<OHLCVBar[]>

  /**
   * Get order book for an asset
   */
  getOrderBook(asset: CryptoAsset, depth?: number): Promise<OrderBook>

  /**
   * Get recent trades for an asset
   */
  getRecentTrades(asset: CryptoAsset, limit?: number): Promise<Trade[]>

  /**
   * Get price history formatted for charts
   */
  getPriceHistory(
    asset: CryptoAsset,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit?: number
  ): Promise<PriceHistory>

  /**
   * Subscribe to real-time price updates (SSE)
   */
  subscribeTopriceUpdates(
    assets: CryptoAsset[],
    onUpdate: (price: MarketPrice) => void
  ): () => void
}
