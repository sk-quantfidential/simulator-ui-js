'use client'

import { useState } from 'react'
import type { AuditEvent, EventCategory, EventSeverity } from '@/domain/types'
import { formatDateTime } from '@/domain/services/formatters'

export default function AuditPage() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<EventSeverity | 'all'>('all')

  // Mock events for demonstration
  const mockEvents: AuditEvent[] = [
    {
      id: '1',
      timestamp: Date.now() - 300000,
      category: 'trade',
      severity: 'info',
      service: 'trading-system-engine',
      action: 'Order Filled',
      details: { orderId: 'ORD-12345', asset: 'BTC', quantity: 0.5, price: 65000 },
    },
    {
      id: '2',
      timestamp: Date.now() - 600000,
      category: 'risk',
      severity: 'warning',
      service: 'risk-monitor',
      action: 'Margin Warning',
      details: { accountId: 'ACC-001', utilization: 75.5, threshold: 70 },
    },
    {
      id: '3',
      timestamp: Date.now() - 900000,
      category: 'system',
      severity: 'error',
      service: 'market-data-simulator',
      action: 'Connection Lost',
      details: { endpoint: 'ws://exchange', retryAttempt: 3 },
    },
    {
      id: '4',
      timestamp: Date.now() - 1200000,
      category: 'compliance',
      severity: 'critical',
      service: 'audit-correlator',
      action: 'Suspicious Activity Detected',
      details: { accountId: 'ACC-002', reason: 'Unusual trading pattern' },
    },
    {
      id: '5',
      timestamp: Date.now() - 1800000,
      category: 'chaos',
      severity: 'info',
      service: 'test-coordinator',
      action: 'Chaos Test Started',
      details: { scenario: 'network-latency', duration: 300 },
    },
  ]

  const filteredEvents = mockEvents.filter(event => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) return false
    if (selectedSeverity !== 'all' && event.severity !== selectedSeverity) return false
    return true
  })

  const getSeverityColor = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-danger/20 text-danger border-danger'
      case 'error': return 'bg-danger/20 text-danger border-danger'
      case 'warning': return 'bg-warning/20 text-warning border-warning'
      case 'info': return 'bg-primary/20 text-primary border-primary'
    }
  }

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'trade': return '💱'
      case 'risk': return '⚠️'
      case 'system': return '⚙️'
      case 'compliance': return '🔒'
      case 'chaos': return '🌪️'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Audit Log
        </h1>
        <p className="text-text-secondary">
          System-wide event tracking and correlation
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="input"
            >
              <option value="all">All Categories</option>
              <option value="trade">Trade</option>
              <option value="risk">Risk</option>
              <option value="system">System</option>
              <option value="compliance">Compliance</option>
              <option value="chaos">Chaos</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="input"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex-1" />

          <div className="flex items-end">
            <button className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['all', 'trade', 'risk', 'system', 'compliance', 'chaos'] as const).map((cat) => (
          <div
            key={cat}
            className={`card cursor-pointer transition-all ${
              selectedCategory === cat ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            <p className="text-text-secondary text-xs mb-1">
              {cat === 'all' ? 'Total' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </p>
            <p className="text-2xl font-bold">
              {cat === 'all' ? mockEvents.length : mockEvents.filter(e => e.category === cat).length}
            </p>
          </div>
        ))}
      </div>

      {/* Event Timeline */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Event Timeline</h2>
        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface p-4 rounded-lg border border-border hover:border-primary transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(event.category)}</span>
                    <div>
                      <h3 className="font-bold text-text">{event.action}</h3>
                      <p className="text-sm text-text-secondary">{event.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="ml-11 bg-background p-3 rounded text-sm font-mono">
                  <pre className="text-text-secondary overflow-x-auto">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <p>No events match the selected filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <div className="card bg-warning/5 border-warning">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-bold mb-1">Mock Data Mode</h3>
            <p className="text-sm text-text-secondary">
              Currently displaying sample events. Connect to audit-correlator service (port 8082) for live event stream.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
