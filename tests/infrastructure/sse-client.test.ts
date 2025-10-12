/**
 * SSE Client Tests
 */

import { SSEClient, createSSEClient } from '@/infrastructure/utils/sse-client'

describe('SSEClient', () => {
  let mockEventSource: any
  let originalEventSource: any

  beforeEach(() => {
    // Mock EventSource
    originalEventSource = global.EventSource
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 0, // CONNECTING
    }

    global.EventSource = jest.fn(() => mockEventSource) as any
  })

  afterEach(() => {
    global.EventSource = originalEventSource
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('Connection Management', () => {
    it('should create EventSource with correct URL', () => {
      const url = 'http://localhost:8080/stream'
      const client = new SSEClient(url)
      client.connect()

      expect(global.EventSource).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ withCredentials: false })
      )
    })

    it('should handle connection open event', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onOpen = jest.fn()
      client.onOpen(onOpen)

      client.connect()

      // Simulate open event
      mockEventSource.onopen()

      expect(onOpen).toHaveBeenCalled()
      expect(client.isConnected()).toBe(true)
    })

    it('should disconnect and cleanup resources', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      client.connect()

      client.disconnect()

      expect(mockEventSource.close).toHaveBeenCalled()
      expect(client.isConnected()).toBe(false)
    })

    it('should not reconnect after manual disconnect', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream')
      client.connect()

      // Simulate error
      mockEventSource.readyState = 2 // CLOSED
      mockEventSource.onerror()

      client.disconnect()

      jest.advanceTimersByTime(5000)

      // Should only be called once (initial connect)
      expect(global.EventSource).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })

    it('should return correct ready state', () => {
      const client = new SSEClient('http://localhost:8080/stream')

      expect(client.getReadyState()).toBe(2) // CLOSED (not connected)

      client.connect()
      mockEventSource.readyState = 1 // OPEN
      expect(client.getReadyState()).toBe(1)
    })
  })

  describe('Message Handling', () => {
    it('should subscribe to message events', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage = jest.fn()

      const unsubscribe = client.on('test_event', onMessage)
      client.connect()

      expect(typeof unsubscribe).toBe('function')
    })

    it('should handle JSON message data', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage = jest.fn()

      client.on('message', onMessage)
      client.connect()

      const testData = { foo: 'bar', baz: 123 }
      const event = new MessageEvent('message', {
        data: JSON.stringify(testData),
      })

      mockEventSource.onmessage(event)

      expect(onMessage).toHaveBeenCalledWith({
        event: 'message',
        data: testData,
        raw: JSON.stringify(testData),
        id: undefined,
      })
    })

    it('should handle plain text message data', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage = jest.fn()

      client.on('message', onMessage)
      client.connect()

      const event = new MessageEvent('message', {
        data: 'plain text message',
      })

      mockEventSource.onmessage(event)

      expect(onMessage).toHaveBeenCalledWith({
        event: 'message',
        data: 'plain text message',
        raw: 'plain text message',
        id: undefined,
      })
    })

    it('should unsubscribe from events', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage = jest.fn()

      const unsubscribe = client.on('message', onMessage)
      client.connect()

      unsubscribe()

      const event = new MessageEvent('message', { data: 'test' })
      mockEventSource.onmessage(event)

      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should handle multiple subscribers to same event', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage1 = jest.fn()
      const onMessage2 = jest.fn()

      client.on('message', onMessage1)
      client.on('message', onMessage2)
      client.connect()

      const event = new MessageEvent('message', { data: 'test' })
      mockEventSource.onmessage(event)

      expect(onMessage1).toHaveBeenCalled()
      expect(onMessage2).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onError = jest.fn()

      client.onError(onError)
      client.connect()

      mockEventSource.readyState = 2 // CLOSED
      mockEventSource.onerror(new Event('error'))

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should attempt reconnection on error', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream', {
        maxReconnectAttempts: 3,
        reconnectDelay: 1000,
      })

      client.connect()

      // Simulate error
      mockEventSource.readyState = 2 // CLOSED
      mockEventSource.onerror(new Event('error'))

      // Should attempt reconnect
      jest.advanceTimersByTime(1500)

      expect(global.EventSource).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })

    it('should stop reconnecting after max attempts', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream', {
        maxReconnectAttempts: 2,
        reconnectDelay: 1000,
      })
      const onError = jest.fn()
      client.onError(onError)

      client.connect()

      // Simulate errors to exceed max reconnect attempts
      for (let i = 0; i < 3; i++) {
        mockEventSource.readyState = 2
        mockEventSource.onerror(new Event('error'))
        jest.advanceTimersByTime(5000)
      }

      // Should have called EventSource constructor 3 times (initial + 2 reconnects)
      expect(global.EventSource).toHaveBeenCalledTimes(3)

      // Should have received error about max attempts
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Max reconnection attempts'),
        })
      )

      jest.useRealTimers()
    })

    it('should handle message parsing errors gracefully', () => {
      const client = new SSEClient('http://localhost:8080/stream')
      const onMessage = jest.fn(() => {
        throw new Error('Handler error')
      })
      const onError = jest.fn()

      client.on('message', onMessage)
      client.onError(onError)
      client.connect()

      const event = new MessageEvent('message', { data: 'test' })

      // Should not throw
      expect(() => mockEventSource.onmessage(event)).not.toThrow()
    })
  })

  describe('Connection Timeout', () => {
    it('should timeout if connection takes too long', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream', {
        connectionTimeout: 5000,
      })
      const onError = jest.fn()
      client.onError(onError)

      client.connect()

      // Don't trigger open event, let it timeout
      jest.advanceTimersByTime(6000)

      expect(onError).toHaveBeenCalled()
      expect(mockEventSource.close).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should clear timeout when connection opens', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream', {
        connectionTimeout: 5000,
      })

      client.connect()

      // Trigger open event before timeout
      mockEventSource.readyState = 1
      mockEventSource.onopen()

      jest.advanceTimersByTime(6000)

      // Should not have closed
      expect(mockEventSource.close).not.toHaveBeenCalled()

      jest.useRealTimers()
    })
  })

  describe('Factory Function', () => {
    it('should create and connect client', () => {
      const url = 'http://localhost:8080/stream'
      const client = createSSEClient(url)

      expect(global.EventSource).toHaveBeenCalledWith(url, expect.any(Object))
    })

    it('should accept options', () => {
      const url = 'http://localhost:8080/stream'
      const options = {
        maxReconnectAttempts: 10,
        reconnectDelay: 2000,
      }

      const client = createSSEClient(url, options)

      expect(global.EventSource).toHaveBeenCalled()
    })
  })

  describe('Reconnection Backoff', () => {
    it('should use exponential backoff for reconnection', () => {
      jest.useFakeTimers()
      const client = new SSEClient('http://localhost:8080/stream', {
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        maxReconnectDelay: 10000,
      })

      client.connect()

      const delays: number[] = []

      for (let i = 0; i < 3; i++) {
        const timeBefore = Date.now()
        mockEventSource.readyState = 2
        mockEventSource.onerror(new Event('error'))

        // Find the delay used
        const timers = (jest as any).getTimerCount()
        jest.advanceTimersToNextTimer()
        const timeAfter = Date.now()

        delays.push(timeAfter - timeBefore)
      }

      // Each delay should be larger than the previous (exponential backoff)
      expect(delays[1]).toBeGreaterThan(delays[0])
      expect(delays[2]).toBeGreaterThan(delays[1])

      jest.useRealTimers()
    })
  })
})
