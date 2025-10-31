/**
 * Audit Port - Interface for audit events and logging
 * Adapters must implement this interface to provide audit data
 */

import type { AuditEvent, EventCategory, EventSeverity } from '@/domain/types'

export interface AuditPort {
  /**
   * Get all audit events
   */
  getAllEvents(limit?: number): Promise<AuditEvent[]>

  /**
   * Get events by category
   */
  getEventsByCategory(category: EventCategory, limit?: number): Promise<AuditEvent[]>

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: EventSeverity, limit?: number): Promise<AuditEvent[]>

  /**
   * Get events for a specific service
   */
  getEventsByService(serviceName: string, limit?: number): Promise<AuditEvent[]>

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(startTime: number, endTime: number): Promise<AuditEvent[]>

  /**
   * Subscribe to real-time audit events (SSE)
   */
  subscribeToAuditEvents(
    onEvent: (event: AuditEvent) => void
  ): () => void
}
