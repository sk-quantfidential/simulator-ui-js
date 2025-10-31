/**
 * Service Registry Port - Interface for service discovery
 * Adapters must implement this interface to provide service discovery
 */

import type { ServiceHealth } from '@/domain/types'

export interface ServiceRegistryPort {
  /**
   * Get list of all registered services
   */
  getAllServices(): Promise<ServiceHealth[]>

  /**
   * Get health status of a specific service
   */
  getServiceHealth(serviceName: string): Promise<ServiceHealth>

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceName: string): Promise<boolean>

  /**
   * Get service endpoint URL
   */
  getServiceEndpoint(serviceName: string): Promise<string>
}
