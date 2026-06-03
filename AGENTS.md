# SimTrading — Paper Trading Simulator

A full-stack educational stock trading simulator for Indian markets (NSE/BSE).
Users practice trading with ₹1,00,000 virtual money without real financial risk.

## Live Demo
- Frontend: https://simtrading.vercel.app
- Backend: https://backend-proud-haze-8547.fly.dev

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Auth | Supabase Auth (JWT) |
| Realtime | Socket.IO |
| Deployment | Vercel (frontend), Fly.io (backend) |

## Architecture

\`\`\`
Frontend (Next.js)
├── stores/          Zustand — auth state
├── components/
│   └── providers/   React Context — app data, prices, socket
├── hooks/           Derived data hooks
└── app/             Next.js app router pages

Backend (Express)
├── routes/          API endpoints
├── controllers/     Business logic
├── middlewares/     Auth, rate limiting, error handling
├── services/
│   └── priceEngine  Simulated market price engine
└── prisma/          Database schema + migrations
\`\`\`

## Key Features
- JWT authentication via Supabase
- Real-time stock price simulation (Socket.IO)
- Buy / Sell / Square-off trades
- Portfolio tracking with live P&L
- FIFO-based realized P&L calculation
- Day P&L = unrealized + realized today
- Watchlist with optimistic updates
- Rate limiting on all API routes
- Mobile responsive

## Price Engine
Custom market simulator that runs during IST market hours (9:15–3:30).

- Mean reversion toward fair value per stock
- Volatility profiles per sector (tech, largecap, infra)
- Circuit breakers (10% max single-tick move)
- Occasional news events (2–4x volatility spike)
- Intraday OHLC candle aggregation
- Daily reset of previousClose at market open

## Database Schema
\`\`\`
User         → balance, profile fields
Portfolio    → userId (FK), symbol, quantity, avgPrice
Transaction  → userId (FK), symbol, type, price, realizedPnl
Watchlist    → userId (FK), symbol
\`\`\`
All tables use CASCADE delete on user removal.

## API Endpoints

### Auth
Handled entirely by Supabase — no custom auth endpoints.

### Users
\`\`\`
GET  /api/v1/users/profile     Get/create user profile
PUT  /api/v1/users/profile     Update profile
GET  /api/v1/users/balance     Get wallet balance
\`\`\`

### Trade
\`\`\`
POST /api/v1/trade/buy         Buy stock at live price
POST /api/v1/trade/sell        Sell stock at live price
POST /api/v1/trade/squareoff   Close entire position
\`\`\`

### Portfolio
\`\`\`
GET  /api/v1/portfolio         Holdings with live P&L
\`\`\`

### Transactions
\`\`\`
GET  /api/v1/transactions              Paginated trade history
GET  /api/v1/transactions/realized-pnl FIFO realized P&L
GET  /api/v1/transactions/realized-today Today's realized P&L
\`\`\`

### Market
\`\`\`
GET  /api/v1/market/snapshot   Current prices snapshot
POST /api/v1/market/reset-daily Reset daily prices (admin)
\`\`\`

### Watchlist
\`\`\`
GET    /api/v1/watchlist         Get user watchlist
POST   /api/v1/watchlist/add     Add symbol
DELETE /api/v1/watchlist/remove  Remove symbol
\`\`\`

## Security
- JWT verification on all protected routes
- Rate limiting: 100 req/15min global, 10 req/15min auth
- CORS restricted to known origins
- Helmet.js security headers
- Server-side price validation (client price ignored)
- Cascade deletes prevent orphaned data

## Local Development

\`\`\`bash
# Backend
cd backend
cp .env.example .env     # fill in Supabase credentials
npm install
npx prisma migrate dev
npm run dev              # runs on port 8080

# Frontend  
cd frontend
cp .env.example .env.local
npm install
npm run dev              # runs on port 3000
\`\`\`

## Environment Variables

### Backend
\`\`\`
DATABASE_URL=
SUPABASE_JWT_SECRET=
FRONTEND_URL=
PORT=8080
FORCE_MARKET_OPEN=true   # dev only
\`\`\`

### Frontend
\`\`\`
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
\`\`\`

## Known Limitations
- Price data resets on backend redeploy (Fly.io ephemeral storage)
- Market hours enforced server-side — trades blocked outside 9:15–3:30 IST
- Planned: Replace price engine with real NSE/BSE market feed API

## Roadmap
- [ ] Real market feed API (Upstox/TrueData)
- [ ] Gamification (streaks, badges, leaderboards)
- [ ] Advanced charts (TradingView integration)
- [ ] Intraday vs delivery trade distinction
\`\`\`

# 20-05-26
## Changed Files
- Tab switch re-fetching issue persists
- backend/src/services/priceEngine.js (mean reversion added)
- backend/src/config/stocksData.js (fairValue added)
- frontend/stores/useAuthStore.ts (created)
- frontend/components/providers/AppProvider.tsx (token management)
- frontend/app/(main)/portfolio/page.tsx (P&L calculation)