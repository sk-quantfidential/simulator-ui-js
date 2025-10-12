'use client'

import { useEffect, useState } from 'react'
import { ServiceHealthIndicator } from '@/presentation/components/service-health-indicator'
import type { ServiceHealth } from '@/domain/types'
import { RestServiceRegistry } from '@/infrastructure/adapters/rest-service-registry'

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const serviceRegistry = new RestServiceRegistry()

    const fetchServices = async () => {
      try {
        const data = await serviceRegistry.getAllServices()
        setServices(data)
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchServices, 5000)

    return () => clearInterval(interval)
  }, [])

  const servicesUp = services.filter((s) => s.status === 'up').length
  const servicesDown = services.filter((s) => s.status === 'down').length
  const servicesDegraded = services.filter((s) => s.status === 'degraded').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Service Monitor
        </h1>
        <p className="text-text-secondary">
          Real-time health status of all microservices in the trading ecosystem
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Total Services</p>
          <p className="text-3xl font-bold text-primary">{services.length}</p>
        </div>
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Online</p>
          <p className="text-3xl font-bold text-success">{servicesUp}</p>
        </div>
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Degraded</p>
          <p className="text-3xl font-bold text-warning">{servicesDegraded}</p>
        </div>
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Offline</p>
          <p className="text-3xl font-bold text-danger">{servicesDown}</p>
        </div>
      </div>

      {/* Service List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Services</h2>
        <div className="space-y-4">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceHealthIndicator
                key={service.name}
                name={service.name}
                status={service.status}
                instance={service.instance}
                uptime={service.uptime}
                version={service.version}
                showDetails
              />
            ))
          ) : (
            <div className="card text-center py-12">
              <p className="text-text-secondary mb-4">
                No services detected.
              </p>
              <p className="text-text-tertiary text-sm">
                Make sure the Docker Compose infrastructure is running:
              </p>
              <code className="text-primary text-sm mt-2 block">
                docker-compose up -d
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Service Topology */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Service Topology</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-success mb-2">Infrastructure</h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• Redis (Cache & Discovery)</li>
              <li>• PostgreSQL (Persistence)</li>
              <li>• Service Registry</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-2">Go Services</h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• Audit Correlator</li>
              <li>• Custodian Simulator</li>
              <li>• Exchange Simulator</li>
              <li>• Market Data Simulator</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-warning mb-2">Python Services</h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• Risk Monitor</li>
              <li>• Trading System Engine</li>
              <li>• Test Coordinator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
