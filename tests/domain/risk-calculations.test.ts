/**
 * Domain Tests - Risk Calculations
 * BDD-style tests for pure risk calculation functions
 */

import {
  calculateVaR99,
  calculateExpectedShortfall,
  calculateTotalExposure,
  calculateNetExposure,
  calculateMarginUtilization,
  calculateLeverageRatio,
  determineRiskLevel,
  calculateVolatility,
  calculateCorrelation,
  calculateLogReturns,
  calculateLTV,
  determineCollateralStatus,
} from '@/domain/services/risk-calculations'
import type { Position } from '@/domain/types'

describe('Risk Calculations', () => {
  describe('calculateVaR99', () => {
    it('should calculate VaR at 99% confidence level', () => {
      const returns = [-0.05, -0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04, 0.05]
      const var99 = calculateVaR99(returns)

      expect(var99).toBeGreaterThan(0)
      expect(var99).toBeLessThanOrEqual(0.05)
    })

    it('should return 0 for empty returns', () => {
      expect(calculateVaR99([])).toBe(0)
    })
  })

  describe('calculateExpectedShortfall', () => {
    it('should calculate expected shortfall (CVaR)', () => {
      const returns = [-0.10, -0.08, -0.05, -0.02, 0, 0.02, 0.05, 0.08, 0.10]
      const es = calculateExpectedShortfall(returns)

      expect(es).toBeGreaterThan(0)
    })

    it('should return 0 for empty returns', () => {
      expect(calculateExpectedShortfall([])).toBe(0)
    })
  })

  describe('calculateTotalExposure', () => {
    it('should sum all position exposures', () => {
      const positions: Position[] = [
        {
          id: '1',
          asset: 'BTC',
          side: 'long',
          quantity: 1,
          entryPrice: 50000,
          currentPrice: 51000,
          unrealizedPnL: 1000,
          realizedPnL: 0,
          marginUsed: 5000,
          liquidationPrice: 45000,
          timestamp: Date.now(),
        },
        {
          id: '2',
          asset: 'ETH',
          side: 'long',
          quantity: 10,
          entryPrice: 3000,
          currentPrice: 3100,
          unrealizedPnL: 1000,
          realizedPnL: 0,
          marginUsed: 3000,
          liquidationPrice: 2700,
          timestamp: Date.now(),
        },
      ]

      const exposure = calculateTotalExposure(positions)

      expect(exposure).toBe(51000 + 31000) // 82000
    })

    it('should return 0 for no positions', () => {
      expect(calculateTotalExposure([])).toBe(0)
    })
  })

  describe('calculateNetExposure', () => {
    it('should calculate net exposure (long - short)', () => {
      const positions: Position[] = [
        {
          id: '1',
          asset: 'BTC',
          side: 'long',
          quantity: 1,
          entryPrice: 50000,
          currentPrice: 50000,
          unrealizedPnL: 0,
          realizedPnL: 0,
          marginUsed: 5000,
          liquidationPrice: 45000,
          timestamp: Date.now(),
        },
        {
          id: '2',
          asset: 'BTC',
          side: 'short',
          quantity: 0.5,
          entryPrice: 50000,
          currentPrice: 50000,
          unrealizedPnL: 0,
          realizedPnL: 0,
          marginUsed: 2500,
          liquidationPrice: 55000,
          timestamp: Date.now(),
        },
      ]

      const netExposure = calculateNetExposure(positions)

      expect(netExposure).toBe(25000) // 50000 long - 25000 short
    })
  })

  describe('calculateMarginUtilization', () => {
    it('should calculate margin utilization percentage', () => {
      const utilization = calculateMarginUtilization(70000, 30000)
      expect(utilization).toBe(70)
    })

    it('should return 0 when total margin is 0', () => {
      expect(calculateMarginUtilization(0, 0)).toBe(0)
    })
  })

  describe('calculateLeverageRatio', () => {
    it('should calculate leverage ratio', () => {
      const leverage = calculateLeverageRatio(100000, 10000)
      expect(leverage).toBe(10)
    })

    it('should return 0 when equity is 0', () => {
      expect(calculateLeverageRatio(100000, 0)).toBe(0)
    })
  })

  describe('determineRiskLevel', () => {
    it('should return critical for high risk metrics', () => {
      const level = determineRiskLevel(90, 25, 55)
      expect(level).toBe('critical')
    })

    it('should return high for elevated risk metrics', () => {
      const level = determineRiskLevel(75, 12, 35)
      expect(level).toBe('high')
    })

    it('should return medium for moderate risk metrics', () => {
      const level = determineRiskLevel(60, 7, 20)
      expect(level).toBe('medium')
    })

    it('should return low for conservative risk metrics', () => {
      const level = determineRiskLevel(30, 3, 10)
      expect(level).toBe('low')
    })
  })

  describe('calculateVolatility', () => {
    it('should calculate annualized volatility', () => {
      const returns = [0.01, -0.02, 0.015, -0.01, 0.02, -0.015]
      const volatility = calculateVolatility(returns)

      expect(volatility).toBeGreaterThan(0)
    })

    it('should return 0 for less than 2 returns', () => {
      expect(calculateVolatility([0.01])).toBe(0)
      expect(calculateVolatility([])).toBe(0)
    })
  })

  describe('calculateCorrelation', () => {
    it('should calculate correlation between two return series', () => {
      const returns1 = [0.01, 0.02, -0.01, 0.015, -0.02]
      const returns2 = [0.015, 0.025, -0.015, 0.02, -0.025]

      const correlation = calculateCorrelation(returns1, returns2)

      expect(correlation).toBeGreaterThanOrEqual(-1)
      expect(correlation).toBeLessThanOrEqual(1)
    })

    it('should return 0 for mismatched series', () => {
      const returns1 = [0.01, 0.02]
      const returns2 = [0.01]

      expect(calculateCorrelation(returns1, returns2)).toBe(0)
    })
  })

  describe('calculateLogReturns', () => {
    it('should calculate log returns from price series', () => {
      const prices = [100, 105, 103, 108, 110]
      const returns = calculateLogReturns(prices)

      expect(returns.length).toBe(4)
      expect(returns[0]).toBeCloseTo(Math.log(105 / 100), 10)
    })

    it('should handle empty price series', () => {
      expect(calculateLogReturns([])).toEqual([])
      expect(calculateLogReturns([100])).toEqual([])
    })
  })

  describe('calculateLTV', () => {
    it('should calculate loan-to-value ratio', () => {
      const ltv = calculateLTV(70000, 100000)
      expect(ltv).toBe(70)
    })

    it('should return 0 when collateral is 0', () => {
      expect(calculateLTV(70000, 0)).toBe(0)
    })
  })

  describe('determineCollateralStatus', () => {
    it('should return active for safe LTV', () => {
      expect(determineCollateralStatus(50)).toBe('active')
    })

    it('should return warning for elevated LTV', () => {
      expect(determineCollateralStatus(75)).toBe('warning')
    })

    it('should return critical for high LTV', () => {
      expect(determineCollateralStatus(88)).toBe('critical')
    })

    it('should return liquidated for LTV at or above threshold', () => {
      expect(determineCollateralStatus(90)).toBe('liquidated')
      expect(determineCollateralStatus(95)).toBe('liquidated')
    })
  })
})
