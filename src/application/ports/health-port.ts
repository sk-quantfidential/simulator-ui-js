/**
 * Health Port - Interface for service health monitoring
 * Adapters must implement this interface to provide health metrics
 */

import type { ServiceMetrics } from '@/domain/types'

export interface HealthPort {
  /**
   * Get Prometheus metrics for a service
   */
  getServiceMetrics(serviceName: string): Promise<ServiceMetrics>

  /**
   * Get metrics for all services
   */
  getAllServiceMetrics(): Promise<ServiceMetrics[]>

  /**
   * Query Prometheus directly
   */
  queryPrometheus(query: string): Promise<any>

  /**
   * Get RED metrics (Rate, Errors, Duration) for a service
   */
  getREDMetrics(serviceName: string): Promise<{
    requestRate: number
    errorRate: number
    avgDuration: number
  }>
}
