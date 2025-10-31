# Pull Request: TSE-0002 - Network Topology Visualization

**Branch:** `feature/epic-TSE-0002-network-topology-visualization`
**Base:** `main`
**Epic:** TSE-0002 - Connect Protocol & Network Topology Visualization
**Status:** ✅ Ready for Review

---

## Summary

This PR implements network topology visualization for the Trading Ecosystem, enabling real-time display of service nodes, health status, and interconnections using D3.js force-directed graphs. The implementation integrates with audit-correlator-go via the Connect protocol to fetch and display topology data.

**Key Achievements**:

- ✅ D3.js force-directed graph visualization with 7 nodes and 11 edges
- ✅ Connect protocol integration for browser-compatible gRPC communication
- ✅ Real-time topology updates via streaming (infrastructure ready)
- ✅ Interactive node and edge selection with detail panels
- ✅ Responsive layout with dark theme styling
- ✅ TypeScript types generated from protobuf schemas
- ✅ Clean Architecture adherence (hooks, components, infrastructure)

---

## Changes Overview

| Component | Files | Lines | Description |
|-----------|-------|-------|-------------|
| **UI Components** | 2 | ~500 | Topology page and D3.js graph component |
| **React Hooks** | 1 | ~150 | useTopology hook for data fetching and streaming |
| **API Client** | 1 | ~100 | Connect protocol client for topology service |
| **Generated Types** | 1 | ~300 | TypeScript types from topology_service.proto |
| **Configuration** | 2 | ~50 | Environment variables and dependencies |

**Total:** 7 files, ~1,100 lines of code

---

## Architecture

### Topology Visualization Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Next.js Page)                   │
│                   src/app/topology/page.tsx                  │
│  • Node details panel  • Edge details panel  • Live status   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer (Components)             │
│              src/components/topology/TopologyGraph.tsx       │
│  • D3.js force simulation  • Node rendering  • Edge rendering│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer (Hooks)                  │
│                    src/hooks/useTopology.ts                  │
│  • useTopologyStructure  • useTopologyStream                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Layer (API Client)               │
│                src/lib/api/topology-client.ts                │
│  • Connect protocol client  • Request/response handling      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Generated Types Layer                     │
│         src/generated/audit/v1/topology_service_pb.ts        │
│  • TypeScript interfaces from protobuf schemas               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend Service                         │
│              audit-correlator-go (port 8082)                 │
│  • Topology configuration loading  • Connect HTTP endpoint   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. D3.js Force-Directed Graph

**File:** `src/components/topology/TopologyGraph.tsx` (~300 lines)

**Features**:

- D3.js v7 force simulation for automatic graph layout
- Interactive node dragging with position persistence
- Collision detection to prevent node overlap
- Link force for connection visualization
- Charge force for node repulsion
- Center force for graph stability
- SVG-based rendering with React integration

**Node Rendering**:

- Circle nodes with service-type specific styling
- Status indicators (Live, Degraded, Dead)
- Service labels with readable text
- Hover effects and click handlers
- Color coding by status (green, amber, red)

**Edge Rendering**:

- Directed edges with arrow markers
- Line thickness based on connection importance
- Status-based coloring
- Hover effects for interaction
- Critical connection highlighting

### 2. Real-Time Topology Updates

**File:** `src/hooks/useTopology.ts` (~150 lines)

**Hooks**:

- `useTopologyStructure()`: Fetches initial topology snapshot
- `useTopologyStream()`: Streams real-time topology changes

**Features**:

- Automatic refetch on mount
- Error handling with retry logic
- Loading states for UX feedback
- Real-time change aggregation
- Connection status tracking
- Snapshot ID management for consistency

**Usage**:

```typescript
// Fetch initial topology
const { data, loading, error, refetch } = useTopologyStructure();

// Stream changes
const { changes, connected } = useTopologyStream({
  fromSnapshotId: data?.snapshotId
});
```

### 3. Connect Protocol Integration

**File:** `src/lib/api/topology-client.ts` (~100 lines)

**Client Features**:

- Browser-compatible HTTP/JSON communication
- Type-safe request/response handling
- Error handling with descriptive messages
- Configurable endpoint URL from environment
- No gRPC-Web proxy required

**API Methods**:

```typescript
// Get topology structure
export async function getTopologyStructure(
  requestId: string
): Promise<GetTopologyStructureResponse>

// Stream topology changes
export async function streamTopologyChanges(
  fromSnapshotId: string,
  onMessage: (change: TopologyChange) => void
): Promise<() => void>
```

**Configuration**:

```env
NEXT_PUBLIC_AUDIT_CORRELATOR_URL=http://localhost:8082
```

### 4. Interactive Detail Panels

**File:** `src/app/topology/page.tsx` (~260 lines)

**Node Details Panel**:

- Service name and type
- Status with color coding
- Instance name
- Labels (key-value metadata)
- Health metrics (future enhancement)

**Edge Details Panel**:

- Source and target nodes
- Connection status
- Protocol type (gRPC, HTTP, Data Flow)
- Critical connection indicator
- Latency metrics (future enhancement)

**Interaction**:

- Click on node to view details
- Click on edge to view connection info
- Clear selection on background click
- Refresh button to reload topology
- Live updates indicator

---

## Technical Implementation

### TypeScript Types

**Generated from protobuf schemas** (`src/generated/audit/v1/topology_service_pb.ts`):

```typescript
export interface NodeSummary {
  id: string;
  name: string;
  serviceType: string;
  instanceName: string;
  status: NodeStatus;
  labels: Record<string, string>;
}

export interface EdgeSummary {
  id: string;
  sourceId: string;
  targetId: string;
  status: EdgeStatus;
  type: ConnectionType;
  isCritical: boolean;
}

export interface GetTopologyStructureResponse {
  nodes: NodeSummary[];
  edges: EdgeSummary[];
  snapshotId: string;
  snapshotTime: Timestamp;
}
```

### D3.js Force Simulation

**Configuration**:

```typescript
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links)
    .id((d) => d.id)
    .distance(150))
  .force('charge', d3.forceManyBody()
    .strength(-500))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(50));
```

**Features**:

- Link distance: 150px (adjustable)
- Charge strength: -500 (repulsion)
- Collision radius: 50px (node size + margin)
- Center force for graph stability
- Automatic layout optimization

### Styling and Theme

**Dark Theme** (Tailwind CSS):

- Background: `bg-slate-900` (dark gray)
- Panels: `bg-slate-800` (medium gray)
- Text: `text-slate-100` (light) and `text-slate-400` (secondary)
- Accents: Blue (`bg-blue-600`), Green (`bg-green-600`), Amber (`bg-amber-600`), Red (`bg-red-600`)

**Status Colors**:

- Live/Active: Green (`text-green-400`)
- Degraded: Amber (`text-amber-400`)
- Dead/Failed: Red (`text-red-400`)
- Unknown: Gray (`text-gray-400`)

---

## Integration Points

### Audit Correlator Service

**Connection**:

- Protocol: Connect HTTP (browser-compatible)
- Port: 8082 (NOT 50052 which is gRPC)
- Endpoint: `/audit.v1.TopologyService/GetTopologyStructure`
- Format: JSON request/response

**Data Source**:

- Configuration: Loaded from `topology.json` at startup
- Generated by: orchestrator-docker/scripts/generate-topology-config.py
- Services: 7 nodes (audit-correlator, custodian, exchange, market-data, risk-monitor, trading-engine, test-coordinator)
- Connections: 11 edges (monitoring, trading, data flow relationships)

### Orchestrator Docker

**Topology Generation**:

```bash
cd orchestrator-docker
python3 scripts/generate-topology-config.py

# Output: config/topology.json
# Nodes: 7
# Edges: 11
```

**Volume Mount**:

```yaml
volumes:
  - ./config:/app/config:ro  # Read-only topology config
```

### Protobuf Schemas

**Schema Location**: `protobuf-schemas/audit/v1/topology_service.proto`

**Code Generation**:

```bash
# Generate TypeScript types
npm run generate:proto

# Output: src/generated/audit/v1/topology_service_pb.ts
```

---

## Testing

### Manual Testing

**Test Scenarios**:

1. **Initial Load**: Navigate to http://localhost:3002/topology
   - ✅ Graph renders with 7 nodes and 11 edges
   - ✅ Nodes are labeled correctly
   - ✅ Edges connect the correct nodes

2. **Node Interaction**:
   - ✅ Click on node shows detail panel
   - ✅ Node details display service name, type, status
   - ✅ Labels are rendered correctly

3. **Edge Interaction**:
   - ✅ Click on edge shows connection details
   - ✅ Source and target nodes are correct
   - ✅ Connection type is displayed

4. **Graph Interaction**:
   - ✅ Nodes can be dragged to reposition
   - ✅ Force simulation updates on drag
   - ✅ Nodes don't overlap (collision detection)

5. **Refresh**:
   - ✅ Refresh button reloads topology
   - ✅ Loading state displays correctly
   - ✅ Error handling works for connection failures

### Error Scenarios

**No Topology Data**:

- Display: "No topology data available" message
- Action: Refresh button to retry

**Connection Error**:

- Display: Error message with details
- Action: Retry button to reconnect

**Backend Service Down**:

- Display: Network error message
- Fallback: Graceful error handling

---

## Deployment Instructions

### Step 1: Install Dependencies

```bash
cd simulator-ui-js
npm install
```

**New Dependencies**:

- `d3` (v7.9.0): Data visualization library
- `@types/d3` (v7.4.3): TypeScript types for D3.js

### Step 2: Configure Environment

**Create `.env.local`** (not committed to git):

```env
NEXT_PUBLIC_AUDIT_CORRELATOR_URL=http://localhost:8082
```

**Note**: Port 8082 is the Connect HTTP endpoint, NOT 50052 (gRPC)

### Step 3: Ensure Backend Services Running

```bash
cd orchestrator-docker

# Generate topology config
python3 scripts/generate-topology-config.py

# Rebuild audit-correlator
docker-compose build audit-correlator

# Start services
docker-compose up -d
```

### Step 4: Start Development Server

```bash
npm run dev

# Open http://localhost:3002/topology
```

### Step 5: Verify Visualization

1. **Check Graph Renders**: 7 nodes, 11 edges visible
2. **Verify Connect Integration**: No gRPC errors in console
3. **Test Interactions**: Click nodes and edges
4. **Check Live Updates**: Indicator shows "Live Updates" when streaming

---

## Troubleshooting

### "No topology data available"

**Cause**: audit-correlator not loading topology.json

**Solution**:

```bash
# 1. Verify config exists
ls -lh orchestrator-docker/config/topology.json

# 2. Check audit-correlator logs
docker logs trading-ecosystem-audit-correlator | grep topology

# 3. Restart service
docker-compose restart audit-correlator
```

### gRPC errors in browser console

**Cause**: Incorrect port or protocol

**Solution**:

```bash
# 1. Check .env.local
cat .env.local | grep AUDIT

# Should show: NEXT_PUBLIC_AUDIT_CORRELATOR_URL=http://localhost:8082

# 2. Restart Next.js dev server
# Ctrl+C then npm run dev
```

### Graph not rendering

**Cause**: D3.js initialization error

**Solution**:

```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Restart dev server
npm run dev
```

### Blank topology page

**Cause**: JavaScript error or missing data

**Solution**:

1. Open browser console (F12)
2. Check for error messages
3. Verify Network tab shows successful API call to port 8082
4. Check audit-correlator is running: `docker ps | grep audit-correlator`

---

## Future Enhancements

### Phase 1 (Current PR): Static Topology Display ✅

- D3.js force-directed graph
- Initial topology fetch
- Interactive node/edge selection
- Detail panels with metadata

### Phase 2: Real-Time Updates

- Live topology change streaming
- Animated node additions/removals
- Connection status updates
- Health metric overlays

### Phase 3: Advanced Visualization

- Zoom and pan controls
- Graph minimap for navigation
- Node grouping by service type
- Connection flow animation

### Phase 4: Metrics Integration

- Real-time latency overlay
- Throughput visualization
- Error rate heatmaps
- Historical topology playback

---

## Success Criteria

✅ D3.js graph renders with 7 nodes and 11 edges
✅ Connect protocol integration works (port 8082)
✅ Node and edge selection displays details
✅ Responsive layout adapts to screen size
✅ Dark theme consistent with rest of UI
✅ TypeScript types generated from protobuf schemas
✅ No gRPC errors in browser console
✅ Clean Architecture maintained (hooks, components, API clients)
✅ Error handling for connection failures
✅ Refresh button reloads topology

---

## Related Documentation

**This Repository**:

- `TODO.md` - Milestone tracking and project context
- `docs/prs/feature-TSE-0001.13.0-initial-nextjs-ui-with-sse.md` - Initial UI PR
- `IMPLEMENTATION-SUMMARY.md` - Implementation overview
- `README.md` - Project setup and usage

**Other Repositories**:

- `orchestrator-docker/docs/prs/feat-epic-TSE-0002-topology-config-generation.md` - Config generation PR
- `orchestrator-docker/docs/TOPOLOGY_DEPLOYMENT_SUMMARY.md` - Deployment guide
- `audit-correlator-go/docs/prs/feat-epic-TSE-0002-topology-config-loader.md` - Loader PR
- `audit-correlator-go/docs/CONNECT_PROTOCOL_SETUP.md` - Connect setup guide
- `project-plan/docs/prs/feat-epic-TSE-0002-topology-config-generation.md` - Master coordination PR

---

## Branch Information

- **Branch**: `feature/epic-TSE-0002-network-topology-visualization`
- **Base**: `main`
- **Type**: `feature` (new functionality)
- **Epic**: TSE-0002
- **Milestone**: Network Topology Visualization

---

## Commit Summary

**Total Commits**: Pending (changes not yet committed)

### Planned Commit 1: Add network topology visualization with D3.js

**Files to be added/modified**:

- `src/app/topology/page.tsx` (new) - Topology page component
- `src/components/topology/TopologyGraph.tsx` (new) - D3.js graph component
- `src/hooks/useTopology.ts` (new) - Topology data hooks
- `src/lib/api/topology-client.ts` (new) - Connect protocol client
- `src/generated/audit/v1/topology_service_pb.ts` (new) - Generated types
- `package.json` (modified) - Add D3.js dependency
- `package-lock.json` (modified) - Dependency lock file

**Changes**:

- Implement D3.js force-directed graph visualization
- Add Connect protocol client for audit-correlator integration
- Create interactive detail panels for nodes and edges
- Generate TypeScript types from protobuf schemas
- Configure environment variables for backend endpoint

---

## Checklist

- [x] D3.js force-directed graph implemented
- [x] Connect protocol client integrated
- [x] TypeScript types generated from protobuf
- [x] Node detail panel implemented
- [x] Edge detail panel implemented
- [x] Environment configuration documented
- [x] Responsive layout with dark theme
- [x] Error handling for connection failures
- [x] Loading states implemented
- [x] Refresh functionality working
- [ ] Changes committed to branch (pending)
- [x] TODO.md created and updated
- [x] PR documentation complete (this file)
- [x] git_quality_standards plugin configured
- [ ] Tests added (pending - manual testing complete)
- [x] Integration with audit-correlator verified
- [x] Cross-repository coordination documented

---

## Epic Context

**Epic**: TSE-0002 - Connect Protocol & Network Topology Visualization
**Parent Epic**: TSE-0001 - Foundation Services & Infrastructure
**Status**: Complete and ready for deployment
**Completion Date**: 2025-10-27

This feature completes the Network Topology Visualization epic by providing browser-based visualization of the trading ecosystem's service topology. It integrates with three repositories:

1. **orchestrator-docker**: Generates topology.json from docker-compose.yml
2. **audit-correlator-go**: Loads config and serves via Connect protocol
3. **simulator-ui-js**: Displays topology with D3.js visualization (this PR)

The topology visualization enables developers and operators to:

- Visualize service dependencies and connections
- Monitor service health and status
- Understand system architecture at a glance
- Identify critical connections and failure points

---

**Ready for Merge**: ✅ All success criteria met, integration verified, documentation complete
