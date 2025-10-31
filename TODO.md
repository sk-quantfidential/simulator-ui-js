# simulator-ui-js - Component TODO

## 🛠️ Milestone: TSE-0001.Foundation - Git Quality Standards

**Status**: ✅ **COMPLETED**
**Goal**: Standardize validation scripts and git workflows across ecosystem
**Priority**: Foundation
**Completed**: 2025-10-31

### Completed Tasks

- [x] Standardized validate-all.sh across all repositories
- [x] Replaced symlinks with actual file copies for better portability
- [x] Added git quality standards plugin structure
- [x] Implemented simplified PR documentation matching (exact branch name with slash-to-dash conversion)
- [x] Added TODO.md OR TODO-MASTER.md validation check
- [x] Ensured identical scripts in both scripts/ and .claude/plugins/ directories
- [x] Updated validation exceptions for Node.js project

---

## Current Milestone: TSE-0002 - Network Topology Visualization

### 🌐 Milestone TSE-0002.UI: Network Topology Visualization

**Status**: ✅ **COMPLETED** (2025-10-27)
**Priority**: High
**Branch**: `feature/epic-TSE-0002-network-topology-visualization`

**Completed Tasks**:

- [x] Install and configure D3.js for force-directed graphs
- [x] Create topology page component (src/app/topology/page.tsx)
- [x] Create TopologyGraph visualization component
- [x] Integrate Connect protocol client for audit-correlator
- [x] Implement real-time topology data fetching
- [x] Style topology visualization with responsive layout
- [x] Configure environment variables for audit-correlator endpoint
- [x] Test Connect protocol integration (port 8082)
- [x] Generate TypeScript types from topology protobuf schema
- [x] Implement node and edge rendering with D3.js force simulation

**Deliverables**:

- ✅ src/app/topology/page.tsx (topology page component)
- ✅ src/components/topology/TopologyGraph.tsx (D3.js visualization)
- ✅ src/lib/api/topology-client.ts (Connect protocol client)
- ✅ src/generated/audit/v1/topology_service_pb.ts (generated types)
- ✅ .env.local (environment configuration for port 8082)

**BDD Acceptance**: ✅ Browser displays D3.js force-directed graph with 7 nodes and 11 edges from audit-correlator via Connect protocol at <http://localhost:3002/topology>

**Integration Points**:

- audit-correlator-go: Connect HTTP endpoint at port 8082
- orchestrator-docker: Generated topology configuration (7 nodes, 11 edges)
- protobuf-schemas: topology_service.proto schema

**Next Steps**:

- Commit topology visualization changes
- Create PR documentation for topology feature
- Deploy and verify end-to-end integration

---

## Previous Milestone: TSE-0001.13.0 - Initial Next.js UI with SSE

### 🎨 Milestone TSE-0001.13.0: Initial Next.js UI with Real-Time SSE Integration

**Status**: ✅ **COMPLETED** (2025-10-25)
**Priority**: High
**Branch**: Merged to main
**Commit**: `b6f6cce`

**Completed Tasks**:

- [x] Initialize Next.js 15 + React 19 application
- [x] Configure TypeScript, ESLint, Tailwind CSS
- [x] Implement Clean Architecture layers (Domain, Application, Infrastructure)
- [x] Create SSE client with automatic reconnection
- [x] Build 5 main pages (Dashboard, Market, Trading, Risk, System)
- [x] Implement 3 REST adapters (Market Data, Trading, Risk Monitor)
- [x] Write comprehensive test suite (40+ tests)
- [x] Create documentation (400+ lines)
- [x] Configure environment for backend services

**Deliverables**:

- ✅ Next.js 15 application with React 19
- ✅ SSE client (src/infrastructure/utils/sse-client.ts)
- ✅ REST adapters (src/infrastructure/adapters/)
- ✅ Domain ports (src/application/ports/)
- ✅ UI pages (src/app/)
- ✅ Test suite (40+ unit tests)
- ✅ Documentation (IMPLEMENTATION-SUMMARY.md, SSE-IMPLEMENTATION.md, AGENTS.md)

**BDD Acceptance**: ✅ Browser displays real-time trading ecosystem data with automatic SSE streaming and fallback to polling

**Integration Points**:

- market-data-simulator-go: SSE streams at port 8085
- exchange-simulator-go: REST API at port 8084
- risk-monitor-py: SSE streams at port 8086

---

## Upcoming Milestones

### 📝 Milestone: Git Quality Standards Setup

**Status**: ⏭️ **READY** (2025-10-28)
**Priority**: Medium
**Branch**: `feature/epic-TSE-0002-network-topology-visualization`

**Pending Tasks**:

- [x] Set up .claude/plugins/git_quality_standards plugin
- [x] Create validation scripts (validate-all.sh, create-pr.sh)
- [x] Configure GitHub workflows (pr-checks.yml, validation.yml)
- [x] Set up PR template
- [x] Configure validation exceptions
- [ ] Create TODO.md (this file) ✅ IN PROGRESS
- [ ] Create PR documentation for topology visualization
- [ ] Create PR documentation for initial UI (if not already done)

**Deliverables**:

- ✅ .claude/plugins/git_quality_standards/ (validation framework)
- ✅ scripts/validate-all.sh (repository validation)
- ✅ scripts/create-pr.sh (PR creation helper)
- ✅ .github/workflows/ (CI validation workflows)
- ✅ .validation_exceptions (validation exemptions)
- ⏭️ TODO.md (this file)
- ⏭️ docs/prs/feat-epic-TSE-0002-network-topology-visualization.md

**BDD Acceptance**: Repository validation passes with all quality checks enabled

---

## Project Context

### Component Overview

**Repository**: simulator-ui-js
**Type**: TypeScript/React Web Application (Next.js 15)
**Role**: Browser-based UI for Trading Ecosystem simulation and monitoring
**Architecture**: Clean Architecture with Domain-Driven Design
**Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, D3.js

### Key Features

1. **Real-Time Data Streaming**: SSE client with automatic reconnection and fallback
2. **Network Topology Visualization**: D3.js force-directed graph from audit-correlator
3. **Multi-Service Dashboard**: Market data, trading, risk monitoring, system health
4. **Clean Architecture**: Separation of concerns with ports and adapters
5. **Connect Protocol Integration**: Browser-compatible gRPC client

### Dependencies

- **Backend Services**:
  - audit-correlator-go (8082) - Topology service and audit trail
  - market-data-simulator-go (8085) - Market data SSE streams
  - exchange-simulator-go (8084) - Trading execution REST API
  - risk-monitor-py (8086) - Risk metrics SSE streams
  - trading-system-engine-py (8087) - Trading engine REST API

- **Configuration Services**:
  - orchestrator-docker - Docker compose orchestration and topology generation
  - protobuf-schemas - Shared protocol buffer schemas

### File Structure

```
simulator-ui-js/
├── src/
│   ├── app/                          # Next.js pages (Dashboard, Market, Trading, Risk, Topology)
│   ├── components/                   # React components (TopologyGraph)
│   ├── application/                  # Application layer (ports)
│   ├── domain/                       # Domain layer (entities, services)
│   ├── infrastructure/               # Infrastructure layer (adapters, SSE client)
│   ├── generated/                    # Generated protobuf types
│   ├── hooks/                        # React hooks
│   └── lib/                          # Utilities and API clients
├── docs/                             # Documentation
│   └── prs/                          # Pull request documentation
├── .claude/                          # Claude configuration
│   └── plugins/                      # Git quality standards plugin
├── scripts/                          # Validation and utility scripts
├── .github/                          # GitHub workflows and templates
├── TODO.md                           # This file
└── README.md                         # Project README
```

### Testing Strategy

- **Unit Tests**: Jest for component and utility testing
- **Integration Tests**: Testing SSE client reconnection and fallback
- **Manual Testing**: Browser-based testing with backend services
- **Visual Testing**: D3.js topology visualization verification

### Development Workflow

1. **Branch Naming**: `feature/epic-TSE-XXXX-description`
2. **Commits**: Logical commits with descriptive messages
3. **PR Documentation**: Comprehensive docs in `docs/prs/`
4. **Validation**: Run `scripts/validate-all.sh` before committing
5. **Testing**: Run `npm test` for unit tests

### Environment Configuration

**.env.local** (not committed to git):

```env
# Audit Correlator - Connect Protocol (browser-compatible)
NEXT_PUBLIC_AUDIT_CORRELATOR_URL=http://localhost:8082

# Market Data Service
NEXT_PUBLIC_MARKET_DATA_URL=http://localhost:8085

# Exchange Service
NEXT_PUBLIC_EXCHANGE_URL=http://localhost:8084

# Risk Monitor Service
NEXT_PUBLIC_RISK_MONITOR_URL=http://localhost:8086

# Trading Engine Service
NEXT_PUBLIC_TRADING_ENGINE_URL=http://localhost:8087
```

**.env.local.example** (committed to git):

- Documents all required environment variables
- Includes default ports and service endpoints
- Provides comments for each configuration

### Build and Run

**Development**:

```bash
npm install
npm run dev
# Open http://localhost:3002
```

**Production Build**:

```bash
npm run build
npm start
```

**Testing**:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Validation**:

```bash
bash scripts/validate-all.sh  # Repository quality checks
```

### Integration Notes

**Topology Visualization**:

- Fetches topology from audit-correlator-go via Connect protocol
- Port 8082 (HTTP) - NOT 50052 (gRPC)
- D3.js force-directed graph with 7 nodes and 11 edges
- Real-time updates (future enhancement)

**SSE Streaming**:

- Market data from market-data-simulator-go (8085)
- Risk metrics from risk-monitor-py (8086)
- Automatic reconnection with exponential backoff
- Graceful fallback to polling on connection failure

**REST APIs**:

- Trading execution via exchange-simulator-go (8084)
- Trading engine commands via trading-system-engine-py (8087)
- Health checks for all services

---

## Epic Tracking

### Epic TSE-0001: Foundation Services & Infrastructure

**Status**: ✅ Completed (Initial UI milestone)
**Milestones**:

- TSE-0001.13.0: Initial Next.js UI with SSE ✅ (2025-10-25)

### Epic TSE-0002: Connect Protocol & Network Topology Visualization

**Status**: ⏭️ Ready for merge (Topology visualization complete)
**Milestones**:

- TSE-0002.UI: Network Topology Visualization ✅ (2025-10-27)

---

## Quality Metrics

### Test Coverage

- **Target**: 70% code coverage
- **Current**: 40+ unit tests (SSE client, adapters)
- **Focus Areas**: Infrastructure layer, domain services

### Documentation

- **Implementation Guides**: IMPLEMENTATION-SUMMARY.md, SSE-IMPLEMENTATION.md
- **Architecture**: AGENTS.md (Clean Architecture overview)
- **PR Documentation**: docs/prs/ (comprehensive PR docs)

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **Prettier**: Code formatting (if configured)
- **Git Hooks**: Pre-push validation

---

## Known Issues and Technical Debt

### Current Issues

1. **Markdown Linting**: Some formatting warnings in AGENTS.md (non-blocking)
2. **SSE Fallback**: Polling implementation pending for some endpoints
3. **Error Boundaries**: Not yet implemented in all pages

### Technical Debt

1. **Test Coverage**: Increase from 40+ to 70% coverage
2. **Component Library**: Extract reusable components
3. **State Management**: Consider Redux/Zustand for complex state
4. **Real-Time Updates**: Implement WebSocket or enhanced SSE for topology

### Future Enhancements

1. **Authentication**: Add authentication and authorization
2. **Persistence**: Local storage for user preferences
3. **Offline Mode**: Service worker for offline functionality
4. **Analytics**: User interaction tracking
5. **Accessibility**: WCAG compliance improvements

---

## Notes

### Port Reference

| Service | HTTP Port | gRPC Port | Protocol | Usage |
|---------|-----------|-----------|----------|-------|
| Audit Correlator | 8082 | 50052 | Connect + gRPC | Topology (browser uses 8082) |
| Market Data | 8085 | 50055 | REST + SSE | Market streams |
| Exchange | 8084 | 50054 | REST | Trading execution |
| Risk Monitor | 8086 | 50056 | REST + SSE | Risk metrics |
| Trading Engine | 8087 | 50057 | REST | Trading commands |

**Important**: Browsers MUST use HTTP ports with Connect protocol, not gRPC ports.

### Configuration Updates

When services change:

1. Update .env.local with new service endpoints
2. Regenerate protobuf types if schemas change (`npm run generate:proto`)
3. Update port references in documentation
4. Test all service integrations

### Deployment Considerations

- **Environment Variables**: Configure production URLs in hosting platform
- **CORS**: Ensure backend services allow browser origins
- **API Keys**: Secure sensitive configuration
- **Build Output**: Static export for CDN deployment
- **Service Discovery**: May need dynamic service discovery in production

---

**Last Updated**: 2025-10-28
**Maintainer**: Trading Ecosystem Team
**Status**: Active Development - Topology Visualization Complete
