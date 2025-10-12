import type { ServiceStatus } from '@/domain/types'
import { getServiceStatusBadge } from '@/domain/services/formatters'

interface ServiceHealthIndicatorProps {
  name: string
  status: ServiceStatus
  instance?: string
  uptime?: number
  version?: string
  showDetails?: boolean
}

export function ServiceHealthIndicator({
  name,
  status,
  instance,
  uptime,
  version,
  showDetails = false,
}: ServiceHealthIndicatorProps) {
  const badge = getServiceStatusBadge(status)

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-text">{name}</h3>
          <span className={badge.color}>
            {badge.label}
          </span>
          {version && (
            <span className="text-xs text-text-tertiary">v{version}</span>
          )}
        </div>
        {showDetails && instance && (
          <p className="text-sm text-text-secondary mt-1">
            Instance: {instance}
          </p>
        )}
        {showDetails && uptime !== undefined && (
          <p className="text-xs text-text-tertiary mt-1">
            Uptime: {formatUptime(uptime)}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status === 'up'
              ? 'bg-success animate-pulse-slow'
              : status === 'degraded'
              ? 'bg-warning animate-pulse-slow'
              : 'bg-danger'
          }`}
        />
      </div>
    </div>
  )
}
