/**
 * REST Service Registry Adapter
 * Implements ServiceRegistryPort using REST API
 */

import type { ServiceRegistryPort } from '@/application/ports/service-registry-port'
import type { ServiceHealth, ServiceStatus } from '@/domain/types'
import { httpClient } from '../utils/http-client'
import { getServiceEndpoints } from '../config/api-config'

export class RestServiceRegistry implements ServiceRegistryPort {
  private baseUrl: string

  constructor() {
    this.baseUrl = getServiceEndpoints().serviceRegistry
  }

  async getAllServices(): Promise<ServiceHealth[]> {
    try {
      const response = await httpClient.get<{ services: any[] }>(
        `${this.baseUrl}/health`
      )

      // Mock transformation - adapt based on actual API response
      return response.services?.map(this.transformService) || []
    } catch (error) {
      console.error('Failed to fetch services:', error)
      return []
    }
  }

  async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/health/${serviceName}`
      )

      return this.transformService(response)
    } catch (error) {
      console.error(`Failed to fetch service health for ${serviceName}:`, error)
      return this.createUnknownService(serviceName)
    }
  }

  async isServiceAvailable(serviceName: string): Promise<boolean> {
    try {
      const health = await this.getServiceHealth(serviceName)
      return health.status === 'up'
    } catch {
      return false
    }
  }

  async getServiceEndpoint(serviceName: string): Promise<string> {
    const endpoints = getServiceEndpoints()
    const key = this.normalizeServiceName(serviceName)
    return (endpoints as any)[key] || ''
  }

  private transformService(data: any): ServiceHealth {
    return {
      name: data.service || data.name || 'unknown',
      status: this.parseStatus(data.status),
      instance: data.instance || data.service_instance_name || data.name || 'default',
      lastHeartbeat: data.timestamp || data.last_heartbeat || new Date().toISOString(),
      uptime: data.uptime_seconds || data.uptime || 0,
      version: data.version || data.service_version,
      metadata: data.metadata || {},
    }
  }

  private parseStatus(status: string): ServiceStatus {
    const normalized = status?.toLowerCase()
    if (normalized === 'up' || normalized === 'healthy') return 'up'
    if (normalized === 'down' || normalized === 'unhealthy') return 'down'
    if (normalized === 'degraded') return 'degraded'
    return 'unknown'
  }

  private createUnknownService(serviceName: string): ServiceHealth {
    return {
      name: serviceName,
      status: 'unknown',
      instance: serviceName,
      lastHeartbeat: new Date().toISOString(),
      uptime: 0,
    }
  }

  private normalizeServiceName(name: string): string {
    // Convert kebab-case to camelCase for endpoint lookup
    return name
      .split('-')
      .map((part, index) =>
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join('')
  }
}
