'use client'

import { useEffect, useState } from 'react'
import type { Position } from '@/domain/types'
import { RestTrading } from '@/infrastructure/adapters/rest-trading'
import { formatUSD, formatCrypto } from '@/domain/services/formatters'

export default function TradingPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const trading = new RestTrading()

    // Initial data fetch
    const fetchInitialPositions = async () => {
      try {
        const data = await trading.getOpenPositions()
        setPositions(data)
      } catch (error) {
        console.error('Failed to fetch positions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialPositions()

    // Subscribe to real-time position updates via SSE
    const unsubscribePositions = trading.subscribeToPositionUpdates((updatedPosition) => {
      setPositions((prevPositions) => {
        const index = prevPositions.findIndex((p) => p.id === updatedPosition.id)
        if (index >= 0) {
          // Update existing position
          const newPositions = [...prevPositions]
          newPositions[index] = updatedPosition
          return newPositions
        }
        // Add new position
        return [...prevPositions, updatedPosition]
      })
    })

    return () => {
      unsubscribePositions()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading positions...</p>
        </div>
      </div>
    )
  }

  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
  const totalMargin = positions.reduce((sum, pos) => sum + pos.marginUsed, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Trading Positions
        </h1>
        <p className="text-text-secondary">
          Active positions and unrealized PnL
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Open Positions</p>
          <p className="text-3xl font-bold text-primary">{positions.length}</p>
        </div>
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Total Unrealized PnL</p>
          <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatUSD(totalPnL)}
          </p>
        </div>
        <div className="card">
          <p className="text-text-secondary text-sm font-medium mb-1">Margin Used</p>
          <p className="text-3xl font-bold text-warning">{formatUSD(totalMargin)}</p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Positions</h2>
        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-text-secondary text-sm">
                  <th className="pb-3">Asset</th>
                  <th className="pb-3">Side</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Entry Price</th>
                  <th className="pb-3">Current Price</th>
                  <th className="pb-3">Unrealized PnL</th>
                  <th className="pb-3">Margin</th>
                  <th className="pb-3">Liq. Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {positions.map((position) => (
                  <tr key={position.id} className="text-text">
                    <td className="py-4 font-bold">{position.asset}</td>
                    <td className="py-4">
                      <span className={`badge ${
                        position.side === 'long' ? 'bg-success/20 text-success border-success' : 'bg-danger/20 text-danger border-danger'
                      }`}>
                        {position.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">{formatCrypto(position.asset, position.quantity)}</td>
                    <td className="py-4">{formatUSD(position.entryPrice)}</td>
                    <td className="py-4">{formatUSD(position.currentPrice)}</td>
                    <td className={`py-4 font-bold ${position.unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatUSD(position.unrealizedPnL)}
                    </td>
                    <td className="py-4">{formatUSD(position.marginUsed)}</td>
                    <td className="py-4 text-text-secondary">{formatUSD(position.liquidationPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p>No open positions</p>
          </div>
        )}
      </div>

      {/* Account Balances */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Account Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary">BTC</span>
              <span className="text-xs text-text-tertiary">Bitcoin</span>
            </div>
            <p className="text-2xl font-bold text-text mb-1">0.6000</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-tertiary">Available:</span>
                <span className="text-success ml-2">0.5000</span>
              </div>
              <div>
                <span className="text-text-tertiary">Locked:</span>
                <span className="text-warning ml-2">0.1000</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary">ETH</span>
              <span className="text-xs text-text-tertiary">Ethereum</span>
            </div>
            <p className="text-2xl font-bold text-text mb-1">12.5000</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-tertiary">Available:</span>
                <span className="text-success ml-2">10.0000</span>
              </div>
              <div>
                <span className="text-text-tertiary">Locked:</span>
                <span className="text-warning ml-2">2.5000</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary">SOL</span>
              <span className="text-xs text-text-tertiary">Solana</span>
            </div>
            <p className="text-2xl font-bold text-text mb-1">120.0000</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-tertiary">Available:</span>
                <span className="text-success ml-2">100.0000</span>
              </div>
              <div>
                <span className="text-text-tertiary">Locked:</span>
                <span className="text-warning ml-2">20.0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
        <div className="text-center py-12 text-text-secondary">
          <p>No recent orders</p>
          <p className="text-sm text-text-tertiary mt-2">
            Order history will appear here once integrated with exchange-simulator
          </p>
        </div>
      </div>
    </div>
  )
}
