'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/presentation/components/metric-card'
import type { RiskMetrics } from '@/domain/types'
import { formatUSD } from '@/domain/services/formatters'
import { RestRiskMonitor } from '@/infrastructure/adapters/rest-risk-monitor'

export default function RiskPage() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const riskMonitor = new RestRiskMonitor()

    // Initial data fetch
    const fetchInitialRiskMetrics = async () => {
      try {
        const metrics = await riskMonitor.getPortfolioRiskMetrics()
        setRiskMetrics(metrics)
      } catch (error) {
        console.error('Failed to fetch risk metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialRiskMetrics()

    // Subscribe to real-time risk metrics updates via SSE
    const unsubscribeRisk = riskMonitor.subscribeToRiskUpdates((updatedMetrics) => {
      setRiskMetrics(updatedMetrics)
    })

    return () => {
      unsubscribeRisk()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading risk metrics...</p>
        </div>
      </div>
    )
  }

  if (!riskMetrics) {
    return (
      <div className="card text-center py-12">
        <p className="text-text-secondary">Unable to load risk metrics</p>
      </div>
    )
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'danger'
      case 'critical': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Risk Monitor
        </h1>
        <p className="text-text-secondary">
          Real-time portfolio risk metrics and exposure analysis
        </p>
      </div>

      {/* Risk Level Alert */}
      <div className={`card border-2 ${
        riskMetrics.riskLevel === 'critical' ? 'border-danger bg-danger/5' :
        riskMetrics.riskLevel === 'high' ? 'border-warning bg-warning/5' :
        riskMetrics.riskLevel === 'medium' ? 'border-warning bg-warning/5' :
        'border-success bg-success/5'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Portfolio Risk Level: <span className={`text-${getRiskLevelColor(riskMetrics.riskLevel)}`}>
                {riskMetrics.riskLevel.toUpperCase()}
              </span>
            </h2>
            <p className="text-text-secondary">
              Last updated: {new Date(riskMetrics.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-full bg-${getRiskLevelColor(riskMetrics.riskLevel)} opacity-20`} />
        </div>
      </div>

      {/* Key Risk Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Exposure"
            value={formatUSD(riskMetrics.totalExposure)}
            subtitle="Gross Position Value"
            color="default"
          />
          <MetricCard
            title="Net Exposure"
            value={formatUSD(riskMetrics.netExposure)}
            subtitle="Long - Short"
            color="default"
          />
          <MetricCard
            title="VaR (99%)"
            value={formatUSD(riskMetrics.valueAtRisk99)}
            subtitle="1-Day Value at Risk"
            color="warning"
          />
          <MetricCard
            title="Expected Shortfall"
            value={formatUSD(riskMetrics.expectedShortfall)}
            subtitle="CVaR (99%)"
            color="danger"
          />
        </div>
      </div>

      {/* Margin & Leverage */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Margin & Leverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Margin Utilization</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary">Used</span>
                  <span className="font-bold">{riskMetrics.marginUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-surface-hover rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskMetrics.marginUtilization > 85 ? 'bg-danger' :
                      riskMetrics.marginUtilization > 70 ? 'bg-warning' :
                      'bg-success'
                    }`}
                    style={{ width: `${Math.min(riskMetrics.marginUtilization, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-full h-2 bg-success rounded mb-1" />
                  <span className="text-text-tertiary">0-70%</span>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-warning rounded mb-1" />
                  <span className="text-text-tertiary">70-85%</span>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-danger rounded mb-1" />
                  <span className="text-text-tertiary">85-100%</span>
                </div>
              </div>
            </div>
          </div>

          <MetricCard
            title="Leverage Ratio"
            value={`${riskMetrics.leverageRatio.toFixed(1)}x`}
            subtitle="Total Exposure / Equity"
            color={riskMetrics.leverageRatio > 10 ? 'danger' : riskMetrics.leverageRatio > 5 ? 'warning' : 'success'}
          />
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Risk Breakdown by Asset</h2>
        <div className="space-y-4">
          <div className="text-center py-8 text-text-secondary">
            <p>Asset-level risk metrics coming soon</p>
            <p className="text-sm text-text-tertiary mt-2">
              Will show VaR, volatility, and beta for BTC, ETH, SOL
            </p>
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Asset Correlation Matrix</h2>
        <div className="text-center py-8 text-text-secondary">
          <p>Correlation heatmap coming soon</p>
          <p className="text-sm text-text-tertiary mt-2">
            BTC-ETH, BTC-SOL, ETH-SOL correlations
          </p>
        </div>
      </div>

      {/* Stress Test Results */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Stress Test Scenarios</h2>
        <div className="text-center py-8 text-text-secondary">
          <p>Stress test results coming soon</p>
          <p className="text-sm text-text-tertiary mt-2">
            Flash crash, volatility spike, liquidity crisis scenarios
          </p>
        </div>
      </div>
    </div>
  )
}
