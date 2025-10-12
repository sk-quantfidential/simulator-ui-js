# ANALYSIS — Version 0.2.0

This document tracks architecture, decisions, and technical details for the crypto credit and loan portfolio risk management frontend.

## Files Created/Modified
- package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.js, next-env.d.ts
- jest.config.ts, tests/setup-tests.ts, tests/domain-risk.behavior.test.ts
- public/data/btc-hourly-sample.csv, eth-hourly-sample.csv, sol-hourly-sample.csv
- src/domain/types.ts, src/domain/services/{pricing.ts,correlation.ts,risk.ts}
- src/application/ports/{market-data-port.ts,portfolio-repo-port.ts,risk-engine-port.ts}
- src/application/use-cases/{loans.ts,risk.ts}
- src/infrastructure/utils/csv-loader.ts
- src/infrastructure/adapters/{static-csv-market-data.ts,local-storage-portfolio.ts,mock-risk-engine.ts}
- src/presentation/components/{nav-bar.tsx,metric-card.tsx,ltv-timeline.tsx,correlation-heatmap.tsx}
- src/presentation/hooks/use-portfolio.ts
- src/app/{layout.tsx,page.tsx}
- src/app/{loans,heatmap,scenarios,simulation,events}/page.tsx
- src/app/styles/globals.css

Added this version:
- Updated `src/app/heatmap/page.tsx` to compute correlations from CSV via `StaticCsvMarketData` and `correlation.ts` utilities.
- Added override sliders for BTC-ETH, BTC-SOL, ETH-SOL correlations and a t-DOF control.
 - Added rolling-window selector (7d/30d/90d/1y/3y) for correlations; recalculates from tail of series.
 - Added MPoR VaR panel on dashboard using portfolio weights (by principal) and Gaussian VaR at 99% for 48/72/120h.
 - Added Scenario Lab PD curves (BBB/A/AA) with wrong-way overlays and an LGD distribution chart with stress multiplier.
 - Added Live Portfolio Ticker simulating GBM ticks and updating per-loan LTV states (OK/WARN/CALL/LIQ) in real-time.
 - Added CoinbaseMarketData adapter (server-side) to fetch hourly OHLCV from Coinbase.

## Code Architecture Overview
- Clean Architecture with explicit boundaries:
  - Domain: Pure types + services for pricing, risk, correlation. No framework.
  - Application: Ports (interfaces) + use-cases wiring to ports. Server-action friendly factories.
  - Infrastructure: Adapters implementing ports (CSV market data, LocalStorage repos, Mock Risk Engine) and utilities (CSV parser).
  - Presentation: Next.js App Router pages (prefer server components where possible) and UI components; client-only for localStorage and interactivity.
- `@/*` path alias targets `src/*` for succinct imports.

## Key Components and Responsibilities
- Domain services
  - pricing.ts: margin policy, LTV, band lookup.
  - risk.ts: PD/Wrong-way functions; simple VaR/CVaR; revenue; maintenance probability heuristic.
  - correlation.ts: Pearson correlation and log returns utilities.
- Application ports
  - market-data-port: history + last price access.
  - portfolio-repo-port, event-repo-port: CRUD for loans/events.
  - risk-engine-port: portfolio metrics and scenario runner.
- Infrastructure adapters
  - static-csv-market-data: load OHLCV from `public/data/*.csv` with cache.
  - local-storage-portfolio: localStorage-backed repo for loans + events (client only).
  - mock-risk-engine: placeholder portfolio metrics using domain funcs.
- Presentation
  - NavBar + basic dashboard metric cards.
  - Loans CRUD table + validated form with react-hook-form+zod.
  - CorrelationHeatmap: 3x3 BTC/ETH/SOL matrix.
  - LtvTimeline: Recharts line with margin bands.
  - Events calendar: simple month grid with add/delete.
  - Scenario Lab + Simulation stubs for iteration.

## Libraries and Dependencies
- Next.js 15 App Router, React 18.
- Tailwind CSS for styling.
- Recharts for charts.
- zod + react-hook-form for validation.
- Jest + Testing Library for behavior-first tests.

## Implementation Patterns and Approaches
- Pure domain services with deterministic behavior and light math, designed for unit testing.
- Adapters isolate IO (fetch/localStorage); CSV parsed by a tiny utility.
- Client-side state hooks (`usePortfolio`) encapsulate persistence + aggregates.
- Server actions are set up for use-cases, but storage remains client-side in this demo; risk compute can be lifted to server as adapters evolve.
- Correlation heatmap now loads CSV OHLCV client-side, computes log-returns and Pearson correlations, then applies symmetric overrides from sliders.
 - Rolling windows implemented by taking the last N hours of bars and recomputing returns/matrix.
 - MPoR VaR uses covariance from asset returns and portfolio weights from loan principals; scales by sqrt(horizon hours).
 - Live ticker uses GBM per-asset (configurable sigma) with 1s intervals, recomputing LTV and band states.
 - Scenario PD curves computed across drawdown grid using `wrongWayPd` and base annual PDs; LGD mock distribution scaled by stress factor.

## Code Complexity Assessment
- Domain math intentionally simple to keep POC iteration speed; VaR/CVaR are historical approximations on synthetic returns.
- UI complexity moderate: CRUD forms, table rendering, and a few charts.
- Infrastructure minimal and composable; easy to swap for real APIs.

## Error Handling Approach
- CSV loader throws on fetch errors; UI can catch and display.
- LocalStorage repo guards reads with try/catch and returns defaults.
- Forms validate via zod; invalid states show a generic invalid warning.
- Risk engine mock avoids throwing; returns sensible defaults.

## Security Considerations
- No secrets committed; localStorage only for demo data.
- No user auth in this POC; to be added with API integration.
- All external data sources are local CSVs; future network adapters must validate/parse safely.

## Performance Implications
- CSV cached in-memory per asset; negligible for sample data; for 3y hourly, ensure streaming/workerization.
- Charts render limited points; for large timeframes, downsample.
- Client-only localStorage use avoids server contention; fine for demo.
- Heatmap computation: for 3y hourly data, precompute rolling/downsampled returns or compute on server; current demo uses short samples.
 - MPoR VaR and ticker are O(nAssets^2) computations per update; fine for small assets; consider web workers for heavy data.

## Extensibility and Maintainability Factors
- Ports enable swapping adapters (REST/gRPC/GraphQL) without touching domain/presentation.
- Domain functions are separately testable; add new risk models incrementally.
- UI pages are modular; can evolve to server components with server actions as persistence moves server-side.

---

## Technical Deep Dive

### How Each Piece Works
- CSV Market Data: `StaticCsvMarketData` fetches `/data/*.csv` via `fetchCsv`, parses lines with `parseOhlcv`, and caches per asset.
- LTV + Bands: `pricing.ts` computes collateral USD and LTV; per-asset bands from `marginPolicy` visualize warn/call/liq ranges.
- Risk Metrics (Mock): `MockRiskEngine` aggregates principal, estimates revenue APR, and computes a toy tail distribution for VaR/CVaR; margin-call probabilities are derived from an LTV + volatility heuristic.
- Correlation: `correlation.ts` implements Pearson correlation and log-return extraction; UI heatmap uses a simple color gradient.
  - Wiring: `heatmap/page.tsx` fetches CSV bars for BTC/ETH/SOL, derives log-returns, builds a 3x3 symmetric matrix, and binds sliders for pairwise overrides. Diagonals fixed to 1.
- Loans CRUD: `use-portfolio` manages a list of `Loan` in localStorage with aggregate total principal; `loans/page.tsx` renders a table and a validated form.
- Events: A simple month view grid; events persisted to localStorage, grouped by ISO date.
- Scenario Lab: Parameter inputs wired for future engine hooks; placeholders for PD curves/LGD distributions.

### File Generation Approach
- Hand-authored TypeScript modules and Next.js pages/components.
- Lightweight CSV parser to keep demo dependency-free for data ingestion.

### User Interaction Handling
- React hooks manage local state; forms with react-hook-form + zod for robust validation and clear defaults.
- Simple buttons for CRUD; tooltips and color bands guide risk visualization.
- Sliders for correlation overrides and t-DOF; values clamped to [-1, 1], diagonals fixed.

### State Management Patterns
- Local component state + a small custom hook (`usePortfolio`) for portfolio state with persistence.
- Adapters abstract IO; future move to server actions will centralize state updates.

### Edge Case Handling
- LTV division-by-zero guarded by returning 0 LTV when collateral is zero.
- Correlation returns 0 for degenerate series.
- LocalStorage read failures fall back to defaults without crashing.
- VaR/CVaR handle empty/short arrays safely.

---

## Next Steps (Suggested)
- Hook correlation heatmap to real CSV-derived returns via `StaticCsvMarketData` and `correlation.ts`.
- Implement live market simulation (GBM) and streaming updates to LTV timeline with margin triggers and event flags.
- Build ScenarioLab charts (PD curves per rating, wrong-way overlays) using Recharts Area/Line.
- Add Portfolio Overview Dashboard cards: Risk capital usage, P&L vs Loss waterfall, MPoR VaR bands (48h, 72h, 120h).
- Add Optimization Playground (stub) plotting marginal risk vs. revenue with constraints.
- Migrate persistence to a server adapter (stub REST) and wire server actions.

## Identified Behaviors (Current + Upcoming)
- Loans CRUD persists to localStorage and lists accurately.
- Correlation heatmap reflects computed correlations from CSV and respects override sliders.
- Historical simulation (GBM) generates an LTV time series and displays margin bands.
- Events calendar adds/deletes events and groups them by day.
- Scenario Lab parameters update state and will drive PD/LGD charts (to be implemented).

## Identified Services (Clean Architecture)
- MarketDataPort (implemented: StaticCsvMarketData via public CSVs).
 - MarketDataPort (server): CoinbaseMarketData (public REST hourly candles).
- PortfolioRepoPort (implemented: LocalStoragePortfolioRepo).
- EventRepoPort (implemented: LocalStorageEventRepo).
- RiskEnginePort (implemented: MockRiskEngine; to be replaced by real risk engine service).
\n## Version 0.2.1 — Updates and Tests

Adds finalized implementations and behavior tests for recent features.

### Changes
- Heatmap: rolling-window selection integrated; CSV-based correlations with overrides and t-DOF retained.
- Dashboard: MPoR VaR panel (99% for 48/72/120h) using covariance from returns and portfolio weights.
- Scenario Lab: PD curves (BBB/A/AA) vs drawdowns and LGD distribution chart wired to controls.
- Live Ticker: GBM-driven per-asset updates with per-loan LTV band states.
- Market Data: CoinbaseMarketData adapter for hourly OHLCV (server-side use).

### Behavior Tests Added
- Heatmap behavior: correct correlations from mocked series; override symmetry preserved.
- MPoR VaR behavior: renders non-zero VaR values with mocked returns and portfolio weights.
- Loans CRUD behavior: adding a loan renders in the table; persisted via localStorage.
- Events behavior: adding/deleting events updates the calendar grid.
- Scenarios behavior: charts mount and remain stable across parameter changes.
- Live Ticker behavior: start/pause toggles and LTV/state rows render from simulated ticks.
