# SimTrading Repository Guide

This file is the primary implementation guide for agents and developers working in this
repository. It describes the system as it exists in code, including known mismatches and
technical debt. Do not assume older README or API notes are exact without checking the routes.

## Project Overview

SimTrading is a full-stack educational paper-trading simulator for Indian stocks. Users
authenticate with Supabase, receive an initial virtual cash balance of INR 100,000, and can
practice buying and selling a fixed catalog of simulated NSE/BSE-style equities without real
financial risk.

The application has two independently deployed services:

- `frontend/`: a Next.js App Router application deployed to Vercel.
- `backend/`: an Express API and Socket.IO server deployed to Fly.io.

The backend owns all authoritative trading state:

- user cash balance
- current holdings
- transaction history
- watchlists
- live simulated prices
- server-side trade price selection

The frontend owns presentation and derived live calculations. It never controls the execution
price: trade controllers ignore any client-supplied price and use the current in-memory price
engine value.

Live production URLs:

- Frontend: `https://simtrading.vercel.app`
- Backend: `https://backend-proud-haze-8547.fly.dev`

## System Architecture

```text
Browser
  |
  | Supabase Auth SDK: sign up, sign in, refresh, persisted session
  | HTTP Bearer JWT
  | Socket.IO auth token
  v
Next.js frontend (Vercel)
  |
  | REST requests to /api/v1/*
  | Socket.IO subscription and realtime events
  v
Express + Socket.IO backend (Fly.io)
  |
  +-- Prisma ORM ----------------------> PostgreSQL / Supabase
  |
  +-- In-memory price engine ----------> src/storage/prices.json
                                        Fly persistent volume in production
```

### Frontend Architecture

The root layout wraps every route with `ClientProviders`:

```text
ThemeProvider
  SocketProvider
    PriceFeedProvider
      AppProvider
        ToastProvider
        page content
```

The intended ownership boundaries are:

- `useAuthStore`: Supabase access token, user ID, and initial auth readiness.
- `SocketProvider`: socket connection lifecycle and socket auth token.
- `PriceFeedProvider`: live stock snapshots, tick updates, price flash state, symbol lookup.
- `AppProvider`: profile, holdings, realized P&L today, watchlist, and simple trade actions.
- `useEnrichedStocks`: combines live prices with holdings for UI-ready stock data.
- Page components: page-specific filters, pagination, modals, and derived totals.

### Backend Architecture

The backend follows a route-controller-service structure:

```text
server.js
  |
  +-- app.js
  |    +-- security, CORS, parsing, logging, rate limiting
  |    +-- health endpoints
  |    +-- /api/v1 route modules
  |    +-- 404 and error middleware
  |
  +-- Socket.IO initialization
       +-- socket auth
       +-- user-specific rooms
       +-- price subscription handlers
       +-- price engine startup
```

REST controllers use Prisma for persistent user data. The price engine is a separate in-memory
system whose state is periodically serialized to JSON.

## Tech Stack

### Frontend

| Concern | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 3, CSS custom properties |
| Auth client | `@supabase/supabase-js` |
| Realtime client | `socket.io-client` |
| Global state | Zustand, React Context |
| Animation | Framer Motion |
| Charts | Lightweight Charts, Recharts, custom sparkline components |
| Icons | Lucide React |
| Notifications | Sonner |
| HTTP | Native `fetch`; Axios exists mainly for health checks |
| Quality tools | TypeScript strict mode, ESLint, Prettier |

### Backend

| Concern | Technology |
| --- | --- |
| Runtime | Node.js 20, ES modules |
| HTTP server | Express 5 |
| Realtime server | Socket.IO |
| Database ORM | Prisma 6 |
| Database | PostgreSQL, hosted through Supabase in production |
| Auth verification | Supabase JWT verified with `jsonwebtoken` |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Pino, pino-pretty, Morgan |
| Date/time | Native `Date`, Moment Timezone |
| Deployment | Docker, Fly.io |

## Folder Structure

```text
trading-simulator/
|-- AGENTS.md                    Existing repository instructions and product summary
|-- CLAUDE.md                    This implementation guide
|-- README.md                    General project documentation
|-- docker-compose.yml           Local production-style frontend/backend containers
|-- backup.sql                   Database backup artifact
|-- data/                        Local PostgreSQL data directory; not application source
|
|-- backend/
|   |-- Dockerfile              Node 20 backend image
|   |-- fly.toml                Fly.io app, release migration, volume, machine settings
|   |-- nodemon.json            Development watcher configuration
|   |-- package.json
|   |-- prisma/
|   |   |-- schema.prisma       Current relational schema
|   |   `-- migrations/         Ordered database migrations
|   `-- src/
|       |-- server.js           HTTP server and process lifecycle
|       |-- app.js              Express middleware and route mounting
|       |-- config/             CORS, environment, socket, and stock seed data
|       |-- controllers/        User, trade, portfolio, transaction, market, watchlist logic
|       |-- middlewares/        HTTP auth, socket auth, rate limiting, error handling
|       |-- routes/             Express route declarations
|       |-- services/           Price engine and JSON price persistence
|       |-- storage/            Persisted `prices.json`
|       |-- utils/              Prisma client, logger, market time, stock helpers
|       |-- websocket/          Socket price subscription handlers
|       `-- generated/          Stale/generated Prisma artifact; do not treat as source of truth
|
`-- frontend/
    |-- Dockerfile              Next.js production image
    |-- next.config.ts          Strict mode and standalone output
    |-- tailwind.config.ts      Theme token mappings
    |-- tsconfig.json           Strict TS and `@/*` alias
    |-- package.json
    |-- app/
    |   |-- layout.tsx          Root metadata and provider mounting
    |   |-- globals.css         Tailwind imports and shared animations
    |   |-- theme.css           Light/dark CSS color tokens
    |   |-- (public)/           Landing and login routes
    |   |-- (main)/             Dashboard, stocks, portfolio, orders, P&L, watchlist, profile
    |   `-- auth/callback/      Supabase callback route
    |-- components/
    |   |-- providers/          App, socket, price, theme, toast providers
    |   |-- stocks/             Stock lists, cards, filters, sorting, watchlist control
    |   |-- portfolio/          Portfolio summary, insights, holdings table
    |   |-- trade/              Buy/sell panel and trade modal
    |   |-- orders/             Transaction history UI
    |   |-- chart/              Chart and sparkline components
    |   `-- ui/                 Shared UI primitives and market status UI
    |-- hooks/                  Auth guard and derived market/stock hooks
    |-- lib/                    Socket singleton, Axios client, backend health check
    |-- stores/                 Zustand stores
    |-- types/                  Shared frontend TypeScript types
    `-- utils/                  Supabase browser client and IST market-time helpers
```

## Data Model

The Prisma schema in `backend/prisma/schema.prisma` is the database source of truth.

### `User`

- Internal integer primary key.
- `supabaseId` UUID is the external identity and the relation key used by other tables.
- `email` and optional `phone` are unique.
- `balance` defaults to `100000.00`.
- Optional profile fields: name, date of birth, gender, address, father's name.

### `Portfolio`

- One current holding per `(userId, symbol)`.
- Stores quantity and weighted average purchase price.
- Deleted when quantity reaches zero.
- Cascades on user deletion.

### `Transaction`

- Immutable trade history rows with type `BUY` or `SELL`.
- Stores quantity, execution price, total, and optional realized P&L.
- Cascades on user deletion.

### `Watchlist`

- One row per `(userId, symbol)`.
- Cascades on user deletion.

## API Flow

### Authentication Flow

1. The browser signs up or signs in directly through Supabase Auth.
2. Supabase persists and refreshes the browser session.
3. `useAuthStore` reads the session and stores the access token in memory.
4. Protected REST requests send `Authorization: Bearer <token>`.
5. `verifyAuth` verifies the JWT with `SUPABASE_JWT_SECRET` using HS256 and maps `sub` to
   `req.user.id`.
6. `GET /api/v1/users/profile` upserts the corresponding application `User` row on first use.
7. `SocketProvider` sends the same access token in the Socket.IO handshake auth object.

There are no custom login, signup, refresh, or logout endpoints in the Express backend.

### Initial Application Load

1. `ClientProviders` calls `useAuthStore.initialize()`.
2. `SocketProvider` connects only when an authenticated Supabase session exists.
3. `PriceFeedProvider` emits `price:subscribe` after socket connection.
4. The backend sends a full `price:snapshot`.
5. `AppProvider.refresh()` fetches profile, portfolio, and realized P&L today in parallel, then
   fetches the watchlist.
6. UI hooks combine holdings and prices into derived values.

### Live Price Flow

1. The first authenticated socket connection starts the price engine.
2. The engine loads `src/storage/prices.json`, falling back to `DEFAULT_PRICES`.
3. During market hours, it attempts a new tick every two seconds.
4. Only changed symbols are emitted as `price:ticks`.
5. `PriceFeedProvider` merges tick diffs into its current array and creates short UI flash states.
6. The engine saves all prices to JSON every five seconds.

REST clients can also read the current snapshot from `GET /api/v1/market/prices`.

### Trade Flow

1. A frontend trade component sends `symbol` and `quantity`.
2. The backend blocks the request when `isMarketOpen()` is false.
3. The backend finds the current stock in the in-memory price engine.
4. The server calculates execution price and total; client price is not trusted.
5. Buy updates or creates the holding, reduces balance, and creates a `BUY` transaction.
6. Sell reduces or deletes the holding, increases balance, and creates a `SELL` transaction.
7. The controller emits `portfolio:update` to the authenticated user's Socket.IO room.
8. The frontend merges the new holdings, balance, and optional realized-today value.

### Watchlist Flow

`AppProvider` owns watchlist state. It updates the UI optimistically, calls the add/remove API, and
rolls back when the request fails.

### Profile Flow

The backend profile endpoint is both the application-user bootstrap and the profile read endpoint.
Profile updates whitelist fields before passing them to Prisma.

## REST API Reference

These are the actual mounted routes in the current codebase.

### Public and Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | Basic server response |
| `GET` | `/health` | No | JSON health response |
| `GET` | `/ready` | No | Readiness response |
| `GET` | `/api/v1/market/prices` | No | Current in-memory price snapshot |

### Users

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users/profile` | Bearer JWT | Get or create application user profile |
| `PUT` | `/api/v1/users/profile` | Bearer JWT | Update allowed profile fields |
| `GET` | `/api/v1/users/balance` | Bearer JWT | Get wallet balance |

### Trades

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/trade/buy` | Bearer JWT | Buy a stock at the server live price |
| `POST` | `/api/v1/trade/sell` | Bearer JWT | Sell part or all of a holding |
| `POST` | `/api/v1/trade/squareoff` | Bearer JWT | Intended to close an entire position |

### Portfolio and Transactions

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/portfolio` | Bearer JWT | Holdings enriched with server live values |
| `GET` | `/api/v1/transactions/orders` | Bearer JWT | Paginated transaction history |
| `GET` | `/api/v1/transactions/realized-pnl` | Bearer JWT | FIFO realized P&L grouped by symbol |
| `GET` | `/api/v1/transactions/realized-today` | Bearer JWT | FIFO realized P&L for today's IST sells |

### Watchlist and Market Administration

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/watchlist` | Bearer JWT | Get watchlist symbols |
| `POST` | `/api/v1/watchlist/add` | Bearer JWT | Add a symbol |
| `DELETE` | `/api/v1/watchlist/remove` | Bearer JWT | Remove a symbol |
| `GET` | `/api/v1/watchlist/check/:symbol` | Bearer JWT | Check membership |
| `POST` | `/api/v1/watchlist/toggle` | Bearer JWT | Toggle membership |
| `POST` | `/api/v1/market/reset-daily` | Bearer JWT | Reset daily price fields |

## Socket.IO Contract

Socket path: `/socket.io`

Client handshake:

```ts
socket.auth = { token: supabaseAccessToken }
```

### Client to Server

| Event | Payload | Purpose |
| --- | --- | --- |
| `price:subscribe` | none | Request the first full snapshot once per socket |
| `price:resubscribe` | none | Request another full snapshot |

### Server to Client

| Event | Payload | Purpose |
| --- | --- | --- |
| `price:snapshot` | full stock array | Initial/current market state |
| `price:ticks` | changed stock array | Diff-only live price updates |
| `market:status` | `{ open: boolean }` | Periodic market status |
| `portfolio:update` | holdings, balance, optional realizedToday | User-specific post-trade update |
| `rate-limit` | message object | Socket action-rate warning |

## State Management

### Active State Sources

| State | Owner | Notes |
| --- | --- | --- |
| Supabase token and user ID | `useAuthStore` | In-memory Zustand state synchronized from Supabase |
| Socket lifecycle | `SocketProvider` | Connects, disconnects, refreshes auth, checks backend health |
| Live stock prices | `PriceFeedProvider` | Full snapshot plus diff updates |
| Price lookup | `PriceFeedProvider.bySymbol()` | Memoized map for component calculations |
| Profile and holdings | `AppProvider` | Fetched from REST and updated by socket events |
| Realized P&L today | `AppProvider` | Used in dashboard and portfolio day P&L |
| Watchlist | `AppProvider` | Optimistic updates |
| Server unavailable UI | `useServerErrorStore` | Set by health checks after socket errors |
| Page filters and modals | Individual pages/components | Local React state |

### Derived State

`useEnrichedStocks` combines live price data with current holdings. Portfolio pages separately
derive invested value, current value, unrealized P&L, ROI, and day P&L on each price update.

Avoid persisting derived values unless there is a clear backend reporting requirement.

### Legacy or Overlapping State

The following code exists but is not part of the active root provider tree:

- `components/providers/UserProvider.tsx`
- `stores/useMarketStore.ts`

`lib/apiClient.ts` is active for backend health checks, but its local-storage token behavior does
not match the current Supabase token flow used elsewhere.

## Important Business Logic

### Price Engine

The simulated market catalog lives in `backend/src/config/stocksData.js`. Each stock has metadata
such as symbol, name, sector, price, previous close, fair value, market cap, P/E, and beta.

Current engine behavior:

- Loads persisted prices or seeds defaults.
- Ticks every two seconds while the market is open.
- Applies symbol volatility profiles.
- Occasionally creates temporary two-to-four-times volatility news events.
- Caps a single tick at a 10% move and temporarily locks a symbol after a capped move.
- Tracks daily high, low, volume, and per-minute intraday candles.
- Emits only changed symbols.
- Saves state to disk every five seconds.
- Resets previous close, open, high, low, volume, and candles on a detected closed-to-open
  transition.

`fairValue` and `MEAN_REVERSION_STRENGTH` are present but mean reversion is not currently applied
in the tick calculation.

### Market Hours

Both frontend and backend calculate Indian market hours as 09:15 through 15:30 in
`Asia/Kolkata`. The backend is authoritative for trade acceptance.

The current implementation checks time of day only. It does not check weekdays, exchange
holidays, or special sessions.

### Buy Logic

- Requires a symbol and positive quantity.
- Uses the server-side live price.
- Rejects insufficient balance.
- Creates a holding or updates its weighted average price.
- Deducts the cost from user balance.
- Creates a `BUY` transaction.

Weighted average price:

```text
newAvg = ((oldAvg * oldQty) + (buyPrice * buyQty)) / (oldQty + buyQty)
```

### Sell Logic

- Requires a symbol and positive quantity.
- Uses the server-side live price.
- Rejects quantities larger than the holding.
- Reduces or deletes the holding.
- Credits sale proceeds to balance.
- Stores realized P&L based on the holding's weighted average price.
- Creates a `SELL` transaction.

Stored realized P&L:

```text
realizedPnl = (sellPrice - holdingAvgPrice) * sellQty
```

### FIFO Reporting

The realized P&L report does not rely on the stored `realizedPnl` field. It replays all
transactions in chronological order and matches sells against buy lots using FIFO.

This means stored sell P&L and reported FIFO P&L can differ.

### Day P&L

There are multiple day-P&L calculations:

- Backend portfolio response: `(livePrice - previousClose) * quantity`.
- Dashboard: open-position movement from previous close plus realized P&L today.
- Portfolio page: uses `max(avgPrice, previousClose)` as the open-position baseline, then adds
  realized P&L today.

Treat day-P&L changes as cross-cutting work and reconcile all implementations together.

## Deployment Setup

### Frontend: Vercel

The frontend is intended for Vercel deployment. There is no checked-in `vercel.json`; Vercel
uses the Next.js defaults and the `frontend/` project root.

`next.config.ts` enables:

- React strict mode
- standalone output

Required Vercel environment variables are the frontend public variables listed below.

### Backend: Fly.io

`backend/fly.toml` configures:

- Fly app: `backend-proud-haze-8547`
- Primary region: Singapore (`sin`)
- Internal port: `8080`
- HTTPS enforcement
- one always-running machine
- Prisma migration release command: `npx prisma migrate deploy`
- persistent volume `prices_data` mounted at `/app/src/storage`

The Fly volume is important because the price engine persists `prices.json` there.

### Docker

The root `docker-compose.yml` builds both services:

- backend exposed on `8080`
- frontend exposed on `3000`
- backend storage bind-mounted from `backend/src/storage`

The compose frontend public API and socket URLs are `http://localhost:8080`, because these values
are used by the browser, not by the frontend container itself.

## Environment Setup

### Backend Variables

Required by active backend behavior:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=
DIRECT_URL=
SUPABASE_JWT_SECRET=
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_2=
```

Variables referenced by environment utilities but not currently required by the active request
path:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=
```

`FORCE_MARKET_OPEN=true` appears in the example environment file but is not used by the current
market-time implementation.

Notes:

- Prisma schema requires both `DATABASE_URL` and `DIRECT_URL`.
- `verifyAuth` requires `SUPABASE_JWT_SECRET`.
- `FRONTEND_URL` and `FRONTEND_URL_2` extend the CORS allowlist.
- Do not expose service-role secrets to the frontend.

### Frontend Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

All frontend variables are public browser configuration. Never put private Supabase keys in
`NEXT_PUBLIC_*` variables.

## Developer Workflows

### Install Dependencies

Run installs separately because the repository has independent frontend and backend packages:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Database Setup and Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

For production-like migration behavior:

```bash
npx prisma migrate deploy
```

When changing the schema:

1. Edit `backend/prisma/schema.prisma`.
2. Create a migration with `npx prisma migrate dev --name <description>`.
3. Regenerate Prisma client if needed.
4. Check relation behavior and decimal precision carefully.

### Run Locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. The backend listens on `http://localhost:8080`.

### Run with Docker Compose

```bash
docker compose up --build
```

### Frontend Validation

```bash
cd frontend
npm run lint
npm run build
```

### Backend Validation

There is currently no backend lint or test script. At minimum:

```bash
cd backend
node --check src/server.js
npx prisma validate
```

Then exercise health, auth, trade, portfolio, and socket flows manually.

### Testing Status

No automated test suite is currently present. Changes to trading, P&L, auth, or realtime behavior
should be treated as high-risk and manually verified until tests are added.

## Coding Conventions Inferred from the Codebase

### General

- Keep frontend and backend concerns separate; do not import code across package boundaries.
- Use ES modules on the backend.
- Use `async`/`await` for I/O.
- Keep API routes thin and put business logic in controllers or services.
- Use Prisma as the database access layer.
- Use uppercase stock symbols consistently.
- Convert Prisma `Decimal` values to numbers before arithmetic or JSON-oriented UI use.
- Round money calculations to two decimals at backend boundaries.
- Use server-side live prices for all executions.

### Frontend

- Use TypeScript strict mode and the `@/*` path alias.
- Add `"use client"` to components that use hooks, browser APIs, Supabase, or sockets.
- Prefer shared types from `frontend/types/index.ts`.
- Use Tailwind utility classes and theme tokens such as `bg-bg-surface`, `text-text`,
  `text-positive`, and `border-border`.
- Use CSS variables in `app/theme.css` for light/dark theme colors.
- Keep global server-backed application state in providers or Zustand, and page-only state local.
- Prefer `useMemo` for derived portfolio/price calculations that run on every tick.
- Use Sonner toasts for user-facing mutation success and failure.
- Preserve mobile and desktop variants when changing trading tables or stock lists.

The repository is stylistically mixed: Prettier requests single quotes and no semicolons, while
many current files use double quotes and semicolons. Match the surrounding file unless performing
a deliberate formatting pass.

### Backend

- Mount new APIs under `/api/v1`.
- Protect user-specific routes with `verifyAuth`.
- Use `req.user.id` as the Supabase UUID relation key.
- Use `logger` for production-relevant logs instead of adding new `console` calls.
- Keep socket emits non-fatal to REST request success.
- Use transactions for multi-table financial mutations.
- Validate symbols and quantities before database writes.

## Current Technical Debt

This section is intentionally direct. These are current implementation issues, not future feature
ideas.

### Critical Trading and Security Issues

- `squaredOffPosition` references `symbol` without reading it from `req.body`, so the square-off
  endpoint currently fails before it can close a position.
- Socket authentication uses `jwt.decode()` without signature verification. A forged token with a
  chosen `sub` could join another user's room and receive user-specific socket updates.
- Buy and sell operations perform holding, balance, and transaction writes outside a Prisma
  transaction. Partial failures and concurrent requests can create inconsistent financial state.
- Buy uses read-then-create/update logic despite a unique `(userId, symbol)` constraint, creating a
  race under concurrent buys.

### Business Logic Inconsistencies

- Sell transactions store weighted-average realized P&L, while realized-P&L reports recalculate
  FIFO P&L. These values can disagree.
- Day P&L is calculated differently in backend portfolio responses, dashboard, portfolio page, and
  socket updates.
- Market-hours logic ignores weekends and holidays. The UI text claims Monday-Friday behavior that
  the code does not enforce.
- `FORCE_MARKET_OPEN` is documented but unused.
- `fairValue` and `MEAN_REVERSION_STRENGTH` are present, but mean reversion is not implemented.
- Price-engine open-boost time uses the server's local timezone rather than explicitly using IST.
- `initializePrices()` contains unreachable startup-reset code after an early return and references
  an undefined `loaded` variable in that unreachable block.

### API and Authorization Issues

- The trade-specific rate limiter is mounted at `/api/order`, but trade routes are mounted at
  `/api/v1/trade`, so the intended trade limiter is not applied.
- `/api/v1/market/reset-daily` requires authentication but has no admin authorization check.
- Request validation is mostly ad hoc; `express-validator` and `zod` are installed but not used.
- Watchlist mutation endpoints do not normalize or validate stock symbols against the catalog.
- Error response shapes are inconsistent across controllers.

### Frontend State and Fetching Issues

- Auth/session reads, auth listeners, and REST wrappers are duplicated across providers, pages, and
  trade components.
- `UserProvider` is not mounted and calls the incorrect `/api/v1/user/profile` path.
- `useMarketStore` duplicates price-feed behavior but is not used by the active provider tree.
- `apiClient` looks for `localStorage.sb_token`, while the current Supabase flow does not write that
  key. Its response interceptor also treats HTTP 400 as token expiry.
- `AppProvider` declares `lastFetched` as a local variable, so its cache behavior is fragile across
  renders and callback recreation. This relates to the known tab-switch refetch issue.
- `AppProvider` checks for a fetch response status of `0`, but native `fetch` throws on network
  failure instead of returning status `0`.
- Multiple trade UIs have separate request and error-handling implementations.
- Orders show a loading skeleton when there are genuinely zero transactions, so the empty state is
  ambiguous.
- Frontend types contain duplicate `Holding` declarations with different `avgPrice` optionality.

### Realtime and Price Persistence Issues

- The price engine starts only after the first authenticated socket connection. A REST-only client
  does not start price movement.
- The socket message limiter emits warnings but does not block the over-limit action.
- Socket rate-limit buckets are in memory and are not cleaned up or shared across instances.
- JSON persistence uses synchronous filesystem reads and writes in the server process.
- Price state is suitable for a single backend instance with a shared volume, not horizontal
  scaling.
- Persisted price storage and the checked-in `prices.json` can become large because each symbol
  carries intraday candle history.

### Repository and Operations Issues

- No automated tests cover financial mutations, FIFO matching, auth, market time, or socket flows.
- Backend logging mixes Pino and `console`, and Pino pretty transport is enabled in all
  environments.
- `backend/src/generated/` appears stale relative to the current Prisma schema and should not be
  used as a source of truth.
- The backend `.env.example` omits variables required by the Prisma schema and environment utility,
  including `DIRECT_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE`.
- Several installed backend dependencies appear unused, increasing maintenance surface.
- The root `data/` directory contains a local PostgreSQL data cluster and should not be treated as
  portable source code.
- API documentation in older files uses stale paths such as `/market/snapshot` and
  `/transactions`; verify route files before integrating.

## Safe Change Checklist

Before completing a change:

1. Confirm the actual route path in `backend/src/routes/`.
2. Confirm auth requirements and the Supabase UUID relation key.
3. For trading changes, verify balance, holding, and transaction writes remain consistent.
4. For P&L changes, reconcile backend reports, dashboard, portfolio page, and socket payloads.
5. For price changes, verify snapshot shape and diff shape remain compatible with
   `PriceFeedProvider`.
6. For frontend UI changes, check both mobile and desktop render paths.
7. Run frontend lint/build and Prisma validation where applicable.
8. Manually verify authenticated REST and socket behavior because automated coverage is absent.

## Planned Product Direction

The existing roadmap includes:

- replacing the simulated engine with a real NSE/BSE market-feed provider
- gamification such as streaks, badges, and leaderboards
- more advanced charting
- explicit intraday versus delivery trade distinction

When implementing these, preserve the server-authoritative execution model and avoid coupling the
frontend directly to a vendor-specific market-feed shape.
