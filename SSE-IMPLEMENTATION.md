# Server-Sent Events (SSE) Implementation

## Overview

The Trading Ecosystem UI uses Server-Sent Events (SSE) for real-time data streaming from backend services. This provides efficient, low-latency updates for market prices, trading positions, and risk metrics with automatic reconnection and graceful degradation to polling when SSE is unavailable.

## Architecture

### SSE Client Utility

**Location**: `src/infrastructure/utils/sse-client.ts`

The SSE client provides a robust abstraction over the native EventSource API with the following features:

- **Automatic Reconnection**: Exponential backoff with configurable max attempts
- **Connection Timeout**: Configurable timeout for establishing connections
- **Event Subscriptions**: Type-safe event handlers with easy unsubscribe
- **Error Handling**: Comprehensive error handling with custom error handlers
- **Connection Lifecycle**: Hooks for open, close, and error events

```typescript
import { createSSEClient } from '@/infrastructure/utils/sse-client'

const client = createSSEClient('http://localhost:8085/api/v1/stream/prices', {
  maxReconnectAttempts: 10,
  reconnectDelay: 2000,
  maxReconnectDelay: 30000,
  connectionTimeout: 30000,
})

// Subscribe to events
const unsubscribe = client.on('price', (message) => {
  console.log('Price update:', message.data)
})

// Cleanup
unsubscribe()
client.disconnect()
```

### Adapter Integration

SSE is integrated into the following adapters:

#### 1. Market Data Adapter
**File**: `src/infrastructure/adapters/rest-market-data.ts`

Streams real-time price updates for cryptocurrencies:

```typescript
const marketData = new RestMarketData()

const unsubscribe = marketData.subscribeTopriceUpdates(
  ['BTC', 'ETH', 'SOL'],
  (price) => {
    console.log(`${price.asset}: $${price.price}`)
  }
)
```

**SSE Endpoints**:
- `/api/v1/stream/prices` - Real-time price updates
- Events: `price` (single asset), `prices` (batch updates)

**Fallback**: Falls back to 5-second polling if SSE connection fails

#### 2. Risk Monitor Adapter
**File**: `src/infrastructure/adapters/rest-risk-monitor.ts`

Streams real-time risk metrics:

```typescript
const riskMonitor = new RestRiskMonitor()

const unsubscribe = riskMonitor.subscribeToRiskUpdates((metrics) => {
  console.log('VaR 99%:', metrics.valueAtRisk99)
  console.log('Margin Utilization:', metrics.marginUtilization)
})
```

**SSE Endpoints**:
- `/api/v1/stream/risk` - Real-time risk metrics
- Events: `risk_update`, `metrics`

**Fallback**: Falls back to 5-second polling if SSE connection fails

#### 3. Trading Adapter
**File**: `src/infrastructure/adapters/rest-trading.ts`

Streams real-time position and order updates:

```typescript
const trading = new RestTrading()

// Subscribe to position updates
const unsubscribePositions = trading.subscribeToPositionUpdates((position) => {
  console.log(`Position ${position.id}: ${position.unrealizedPnL}`)
})

// Subscribe to order updates
const unsubscribeOrders = trading.subscribeToOrderUpdates((order) => {
  console.log(`Order ${order.id}: ${order.status}`)
})
```

**SSE Endpoints**:
- `/api/v1/stream/positions` - Real-time position updates
- `/api/v1/stream/orders` - Real-time order updates
- Events: `position`, `positions`, `order`, `orders`

**Fallback**: Falls back to 5-second polling if SSE connection fails

## Page Integration

### Dashboard Page
**File**: `src/app/page.tsx`

- Subscribes to price updates for BTC, ETH, SOL
- Updates prices in real-time without full page refresh
- Maintains service health polling separately

### Market Page
**File**: `src/app/market/page.tsx`

- Subscribes to price updates for all assets
- Updates price chart dynamically as new data arrives
- Polls order book and trades at lower frequency (10s)

### Trading Page
**File**: `src/app/trading/page.tsx`

- Subscribes to position updates
- Updates unrealized PnL in real-time
- Shows live position changes

### Risk Page
**File**: `src/app/risk/page.tsx`

- Subscribes to risk metrics updates
- Shows live VaR, margin utilization, leverage changes
- Updates risk level alerts dynamically

## Reconnection Strategy

The SSE client uses exponential backoff for reconnection:

1. **Initial Delay**: 1-2 seconds (configurable)
2. **Exponential Backoff**: Doubles with each attempt (with jitter)
3. **Max Delay**: 30 seconds (configurable)
4. **Max Attempts**: 5-10 (configurable per adapter)

```typescript
// Example reconnection sequence
// Attempt 1: ~1s delay
// Attempt 2: ~2s delay
// Attempt 3: ~4s delay
// Attempt 4: ~8s delay
// Attempt 5: ~16s delay
// After max attempts: Falls back to polling
```

## Error Handling

### Connection Errors
- SSE connection failures trigger automatic reconnection
- Error handlers can be registered for custom error processing
- Falls back to polling after max reconnection attempts

### Message Parsing Errors
- Invalid JSON messages are logged but don't break the connection
- Malformed data uses default values
- Handler errors are caught and logged

### Network Issues
- Connection timeouts trigger reconnection
- Lost connections are detected via EventSource error events
- Manual disconnect prevents reconnection attempts

## Testing

### SSE Client Tests
**File**: `tests/infrastructure/sse-client.test.ts`

- Connection management (connect, disconnect, reconnect)
- Message handling (JSON, plain text, batches)
- Error handling (connection errors, parsing errors)
- Reconnection backoff
- Event subscriptions and unsubscribe
- Connection timeout

### Adapter SSE Tests
**File**: `tests/infrastructure/rest-market-data-sse.test.ts`

- Price update subscriptions
- Event filtering (subscribed assets only)
- Data transformation
- Fallback to polling
- Cleanup on unsubscribe

## Performance Considerations

### Why SSE over WebSockets?

1. **Simplicity**: Unidirectional data flow (server → client)
2. **HTTP/2 Multiplexing**: Efficient with HTTP/2
3. **Automatic Reconnection**: Built into EventSource API
4. **Firewall Friendly**: Uses standard HTTP
5. **No Custom Protocol**: No need for WebSocket handshake

### Update Frequency

- **Market Prices**: Real-time (as backend publishes)
- **Risk Metrics**: Every 4-5 seconds
- **Positions**: Real-time (on changes)
- **Order Book** (polling fallback): Every 10 seconds

### Resource Usage

- Each SSE connection maintains one HTTP connection
- Multiple subscriptions on same connection reuse the stream
- Automatic cleanup on component unmount
- Connection pooling via HTTP/2

## Backend SSE Endpoint Requirements

For backend services to work with this implementation, they must:

1. **Set Correct Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

2. **Send Events in SSE Format**:
```
event: price
data: {"asset": "BTC", "price": 65000}

event: prices
data: {"BTC": {"price": 65000}, "ETH": {"price": 3500}}
```

3. **Support CORS** (for development):
```
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Credentials: true
```

## Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost
```

### Per-Adapter SSE Options

Each adapter can configure SSE client options:

```typescript
const sseClient = createSSEClient(streamUrl, {
  maxReconnectAttempts: 10,     // Retry up to 10 times
  reconnectDelay: 2000,          // Start with 2s delay
  maxReconnectDelay: 30000,      // Max 30s delay
  connectionTimeout: 30000,      // 30s connection timeout
})
```

## Troubleshooting

### SSE Not Connecting

1. Check backend service is running on correct port
2. Verify `/api/v1/stream/*` endpoints exist
3. Check CORS headers in backend response
4. Look for SSL/TLS issues (use HTTP for local dev)

### Frequent Reconnections

1. Check backend service stability
2. Verify network connection
3. Increase `maxReconnectDelay`
4. Check backend timeout settings

### No Updates Received

1. Verify event names match (`price`, `prices`, `risk_update`, etc.)
2. Check data format (JSON parsing)
3. Ensure assets are in subscription list
4. Check browser dev console for errors

### Falling Back to Polling

- Normal behavior when SSE unavailable
- Check browser console for SSE error messages
- Verify backend SSE implementation
- Consider increasing `maxReconnectAttempts`

## Future Improvements

1. **Compression**: Implement SSE message compression
2. **Binary Encoding**: Use binary format for large datasets
3. **Delta Updates**: Send only changed fields
4. **Last-Event-ID**: Resume from last received event
5. **Health Checks**: Periodic ping/pong to detect stale connections
6. **Metrics**: Track SSE performance (latency, reconnections, errors)
7. **Circuit Breaker**: Prevent reconnection storms during outages

## References

- [MDN EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [HTML5 Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [SSE vs WebSockets](https://ably.com/topic/websockets-vs-sse)
