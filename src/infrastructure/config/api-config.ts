/**
 * API Configuration - Service endpoint mappings
 */

export interface ServiceEndpoints {
  serviceRegistry: string
  auditCorrelator: string
  custodianSimulator: string
  exchangeSimulator: string
  marketDataSimulator: string
  riskMonitor: string
  tradingSystemEngine: string
  testCoordinator: string
  prometheus: string
  grafana: string
  jaeger: string
}

export const getServiceEndpoints = (): ServiceEndpoints => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost'

  return {
    serviceRegistry: process.env.NEXT_PUBLIC_SERVICE_REGISTRY_URL || `${baseUrl}:8081`,
    auditCorrelator: process.env.NEXT_PUBLIC_AUDIT_CORRELATOR_URL || `${baseUrl}:8082`,
    custodianSimulator: process.env.NEXT_PUBLIC_CUSTODIAN_SIMULATOR_URL || `${baseUrl}:8083`,
    exchangeSimulator: process.env.NEXT_PUBLIC_EXCHANGE_SIMULATOR_URL || `${baseUrl}:8084`,
    marketDataSimulator: process.env.NEXT_PUBLIC_MARKET_DATA_SIMULATOR_URL || `${baseUrl}:8085`,
    riskMonitor: process.env.NEXT_PUBLIC_RISK_MONITOR_URL || `${baseUrl}:8086`,
    tradingSystemEngine: process.env.NEXT_PUBLIC_TRADING_SYSTEM_ENGINE_URL || `${baseUrl}:8087`,
    testCoordinator: process.env.NEXT_PUBLIC_TEST_COORDINATOR_URL || `${baseUrl}:8088`,
    prometheus: process.env.NEXT_PUBLIC_PROMETHEUS_URL || `${baseUrl}:9090`,
    grafana: process.env.NEXT_PUBLIC_GRAFANA_URL || `${baseUrl}:3000`,
    jaeger: process.env.NEXT_PUBLIC_JAEGER_URL || `${baseUrl}:16686`,
  }
}

export const API_TIMEOUTS = {
  default: 5000,
  long: 15000,
  sse: 30000,
} as const

export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
} as const

export const SSE_CONFIG = {
  reconnectDelay: 5000,
  updateInterval: parseInt(process.env.NEXT_PUBLIC_SSE_UPDATE_INTERVAL || '4000', 10),
  enabled: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME !== 'false',
} as const
