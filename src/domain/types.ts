/**
 * Domain Types - Pure business entities and value objects
 * No framework dependencies, no I/O operations
 */

// ============================================================================
// Service Health & Discovery Types
// ============================================================================

export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown'

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  instance: string
  lastHeartbeat: string
  uptime: number
  version?: string
  metadata?: Record<string, string>
}

export interface ServiceMetrics {
  serviceName: string
  httpRequestsTotal: number
  httpRequestErrorsTotal: number
  httpRequestDurationSeconds: number
  uptimeSeconds: number
}

// ============================================================================
// Market Data Types
// ============================================================================

export type CryptoAsset = 'BTC' | 'ETH' | 'SOL'

export interface OHLCVBar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketPrice {
  asset: CryptoAsset
  price: number
  timestamp: number
  change24h: number
  changePercent24h: number
}

export interface OrderBookLevel {
  price: number
  quantity: number
  total: number
}

export interface OrderBook {
  asset: CryptoAsset
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: number
}

export interface Trade {
  id: string
  asset: CryptoAsset
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: number
}

// ============================================================================
// Trading & Position Types
// ============================================================================

export type PositionSide = 'long' | 'short'
export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected'

export interface Position {
  id: string
  asset: CryptoAsset
  side: PositionSide
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  realizedPnL: number
  marginUsed: number
  liquidationPrice: number
  timestamp: number
}

export interface Order {
  id: string
  asset: CryptoAsset
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
  stopPrice?: number
  status: OrderStatus
  filledQuantity: number
  averagePrice: number
  timestamp: number
  updatedAt: number
}

export interface AccountBalance {
  asset: CryptoAsset
  available: number
  locked: number
  total: number
}

export interface ExchangeAccount {
  accountId: string
  balances: AccountBalance[]
  totalEquityUSD: number
  timestamp: number
}

// ============================================================================
// Collateral & Custodian Types
// ============================================================================

export type CollateralStatus = 'active' | 'warning' | 'critical' | 'liquidated'

export interface Collateral {
  id: string
  asset: CryptoAsset
  quantity: number
  valueUSD: number
  loanToValue: number
  status: CollateralStatus
  liquidationThreshold: number
  timestamp: number
}

export interface CustodianAccount {
  accountId: string
  collateral: Collateral[]
  totalValueUSD: number
  totalLoanValueUSD: number
  overallLTV: number
  timestamp: number
}

// ============================================================================
// Risk Management Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskMetrics {
  totalExposure: number
  netExposure: number
  valueAtRisk99: number
  expectedShortfall: number
  marginUtilization: number
  leverageRatio: number
  riskLevel: RiskLevel
  timestamp: number
}

export interface AssetRisk {
  asset: CryptoAsset
  exposure: number
  var99: number
  volatility: number
  beta: number
}

export interface PortfolioRisk {
  metrics: RiskMetrics
  assetRisks: AssetRisk[]
  correlationMatrix: number[][]
  stressTestResults?: StressTestResult[]
}

export interface StressTestResult {
  scenario: string
  portfolioLoss: number
  lossPercent: number
  marginCall: boolean
  liquidations: number
}

// ============================================================================
// Audit & Event Types
// ============================================================================

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical'
export type EventCategory = 'trade' | 'risk' | 'system' | 'compliance' | 'chaos'

export interface AuditEvent {
  id: string
  timestamp: number
  category: EventCategory
  severity: EventSeverity
  service: string
  action: string
  details: Record<string, any>
  userId?: string
  correlationId?: string
}

// ============================================================================
// Chaos Testing Types
// ============================================================================

export type ChaosScenarioType =
  | 'network_latency'
  | 'service_failure'
  | 'database_slowdown'
  | 'market_volatility'
  | 'flash_crash'

export type ChaosScenarioStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface ChaosScenario {
  id: string
  name: string
  type: ChaosScenarioType
  description: string
  duration: number
  parameters: Record<string, any>
}

export interface ChaosTestRun {
  id: string
  scenarioId: string
  status: ChaosScenarioStatus
  startTime: number
  endTime?: number
  results?: {
    affectedServices: string[]
    errors: number
    recoveryTime: number
    observations: string[]
  }
}

// ============================================================================
// Dashboard & Analytics Types
// ============================================================================

export interface DashboardMetrics {
  servicesUp: number
  servicesTotal: number
  activeTrades: number
  totalExposure: number
  portfolioPnL: number
  riskLevel: RiskLevel
  lastUpdate: number
}

export interface TimeSeriesData {
  timestamp: number
  value: number
}

export interface PriceHistory {
  asset: CryptoAsset
  data: TimeSeriesData[]
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
}

// ============================================================================
// Error Types
// ============================================================================

export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(service: string) {
    super(`Service ${service} is unavailable`, 'SERVICE_UNAVAILABLE')
    this.name = 'ServiceUnavailableError'
  }
}
