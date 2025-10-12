/**
 * Domain Service - Risk Calculations
 * Pure functions for risk metrics and calculations
 */

import type { Position, RiskLevel, RiskMetrics, AssetRisk, CryptoAsset } from '../types'

/**
 * Calculate Value at Risk (VaR) at 99% confidence level
 * Using historical simulation method
 */
export function calculateVaR99(returns: number[]): number {
  if (returns.length === 0) return 0

  const sortedReturns = [...returns].sort((a, b) => a - b)
  const index = Math.floor(returns.length * 0.01)
  return Math.abs(sortedReturns[index] || 0)
}

/**
 * Calculate Expected Shortfall (CVaR) at 99% confidence level
 */
export function calculateExpectedShortfall(returns: number[]): number {
  if (returns.length === 0) return 0

  const sortedReturns = [...returns].sort((a, b) => a - b)
  const varIndex = Math.floor(returns.length * 0.01)
  const tailReturns = sortedReturns.slice(0, varIndex + 1)

  if (tailReturns.length === 0) return 0

  const sum = tailReturns.reduce((acc, r) => acc + Math.abs(r), 0)
  return sum / tailReturns.length
}

/**
 * Calculate portfolio exposure from positions
 */
export function calculateTotalExposure(positions: Position[]): number {
  return positions.reduce((total, pos) => {
    return total + (pos.quantity * pos.currentPrice)
  }, 0)
}

/**
 * Calculate net exposure (long - short)
 */
export function calculateNetExposure(positions: Position[]): number {
  return positions.reduce((net, pos) => {
    const exposure = pos.quantity * pos.currentPrice
    return pos.side === 'long' ? net + exposure : net - exposure
  }, 0)
}

/**
 * Calculate margin utilization percentage
 */
export function calculateMarginUtilization(
  usedMargin: number,
  availableMargin: number
): number {
  const totalMargin = usedMargin + availableMargin
  if (totalMargin === 0) return 0
  return (usedMargin / totalMargin) * 100
}

/**
 * Calculate portfolio leverage ratio
 */
export function calculateLeverageRatio(
  totalExposure: number,
  equity: number
): number {
  if (equity === 0) return 0
  return totalExposure / equity
}

/**
 * Determine risk level based on metrics
 */
export function determineRiskLevel(
  marginUtilization: number,
  leverageRatio: number,
  var99Percent: number
): RiskLevel {
  // Critical: high margin usage or extreme leverage or high VaR
  if (marginUtilization > 85 || leverageRatio > 20 || var99Percent > 50) {
    return 'critical'
  }

  // High: moderate-high margin usage or high leverage or significant VaR
  if (marginUtilization > 70 || leverageRatio > 10 || var99Percent > 30) {
    return 'high'
  }

  // Medium: moderate levels
  if (marginUtilization > 50 || leverageRatio > 5 || var99Percent > 15) {
    return 'medium'
  }

  // Low: conservative levels
  return 'low'
}

/**
 * Calculate asset volatility from price returns
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
  const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / (returns.length - 1)

  return Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized volatility as percentage
}

/**
 * Calculate beta relative to market (BTC as proxy)
 */
export function calculateBeta(
  assetReturns: number[],
  marketReturns: number[]
): number {
  if (assetReturns.length !== marketReturns.length || assetReturns.length < 2) {
    return 1.0 // Default beta
  }

  const n = assetReturns.length
  const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n

  let covariance = 0
  let marketVariance = 0

  for (let i = 0; i < n; i++) {
    const assetDev = assetReturns[i] - assetMean
    const marketDev = marketReturns[i] - marketMean
    covariance += assetDev * marketDev
    marketVariance += marketDev * marketDev
  }

  covariance /= (n - 1)
  marketVariance /= (n - 1)

  if (marketVariance === 0) return 1.0

  return covariance / marketVariance
}

/**
 * Calculate correlation coefficient between two return series
 */
export function calculateCorrelation(
  returns1: number[],
  returns2: number[]
): number {
  if (returns1.length !== returns2.length || returns1.length < 2) {
    return 0
  }

  const n = returns1.length
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n

  let numerator = 0
  let sumSq1 = 0
  let sumSq2 = 0

  for (let i = 0; i < n; i++) {
    const dev1 = returns1[i] - mean1
    const dev2 = returns2[i] - mean2
    numerator += dev1 * dev2
    sumSq1 += dev1 * dev1
    sumSq2 += dev2 * dev2
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2)
  if (denominator === 0) return 0

  return numerator / denominator
}

/**
 * Calculate log returns from price series
 */
export function calculateLogReturns(prices: number[]): number[] {
  const returns: number[] = []

  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]))
    }
  }

  return returns
}

/**
 * Calculate PnL for a position
 */
export function calculatePositionPnL(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  side: 'long' | 'short'
): number {
  const priceDiff = currentPrice - entryPrice
  const multiplier = side === 'long' ? 1 : -1
  return priceDiff * quantity * multiplier
}

/**
 * Calculate liquidation price for a leveraged position
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: 'long' | 'short',
  maintenanceMarginPercent: number = 0.5
): number {
  const maintenanceMargin = maintenanceMarginPercent / 100
  const leverageFactor = 1 / leverage

  if (side === 'long') {
    return entryPrice * (1 - leverageFactor + maintenanceMargin)
  } else {
    return entryPrice * (1 + leverageFactor - maintenanceMargin)
  }
}

/**
 * Calculate Loan-to-Value ratio for collateral
 */
export function calculateLTV(
  loanValue: number,
  collateralValue: number
): number {
  if (collateralValue === 0) return 0
  return (loanValue / collateralValue) * 100
}

/**
 * Determine collateral status based on LTV and thresholds
 */
export function determineCollateralStatus(
  ltv: number,
  warningThreshold: number = 70,
  criticalThreshold: number = 85,
  liquidationThreshold: number = 90
): 'active' | 'warning' | 'critical' | 'liquidated' {
  if (ltv >= liquidationThreshold) return 'liquidated'
  if (ltv >= criticalThreshold) return 'critical'
  if (ltv >= warningThreshold) return 'warning'
  return 'active'
}

/**
 * Calculate portfolio-level risk metrics
 */
export function calculatePortfolioRiskMetrics(
  positions: Position[],
  returns: number[],
  availableMargin: number
): RiskMetrics {
  const totalExposure = calculateTotalExposure(positions)
  const netExposure = calculateNetExposure(positions)
  const usedMargin = positions.reduce((sum, pos) => sum + pos.marginUsed, 0)

  const var99 = calculateVaR99(returns)
  const expectedShortfall = calculateExpectedShortfall(returns)
  const marginUtilization = calculateMarginUtilization(usedMargin, availableMargin)
  const equity = usedMargin + availableMargin
  const leverageRatio = calculateLeverageRatio(totalExposure, equity)

  const var99Percent = equity > 0 ? (var99 / equity) * 100 : 0
  const riskLevel = determineRiskLevel(marginUtilization, leverageRatio, var99Percent)

  return {
    totalExposure,
    netExposure,
    valueAtRisk99: var99,
    expectedShortfall,
    marginUtilization,
    leverageRatio,
    riskLevel,
    timestamp: Date.now(),
  }
}
