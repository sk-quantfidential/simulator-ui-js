/**
 * HTTP Client Utility - Wrapper around fetch with retry and error handling
 */

import { API_TIMEOUTS, RETRY_CONFIG } from '../config/api-config'
import { ServiceUnavailableError } from '@/domain/types'

export interface HttpClientOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

export class HttpClient {
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async retry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries === 0) throw error

      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.retry(fn, retries - 1, delay * RETRY_CONFIG.backoffMultiplier)
    }
  }

  async get<T>(
    url: string,
    options: HttpClientOptions = {}
  ): Promise<T> {
    const {
      timeout = API_TIMEOUTS.default,
      retries = RETRY_CONFIG.maxRetries,
      headers = {},
    } = options

    return this.retry(
      async () => {
        try {
          const response = await this.fetchWithTimeout(
            url,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
            },
            timeout
          )

          if (!response.ok) {
            if (response.status === 503) {
              throw new ServiceUnavailableError(new URL(url).hostname)
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return await response.json()
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`)
          }
          throw error
        }
      },
      retries,
      RETRY_CONFIG.retryDelay
    )
  }

  async post<T>(
    url: string,
    body: any,
    options: HttpClientOptions = {}
  ): Promise<T> {
    const {
      timeout = API_TIMEOUTS.default,
      retries = RETRY_CONFIG.maxRetries,
      headers = {},
    } = options

    return this.retry(
      async () => {
        try {
          const response = await this.fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: JSON.stringify(body),
            },
            timeout
          )

          if (!response.ok) {
            if (response.status === 503) {
              throw new ServiceUnavailableError(new URL(url).hostname)
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return await response.json()
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`)
          }
          throw error
        }
      },
      retries,
      RETRY_CONFIG.retryDelay
    )
  }

  async delete(
    url: string,
    options: HttpClientOptions = {}
  ): Promise<void> {
    const {
      timeout = API_TIMEOUTS.default,
      retries = RETRY_CONFIG.maxRetries,
      headers = {},
    } = options

    return this.retry(
      async () => {
        try {
          const response = await this.fetchWithTimeout(
            url,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
            },
            timeout
          )

          if (!response.ok) {
            if (response.status === 503) {
              throw new ServiceUnavailableError(new URL(url).hostname)
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`)
          }
          throw error
        }
      },
      retries,
      RETRY_CONFIG.retryDelay
    )
  }
}

export const httpClient = new HttpClient()
