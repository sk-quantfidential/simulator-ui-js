/**
 * SSE (Server-Sent Events) Client Utility
 *
 * Provides a robust client for consuming Server-Sent Events from backend services
 * with automatic reconnection, error handling, and type-safe event parsing.
 */

export interface SSEClientOptions {
  /**
   * Maximum number of reconnection attempts before giving up
   * @default 5
   */
  maxReconnectAttempts?: number

  /**
   * Initial delay between reconnection attempts in milliseconds
   * @default 1000
   */
  reconnectDelay?: number

  /**
   * Maximum delay between reconnection attempts in milliseconds (with exponential backoff)
   * @default 30000
   */
  maxReconnectDelay?: number

  /**
   * Timeout for establishing connection in milliseconds
   * @default 30000
   */
  connectionTimeout?: number

  /**
   * Custom headers to include in the request
   */
  headers?: Record<string, string>

  /**
   * Credentials mode for the request
   * @default 'same-origin'
   */
  withCredentials?: RequestCredentials
}

export interface SSEMessage<T = unknown> {
  /**
   * Event type (from 'event:' field in SSE)
   */
  event: string

  /**
   * Parsed data payload
   */
  data: T

  /**
   * Event ID (from 'id:' field in SSE)
   */
  id?: string

  /**
   * Raw event data as string
   */
  raw: string
}

export type SSEMessageHandler<T = unknown> = (message: SSEMessage<T>) => void
export type SSEErrorHandler = (error: Error) => void
export type SSEConnectionHandler = () => void

/**
 * SSE Client for consuming server-sent events
 */
export class SSEClient {
  private eventSource: EventSource | null = null
  private url: string
  private options: Required<SSEClientOptions>
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private isManuallyDisconnected = false
  private messageHandlers = new Map<string, Set<SSEMessageHandler>>()
  private errorHandlers = new Set<SSEErrorHandler>()
  private openHandlers = new Set<SSEConnectionHandler>()
  private closeHandlers = new Set<SSEConnectionHandler>()

  constructor(url: string, options: SSEClientOptions = {}) {
    this.url = url
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      reconnectDelay: options.reconnectDelay ?? 1000,
      maxReconnectDelay: options.maxReconnectDelay ?? 30000,
      connectionTimeout: options.connectionTimeout ?? 30000,
      headers: options.headers ?? {},
      withCredentials: options.withCredentials ?? 'same-origin',
    }
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      console.warn('[SSEClient] Already connected')
      return
    }

    this.isManuallyDisconnected = false
    this.createEventSource()
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    this.isManuallyDisconnected = true
    this.cleanup()
  }

  /**
   * Subscribe to messages of a specific event type
   */
  on<T = unknown>(event: string, handler: SSEMessageHandler<T>): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set())
    }

    this.messageHandlers.get(event)!.add(handler as SSEMessageHandler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(event)
      if (handlers) {
        handlers.delete(handler as SSEMessageHandler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(event)
        }
      }
    }
  }

  /**
   * Subscribe to error events
   */
  onError(handler: SSEErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  /**
   * Subscribe to connection open events
   */
  onOpen(handler: SSEConnectionHandler): () => void {
    this.openHandlers.add(handler)
    return () => this.openHandlers.delete(handler)
  }

  /**
   * Subscribe to connection close events
   */
  onClose(handler: SSEConnectionHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }

  /**
   * Get current connection state
   */
  getReadyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED
  }

  private createEventSource(): void {
    try {
      // Note: EventSource API doesn't support custom headers directly
      // For authenticated endpoints, use query parameters or cookies instead
      const urlWithParams = this.addAuthToUrl(this.url)

      this.eventSource = new EventSource(urlWithParams, {
        withCredentials: this.options.withCredentials === 'include',
      })

      this.setupEventHandlers()
      this.setupConnectionTimeout()
    } catch (error) {
      this.handleError(new Error(`Failed to create EventSource: ${error}`))
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers(): void {
    if (!this.eventSource) return

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0
      this.clearReconnectTimer()
      this.openHandlers.forEach(handler => handler())
    }

    this.eventSource.onerror = (event) => {
      const error = new Error('SSE connection error')
      this.handleError(error)

      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.cleanup()
        if (!this.isManuallyDisconnected) {
          this.scheduleReconnect()
        }
      }
    }

    // Default message handler (for events without explicit type)
    this.eventSource.onmessage = (event) => {
      this.handleMessage('message', event)
    }

    // Set up handlers for all registered event types
    this.messageHandlers.forEach((_, eventType) => {
      if (this.eventSource && eventType !== 'message') {
        this.eventSource.addEventListener(eventType, (event) => {
          this.handleMessage(eventType, event as MessageEvent)
        })
      }
    })
  }

  private setupConnectionTimeout(): void {
    const timeout = setTimeout(() => {
      if (this.eventSource?.readyState === EventSource.CONNECTING) {
        const error = new Error('SSE connection timeout')
        this.handleError(error)
        this.cleanup()
        this.scheduleReconnect()
      }
    }, this.options.connectionTimeout)

    // Clear timeout when connection opens
    const clearTimeoutHandler = () => {
      clearTimeout(timeout)
      this.eventSource?.removeEventListener('open', clearTimeoutHandler)
    }
    this.eventSource?.addEventListener('open', clearTimeoutHandler)
  }

  private handleMessage(eventType: string, event: MessageEvent): void {
    try {
      const data = this.parseEventData(event.data)

      const message: SSEMessage = {
        event: eventType,
        data,
        id: (event as any).lastEventId,
        raw: event.data,
      }

      const handlers = this.messageHandlers.get(eventType)
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            console.error(`[SSEClient] Error in message handler for event '${eventType}':`, error)
          }
        })
      }
    } catch (error) {
      this.handleError(new Error(`Failed to parse SSE message: ${error}`))
    }
  }

  private parseEventData(data: string): unknown {
    try {
      return JSON.parse(data)
    } catch {
      // If not JSON, return raw string
      return data
    }
  }

  private handleError(error: Error): void {
    console.error('[SSEClient] Error:', error)
    this.errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('[SSEClient] Error in error handler:', handlerError)
      }
    })
  }

  private scheduleReconnect(): void {
    if (this.isManuallyDisconnected) return
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      const error = new Error(`Max reconnection attempts (${this.options.maxReconnectAttempts}) reached`)
      this.handleError(error)
      return
    }

    this.reconnectAttempts++

    // Exponential backoff with jitter
    const baseDelay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    const jitter = Math.random() * 1000
    const delay = Math.min(baseDelay + jitter, this.options.maxReconnectDelay)

    console.log(`[SSEClient] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.createEventSource()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.closeHandlers.forEach(handler => handler())
    }
    this.clearReconnectTimer()
  }

  private addAuthToUrl(url: string): string {
    // In a real implementation, you might add auth tokens as query parameters
    // since EventSource doesn't support custom headers
    // For now, return the URL as-is
    return url
  }
}

/**
 * Create and connect an SSE client in one call
 */
export function createSSEClient(url: string, options?: SSEClientOptions): SSEClient {
  const client = new SSEClient(url, options)
  client.connect()
  return client
}
