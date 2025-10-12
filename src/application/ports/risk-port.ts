/**
 * Risk Port - Interface for risk monitoring and metrics
 * Adapters must implement this interface to provide risk data
 */

import type { RiskMetrics, PortfolioRisk, AssetRisk, StressTestResult } from '@/domain/types'

export interface RiskPort {
  /**
   * Get current portfolio risk metrics
   */
  getPortfolioRiskMetrics(): Promise<RiskMetrics>

  /**
   * Get detailed portfolio risk breakdown
   */
  getPortfolioRisk(): Promise<PortfolioRisk>

  /**
   * Get risk metrics for a specific asset
   */
  getAssetRisk(asset: string): Promise<AssetRisk>

  /**
   * Run stress test scenarios
   */
  runStressTest(scenarios: string[]): Promise<StressTestResult[]>

  /**
   * Get historical VaR data
   */
  getHistoricalVaR(days: number): Promise<{ timestamp: number; var99: number }[]>

  /**
   * Subscribe to risk metric updates (SSE)
   */
  subscribeToRiskUpdates(
    onUpdate: (metrics: RiskMetrics) => void
  ): () => void
}
