# Agents Guide — Crypto Credit Risk Engine

This document is the authoritative guide for agents and contributors working in this repo. It defines architecture, conventions, and workflows so you can be effective immediately.

## Architecture (Clean Architecture)
- Layers and dependency direction:
  - Presentation → Application → Domain. Infrastructure implements Application ports.
  - Domain: pure types and logic (no framework, no IO).
  - Application: ports (interfaces) + use-cases orchestrating domain + ports. Prefer server actions for orchestration.
  - Infrastructure: adapters implementing ports (REST/CSV/localStorage/etc.). IO only here.
- Path alias: use `@/...` to import from `src/`.

## Project Layout
- `src/domain` — entities/value-objects and pure services (pricing, risk, correlation, math utils).
- `src/application` — ports and use-cases (server-action friendly factories).
- `src/infrastructure` — adapters, data loaders, caches.
- `src/presentation` — Next.js App Router pages/components/styles; keep components thin.
- `public/data` — CSVs for BTC/ETH/SOL hourly OHLCV (demo).
- `docs` — analysis and roadmap; keep current.
- `tests` — Jest behavior tests.

## Naming & Style
- TypeScript strict mode; prefer explicit types at module boundaries.
- Filenames: kebab-case.ts(x) for components/utilities.
- 2-space indentation; no trailing whitespace; keep functions small and pure where possible.
- UI: Tailwind-only. Dark/war-room aesthetic with high contrast.

## Commands
- Install: `npm install`
- Dev: `npm run dev` (port 3002)
- Build/Start: `npm run build && npm start`
- Lint: `npm run lint`
- Tests: `npm test`, `npm run test:watch`, `npm run test:coverage`

## Testing (Behavior-First)
- Focus on observable outcomes (rendered UI, calculated metrics, state changes), not implementation details.
- Domain: pure unit tests (no mocks).
- Application: use-cases with mocked ports.
- Infrastructure: contract tests against ports.
- Presentation: Testing Library; test flows, not internals.

## Services (Ports)
- `MarketDataPort`: getHistory/getLastPrice.
- `PortfolioRepoPort` and `EventRepoPort`: CRUD persistence.
- `RiskEnginePort`: compute portfolio metrics; run scenario.
- Adapters in use: StaticCsvMarketData, LocalStoragePortfolioRepo, LocalStorageEventRepo, MockRiskEngine.

## Data & Scenarios
- CSV schema: `t,o,h,l,c,v` with `t` in epoch ms.
- Margin policy defaults: {BTC: 70/80/90%, ETH: 65/75/85%, SOL: 60/70/80%}.
- PD base table: BBB 1.5%, A 0.8%, AA 0.3%.
- LGD baseline 30%; slippage: BTC 4%, ETH 7%, SOL 10%.
- MPoR horizons: 48h, 72h, 120h.

## Pull Requests & Commits
- Conventional commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- One logical change per PR; include description, screenshots for UI, and notes on tests/coverage.

## Security & Config
- No secrets in VCS. Use `.env.local` for local configs and document required variables in PRs.
- Validate inputs at boundaries; sanitize external data in adapters.

## Adding Features — Checklist
- Define behavior and data contracts first.
- Add/extend ports in `application/ports` when new IO is needed.
- Implement adapters in `infrastructure/*`; keep side-effects isolated.
- Add domain functions for pure logic; unit-test them.
- Add/extend use-cases; prefer server actions to call them.
- Update presentation with thin components; wire to use-cases/adapters.
- Add behavior tests.
- Update `docs/ANALYSIS.md` and `docs/NEXT_STEPS.md`.

## Behavior Map (Current)
- Loans CRUD persists and lists.
- Correlation Heatmap computes from CSV and respects overrides.
- Simulation page plots LTV and bands from GBM demo.
- Events calendar adds/deletes and groups per day.
- Scenario Lab parameters (charts forthcoming).

Keep this file authoritative and current. More specific AGENTS.md files may appear in subfolders to refine conventions.
