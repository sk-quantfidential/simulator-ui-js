import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost'
process.env.NEXT_PUBLIC_SERVICE_REGISTRY_URL = 'http://localhost:8081'
process.env.NEXT_PUBLIC_PROMETHEUS_URL = 'http://localhost:9090'
process.env.NEXT_PUBLIC_GRAFANA_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SSE_UPDATE_INTERVAL = '4000'

// Mock fetch for tests
global.fetch = jest.fn()

// Mock EventSource for SSE tests
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 0,
  url: '',
  withCredentials: false,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
  onopen: null,
  onmessage: null,
  onerror: null,
  dispatchEvent: jest.fn(),
})) as any
