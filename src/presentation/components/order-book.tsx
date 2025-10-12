'use client'

import type { OrderBook } from '@/domain/types'
import { formatUSD } from '@/domain/services/formatters'

interface OrderBookProps {
  orderBook: OrderBook
}

export function OrderBookView({ orderBook }: OrderBookProps) {
  const maxTotal = Math.max(
    ...orderBook.bids.map(b => b.total),
    ...orderBook.asks.map(a => a.total)
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Bids */}
      <div>
        <h3 className="font-bold text-success mb-3">Bids</h3>
        <div className="space-y-1">
          {orderBook.bids.slice(0, 10).map((bid, i) => (
            <div key={i} className="relative">
              <div
                className="absolute inset-0 bg-success opacity-10"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="relative flex justify-between text-sm py-1 px-2">
                <span className="text-success">{formatUSD(bid.price)}</span>
                <span className="text-text-secondary">{bid.quantity.toFixed(4)}</span>
                <span className="text-text-tertiary">{formatUSD(bid.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asks */}
      <div>
        <h3 className="font-bold text-danger mb-3">Asks</h3>
        <div className="space-y-1">
          {orderBook.asks.slice(0, 10).map((ask, i) => (
            <div key={i} className="relative">
              <div
                className="absolute inset-0 bg-danger opacity-10"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <div className="relative flex justify-between text-sm py-1 px-2">
                <span className="text-danger">{formatUSD(ask.price)}</span>
                <span className="text-text-secondary">{ask.quantity.toFixed(4)}</span>
                <span className="text-text-tertiary">{formatUSD(ask.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
