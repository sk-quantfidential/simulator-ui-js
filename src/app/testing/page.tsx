'use client'

import { useState } from 'react'
import type { ChaosScenario, ChaosTestRun } from '@/domain/types'

export default function TestingPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [activeTest, setActiveTest] = useState<ChaosTestRun | null>(null)

  // Mock scenarios
  const scenarios: ChaosScenario[] = [
    {
      id: 'network-latency',
      name: 'Network Latency',
      type: 'network_latency',
      description: 'Inject 500ms-2000ms latency between services',
      duration: 300,
      parameters: { minLatency: 500, maxLatency: 2000 },
    },
    {
      id: 'service-failure',
      name: 'Service Failure',
      type: 'service_failure',
      description: 'Simulate random service crashes and restarts',
      duration: 600,
      parameters: { targetServices: ['market-data-simulator'], crashProbability: 0.3 },
    },
    {
      id: 'database-slowdown',
      name: 'Database Slowdown',
      type: 'database_slowdown',
      description: 'Reduce database query performance by 80%',
      duration: 300,
      parameters: { slowdownFactor: 0.8 },
    },
    {
      id: 'market-volatility',
      name: 'Market Volatility Spike',
      type: 'market_volatility',
      description: 'Increase price volatility by 500%',
      duration: 180,
      parameters: { volatilityMultiplier: 5.0 },
    },
    {
      id: 'flash-crash',
      name: 'Flash Crash',
      type: 'flash_crash',
      description: 'Simulate 30% price drop in 60 seconds',
      duration: 120,
      parameters: { priceDrop: 0.3, duration: 60 },
    },
  ]

  const handleStartTest = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const testRun: ChaosTestRun = {
      id: `test-${Date.now()}`,
      scenarioId,
      status: 'running',
      startTime: Date.now(),
    }

    setActiveTest(testRun)
    setSelectedScenario(scenarioId)

    // Simulate test completion after duration
    setTimeout(() => {
      setActiveTest({
        ...testRun,
        status: 'completed',
        endTime: Date.now(),
        results: {
          affectedServices: ['market-data-simulator', 'trading-system-engine'],
          errors: 12,
          recoveryTime: 45,
          observations: [
            'Service degradation detected at T+30s',
            'Automatic failover triggered successfully',
            'Full recovery achieved at T+45s',
          ],
        },
      })
    }, 10000) // 10 seconds for demo
  }

  const handleStopTest = () => {
    if (activeTest) {
      setActiveTest({
        ...activeTest,
        status: 'completed',
        endTime: Date.now(),
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Chaos Testing
        </h1>
        <p className="text-text-secondary">
          Execute chaos scenarios and stress test the trading system
        </p>
      </div>

      {/* Active Test */}
      {activeTest && (
        <div className={`card border-2 ${
          activeTest.status === 'running' ? 'border-warning bg-warning/5' :
          activeTest.status === 'completed' ? 'border-success bg-success/5' :
          'border-danger bg-danger/5'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                Test: {scenarios.find(s => s.id === activeTest.scenarioId)?.name}
              </h3>
              <p className="text-text-secondary">
                Status: <span className={`font-bold ${
                  activeTest.status === 'running' ? 'text-warning' :
                  activeTest.status === 'completed' ? 'text-success' :
                  'text-danger'
                }`}>
                  {activeTest.status.toUpperCase()}
                </span>
              </p>
            </div>
            {activeTest.status === 'running' && (
              <button
                onClick={handleStopTest}
                className="btn-danger"
              >
                Stop Test
              </button>
            )}
          </div>

          {activeTest.results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded">
                  <p className="text-text-secondary text-sm mb-1">Affected Services</p>
                  <p className="text-2xl font-bold">{activeTest.results.affectedServices.length}</p>
                </div>
                <div className="bg-surface p-4 rounded">
                  <p className="text-text-secondary text-sm mb-1">Errors Detected</p>
                  <p className="text-2xl font-bold text-danger">{activeTest.results.errors}</p>
                </div>
                <div className="bg-surface p-4 rounded">
                  <p className="text-text-secondary text-sm mb-1">Recovery Time</p>
                  <p className="text-2xl font-bold text-success">{activeTest.results.recoveryTime}s</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Observations</h4>
                <ul className="space-y-1 text-sm">
                  {activeTest.results.observations.map((obs, i) => (
                    <li key={i} className="text-text-secondary">• {obs}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenarios */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`card-hover ${
                selectedScenario === scenario.id ? 'border-primary' : ''
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">{scenario.name}</h3>
                  <span className="badge bg-primary/20 text-primary border-primary">
                    {Math.floor(scenario.duration / 60)}m
                  </span>
                </div>
                <p className="text-text-secondary text-sm">{scenario.description}</p>
              </div>

              <div className="bg-surface p-3 rounded mb-4">
                <p className="text-xs text-text-tertiary mb-2">Parameters:</p>
                <pre className="text-xs text-text-secondary overflow-x-auto">
                  {JSON.stringify(scenario.parameters, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => handleStartTest(scenario.id)}
                disabled={activeTest?.status === 'running'}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeTest?.scenarioId === scenario.id && activeTest.status === 'running'
                  ? 'Running...'
                  : 'Start Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div className="card bg-primary/5 border-primary">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-bold mb-1">Demo Mode</h3>
            <p className="text-sm text-text-secondary">
              Currently in demonstration mode. Connect to test-coordinator service (port 8088) to execute real chaos tests.
              Tests will automatically complete after 10 seconds in demo mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
