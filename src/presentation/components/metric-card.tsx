import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon?: ReactNode
  color?: 'default' | 'success' | 'warning' | 'danger'
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  color = 'default',
  subtitle,
}: MetricCardProps) {
  const colorClasses = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }

  const changeColor = change !== undefined
    ? change >= 0
      ? 'text-success'
      : 'text-danger'
    : ''

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-text-tertiary text-xs">{subtitle}</p>
          )}
          {change !== undefined && (
            <p className={`text-sm font-medium ${changeColor} mt-2`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`${colorClasses[color]} opacity-20`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
