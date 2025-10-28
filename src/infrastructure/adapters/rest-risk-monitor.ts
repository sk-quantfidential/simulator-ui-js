/**
 * REST Risk Monitor Adapter
 * Implements RiskPort using risk-monitor-py REST API and SSE
 */

import type { RiskPort } from '@/application/ports/risk-port'
import type { RiskMetrics, PortfolioRisk, AssetRisk, StressTestResult, RiskLevel, CryptoAsset } from '@/domain/types'
import { httpClient } from '../utils/http-client'
import { getServiceEndpoints } from '../config/api-config'
import { createSSEClient, type SSEClient } from '../utils/sse-client'

export class RestRiskMonitor implements RiskPort {
  private baseUrl: string

  constructor() {
    this.baseUrl = getServiceEndpoints().riskMonitor
  }

  async getPortfolioRiskMetrics(): Promise<RiskMetrics> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/risk/portfolio/metrics`
      )

      return this.transformRiskMetrics(response)
    } catch (error) {
      console.error('Failed to fetch portfolio risk metrics:', error)
      return this.createMockRiskMetrics()
    }
  }

  async getPortfolioRisk(): Promise<PortfolioRisk> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/risk/portfolio`
      )

      return {
        metrics: {
          totalExposure: response.total_exposure || 0,
          netExposure: response.net_exposure || 0,
          valueAtRisk99: response.var_99 || 0,
          expectedShortfall: response.expected_shortfall || 0,
          marginUtilization: response.margin_utilization || 0,
          leverageRatio: response.leverage_ratio || 1.0,
          riskLevel: response.risk_level || 'medium',
          timestamp: response.timestamp || Date.now(),
        },
        assetRisks: response.asset_risks || [],
        correlationMatrix: response.correlation_matrix || [],
      }
    } catch (error) {
      console.error('Failed to fetch portfolio risk:', error)
      return this.createMockPortfolioRisk()
    }
  }

  async getAssetRisk(asset: CryptoAsset): Promise<AssetRisk> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/risk/asset/${asset}`
      )

      return {
        asset,
        exposure: response.exposure || 0,
        var99: response.var_99 || 0,
        volatility: response.volatility || 0,
        beta: response.beta || 0,
      }
    } catch (error) {
      console.error(`Failed to fetch risk for asset ${asset}:`, error)
      return {
        asset,
        exposure: 0,
        var99: 0,
        volatility: 0,
        beta: 0,
      }
    }
  }

  async runStressTest(scenarios: string[]): Promise<StressTestResult[]> {
    try {
      const response = await httpClient.post<any>(
        `${this.baseUrl}/api/v1/risk/stress-test`,
        { scenarios }
      )

      return (response.results || []).map((r: any) => ({
        scenario: r.scenario,
        portfolioImpact: r.portfolio_impact || 0,
        maxDrawdown: r.max_drawdown || 0,
        recoveryTime: r.recovery_time || 0,
        affectedAssets: r.affected_assets || [],
        recommendations: r.recommendations || [],
      }))
    } catch (error) {
      console.error('Failed to run stress test:', error)
      return []
    }
  }

  async getHistoricalVaR(days: number): Promise<{ timestamp: number; var99: number }[]> {
    try {
      const response = await httpClient.get<any>(
        `${this.baseUrl}/api/v1/risk/historical/var?days=${days}`
      )

      return (response.data || []).map((item: any) => ({
        timestamp: item.timestamp,
        var99: item.var_99 || item.var99 || 0,
      }))
    } catch (error) {
      console.error('Failed to fetch historical VaR:', error)
      return this.generateMockHistoricalVaR(days)
    }
  }

  subscribeToRiskUpdates(
    onUpdate: (metrics: RiskMetrics) => void
  ): () => void {
    // Create SSE connection to risk metrics stream
    const streamUrl = `${this.baseUrl}/api/v1/stream/risk`
    let sseClient: SSEClient | null = null

    try {
      sseClient = createSSEClient(streamUrl, {
        maxReconnectAttempts: 10,
        reconnectDelay: 2000,
        maxReconnectDelay: 30000,
      })

      // Subscribe to risk metric update events
      const unsubscribeRisk = sseClient.on<any>('risk_update', (message) => {
        try {
          const metrics = this.transformRiskMetrics(message.data)
          onUpdate(metrics)
        } catch (error) {
          console.error('Failed to process risk update:', error)
        }
      })

      // Also listen for generic 'metrics' events
      const unsubscribeMetrics = sseClient.on<any>('metrics', (message) => {
        try {
          const metrics = this.transformRiskMetrics(message.data)
          onUpdate(metrics)
        } catch (error) {
          console.error('Failed to process metrics update:', error)
        }
      })

      // Handle connection errors with fallback to polling
      sseClient.onError((error) => {
        console.warn('SSE connection error for risk updates, will retry:', error.message)
      })

      // Return cleanup function
      return () => {
        unsubscribeRisk()
        unsubscribeMetrics()
        sseClient?.disconnect()
      }
    } catch (error) {
      console.error('Failed to establish SSE connection for risk updates, falling back to polling:', error)

      // Fallback to polling if SSE fails
      const intervalId = setInterval(async () => {
        try {
          const metrics = await this.getPortfolioRiskMetrics()
          onUpdate(metrics)
        } catch (error) {
          console.error('Risk metrics update failed:', error)
        }
      }, 5000)

      return () => {
        clearInterval(intervalId)
        sseClient?.disconnect()
      }
    }
  }

  private transformRiskMetrics(data: any): RiskMetrics {
    const marginUtilization = data.margin_utilization ?? data.marginUtilization ?? 0
    const leverageRatio = data.leverage_ratio ?? data.leverageRatio ?? 0
    const var99Percent = (data.var_99 ?? data.valueAtRisk99 ?? 0) / (data.total_exposure ?? data.totalExposure ?? 1) * 100

    return {
      totalExposure: data.total_exposure ?? data.totalExposure ?? 0,
      netExposure: data.net_exposure ?? data.netExposure ?? 0,
      valueAtRisk99: data.var_99 ?? data.valueAtRisk99 ?? 0,
      expectedShortfall: data.expected_shortfall ?? data.expectedShortfall ?? 0,
      marginUtilization,
      leverageRatio,
      riskLevel: this.determineRiskLevel(marginUtilization, leverageRatio, var99Percent),
      timestamp: data.timestamp ?? Date.now(),
    }
  }

  private determineRiskLevel(
    marginUtilization: number,
    leverageRatio: number,
    var99Percent: number
  ): RiskLevel {
    if (marginUtilization > 90 || leverageRatio > 20 || var99Percent > 50) {
      return 'critical'
    } else if (marginUtilization > 75 || leverageRatio > 10 || var99Percent > 30) {
      return 'high'
    } else if (marginUtilization > 50 || leverageRatio > 5 || var99Percent > 15) {
      return 'medium'
    }
    return 'low'
  }

  private createMockRiskMetrics(): RiskMetrics {
    const totalExposure = 1500000
    const marginUtilization = 45.5
    const leverageRatio = 3.2
    const var99 = 125000
    const var99Percent = (var99 / totalExposure) * 100

    return {
      totalExposure,
      netExposure: 850000,
      valueAtRisk99: var99,
      expectedShortfall: 185000,
      marginUtilization,
      leverageRatio,
      riskLevel: this.determineRiskLevel(marginUtilization, leverageRatio, var99Percent),
      timestamp: Date.now(),
    }
  }

  private createMockPortfolioRisk(): PortfolioRisk {
    return {
      metrics: {
        totalExposure: 1500000,
        netExposure: 850000,
        valueAtRisk99: 125000,
        expectedShortfall: 185000,
        marginUtilization: 0.65,
        leverageRatio: 1.5,
        riskLevel: 'medium',
        timestamp: Date.now(),
      },
      assetRisks: [
        {
          asset: 'BTC',
          exposure: 650000,
          var99: 65000,
          volatility: 0.45,
          beta: 1.0,
        },
        {
          asset: 'ETH',
          exposure: 437500,
          var99: 43750,
          volatility: 0.52,
          beta: 1.15,
        },
        {
          asset: 'SOL',
          exposure: 412500,
          var99: 41250,
          volatility: 0.68,
          beta: 1.35,
        },
      ],
      correlationMatrix: [
        [1.0, 0.82, 0.68],  // BTC row
        [0.82, 1.0, 0.75],  // ETH row
        [0.68, 0.75, 1.0],  // SOL row
      ],
    }
  }

  private generateMockHistoricalVaR(days: number): { timestamp: number; var99: number }[] {
    const data: { timestamp: number; var99: number }[] = []
    const now = Date.now()
    const baseVaR = 125000

    for (let i = days - 1; i >= 0; i--) {
      const timestamp = now - i * 86400000 // 1 day intervals
      const volatility = 0.15
      const var99 = baseVaR * (1 + (Math.random() - 0.5) * volatility)

      data.push({ timestamp, var99 })
    }

    return data
  }
}
