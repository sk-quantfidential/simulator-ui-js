/**
 * REST Market Data Adapter SSE Tests
 */

import { RestMarketData } from '@/infrastructure/adapters/rest-market-data'
import type { CryptoAsset, MarketPrice } from '@/domain/types'

// Mock the SSE client
jest.mock('@/infrastructure/utils/sse-client', () => ({
  createSSEClient: jest.fn(() => ({
    on: jest.fn((event, handler) => {
      // Store handler for testing
      ;(mockSSEClient as any)[`${event}Handler`] = handler
      return jest.fn() // unsubscribe function
    }),
    onError: jest.fn(),
    disconnect: jest.fn(),
  })),
}))

const mockSSEClient = {} as any

describe('RestMarketData SSE Integration', () => {
  let adapter: RestMarketData

  beforeEach(() => {
    adapter = new RestMarketData()
    jest.clearAllMocks()
  })

  describe('Price Update Subscriptions', () => {
    it('should subscribe to price updates via SSE', () => {
      const assets: CryptoAsset[] = ['BTC', 'ETH']
      const onUpdate = jest.fn()

      const unsubscribe = adapter.subscribeTopriceUpdates(assets, onUpdate)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should handle individual price update events', () => {
      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      // Simulate SSE price event
      const priceEvent = {
        data: {
          asset: 'BTC',
          data: {
            price: 65000,
            timestamp: Date.now(),
            change_24h: 1000,
            change_percent_24h: 1.5,
          },
        },
      }

      if (mockSSEClient.priceHandler) {
        mockSSEClient.priceHandler(priceEvent)
      }

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 'BTC',
          price: 65000,
        })
      )
    })

    it('should handle batch price update events', () => {
      const assets: CryptoAsset[] = ['BTC', 'ETH', 'SOL']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      // Simulate SSE prices event (batch)
      const pricesEvent = {
        data: {
          BTC: {
            price: 65000,
            timestamp: Date.now(),
            change_24h: 1000,
            change_percent_24h: 1.5,
          },
          ETH: {
            price: 3500,
            timestamp: Date.now(),
            change_24h: 50,
            change_percent_24h: 1.4,
          },
        },
      }

      if (mockSSEClient.pricesHandler) {
        mockSSEClient.pricesHandler(pricesEvent)
      }

      expect(onUpdate).toHaveBeenCalledTimes(2)
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ asset: 'BTC' })
      )
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ asset: 'ETH' })
      )
    })

    it('should filter updates to only subscribed assets', () => {
      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      // Simulate SSE event for non-subscribed asset
      const priceEvent = {
        data: {
          asset: 'ETH',
          data: {
            price: 3500,
            timestamp: Date.now(),
          },
        },
      }

      if (mockSSEClient.priceHandler) {
        mockSSEClient.priceHandler(priceEvent)
      }

      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('should handle malformed price data gracefully', () => {
      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      // Simulate malformed SSE event
      const badEvent = {
        data: null,
      }

      // Should not throw
      expect(() => {
        if (mockSSEClient.priceHandler) {
          mockSSEClient.priceHandler(badEvent)
        }
      }).not.toThrow()

      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('should cleanup subscription on unsubscribe', () => {
      const { createSSEClient } = require('@/infrastructure/utils/sse-client')
      const mockUnsubscribe = jest.fn()
      const mockDisconnect = jest.fn()

      createSSEClient.mockReturnValue({
        on: jest.fn(() => mockUnsubscribe),
        onError: jest.fn(),
        disconnect: mockDisconnect,
      })

      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      const unsubscribe = adapter.subscribeTopriceUpdates(assets, onUpdate)
      unsubscribe()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('SSE Fallback to Polling', () => {
    it('should fallback to polling when SSE connection fails', () => {
      jest.useFakeTimers()
      const { createSSEClient } = require('@/infrastructure/utils/sse-client')

      // Mock SSE client to throw error
      createSSEClient.mockImplementation(() => {
        throw new Error('SSE connection failed')
      })

      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      // Should not throw, should fallback to polling
      expect(() => {
        adapter.subscribeTopriceUpdates(assets, onUpdate)
      }).not.toThrow()

      jest.useRealTimers()
    })
  })

  describe('Data Transformation', () => {
    it('should correctly transform price data from SSE', () => {
      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      const priceEvent = {
        data: {
          asset: 'BTC',
          data: {
            price: 65432.10,
            last_price: 65000,
            timestamp: 1234567890,
            change_24h: 1234.5,
            change_percent_24h: 1.92,
          },
        },
      }

      if (mockSSEClient.priceHandler) {
        mockSSEClient.priceHandler(priceEvent)
      }

      expect(onUpdate).toHaveBeenCalledWith({
        asset: 'BTC',
        price: 65432.10,
        timestamp: 1234567890,
        change24h: 1234.5,
        changePercent24h: 1.92,
      })
    })

    it('should use default values for missing fields', () => {
      const assets: CryptoAsset[] = ['BTC']
      const onUpdate = jest.fn()

      adapter.subscribeTopriceUpdates(assets, onUpdate)

      const priceEvent = {
        data: {
          asset: 'BTC',
          data: {
            price: 65000,
            // Missing other fields
          },
        },
      }

      if (mockSSEClient.priceHandler) {
        mockSSEClient.priceHandler(priceEvent)
      }

      const receivedData = onUpdate.mock.calls[0][0] as MarketPrice
      expect(receivedData.asset).toBe('BTC')
      expect(receivedData.price).toBe(65000)
      expect(receivedData.change24h).toBe(0)
      expect(receivedData.changePercent24h).toBe(0)
      expect(receivedData.timestamp).toBeGreaterThan(0)
    })
  })
})
