/**
 * Domain Service - Formatters and Utilities
 * Pure functions for data formatting and transformation
 */

import type { CryptoAsset, ServiceStatus, RiskLevel, EventSeverity } from '../types'

/**
 * Format USD currency value
 */
export function formatUSD(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format crypto asset value with appropriate decimal places
 */
export function formatCrypto(asset: CryptoAsset, value: number): string {
  const decimals = asset === 'BTC' ? 8 : asset === 'ETH' ? 6 : 4
  return `${value.toFixed(decimals)} ${asset}`
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  }
  return value.toFixed(2)
}

/**
 * Format timestamp to human-readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format timestamp to human-readable date and time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Get color class for service status
 */
export function getServiceStatusColor(status: ServiceStatus): string {
  const colors: Record<ServiceStatus, string> = {
    up: 'text-success',
    down: 'text-danger',
    degraded: 'text-warning',
    unknown: 'text-text-tertiary',
  }
  return colors[status]
}

/**
 * Get color class for risk level
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-danger',
    critical: 'text-danger',
  }
  return colors[level]
}

/**
 * Get color class for event severity
 */
export function getEventSeverityColor(severity: EventSeverity): string {
  const colors: Record<EventSeverity, string> = {
    info: 'text-primary',
    warning: 'text-warning',
    error: 'text-danger',
    critical: 'text-danger',
  }
  return colors[severity]
}

/**
 * Get badge variant for service status
 */
export function getServiceStatusBadge(status: ServiceStatus): {
  color: string
  label: string
} {
  const badges: Record<
    ServiceStatus,
    { color: string; label: string }
  > = {
    up: { color: 'bg-success/20 text-success border-success', label: 'UP' },
    down: { color: 'bg-danger/20 text-danger border-danger', label: 'DOWN' },
    degraded: { color: 'bg-warning/20 text-warning border-warning', label: 'DEGRADED' },
    unknown: { color: 'bg-text-tertiary/20 text-text-tertiary border-text-tertiary', label: 'UNKNOWN' },
  }
  return badges[status]
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Generate a deterministic color from a string (for charts)
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Check if a timestamp is within the last N seconds
 */
export function isRecent(timestamp: number, seconds: number): boolean {
  return Date.now() - timestamp < seconds * 1000
}

/**
 * Parse service name from instance identifier
 */
export function parseServiceName(instance: string): string {
  // e.g., "trading-system-engine-1" -> "trading-system-engine"
  return instance.replace(/-\d+$/, '')
}

/**
 * Get asset display name
 */
export function getAssetDisplayName(asset: CryptoAsset): string {
  const names: Record<CryptoAsset, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
  }
  return names[asset]
}

/**
 * Sort array by timestamp descending (newest first)
 */
export function sortByTimestampDesc<T extends { timestamp: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Group items by date
 */
export function groupByDate<T extends { timestamp: number }>(
  items: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}

  for (const item of items) {
    const date = formatDate(item.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  }

  return groups
}
