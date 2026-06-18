import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { allowedOrigins } from "./config/corsConfig.js";
import logger from "./utils/logger.js";
import {
  apiLimiter,
  authLimiter,
  tradeLimiter,
} from "./middlewares/rateLimit.middleware.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import portfolioRouter from "./routes/portfolio.routes.js";
import tradeRouter from "./routes/trade.routes.js";
import marketRouter from "./routes/market.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import candleRouter from "./routes/candle.routes.js";

import { PRICES } from "./services/priceEngine.js";
import { handleMarketOpenReset } from "./services/priceEngine.js";

// Express app
export const app = express();

// If you're behind a proxy (Heroku/Railway/Fly), enable this so req.ip is correct
app.set("trust proxy", true);

// ----------------------
// Security & performance
// ----------------------
// Helmet sets sane security-related headers. Keep this early.
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP here if your app injects inline scripts; enable and tune for tighter security
    crossOriginEmbedderPolicy: false,
  }),
);

// gzip responses
app.use(compression());

// ----------------------
// CORS
// ----------------------
// Use a function to allow Postman / curl (no origin) and restrict browser origins
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server or tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`CORS blocked: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Respond to preflight requests quickly
app.options(/^\/.*$/, cors(corsOptions));

// ----------------------
// Parsers & small middleware
// ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Minimal additional security headers (complements helmet)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY"); // clickjacking
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ----------------------
// Logging
// ----------------------
// Use morgan for HTTP logs; forward to your pino/winston logger
app.use(
  morgan("combined", {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  }),
);

// Quick inline logger for very early debugging (keeps your previous behaviour)
app.use((req, res, next) => {
  // keep concise logs; morgan already records details
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// ----------------------
// Rate limiting
// ----------------------
// Apply global API limiter to /api routes
app.use("/api", apiLimiter);

// Apply specific limiters to auth and trade endpoints
app.use("/api/auth", authLimiter);
app.use("/api/order", tradeLimiter);

// ----------------------
// Health & readiness
// ----------------------
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/ready", (_req, res) => res.status(200).send("ready"));
// Temporarily add this route in your dev environment
app.get("/debug/market-reset", (req, res) => {
  handleMarketOpenReset(); // make sure this is exported or move route into priceEngine
  res.json({ message: "reset fired", sample: PRICES[0] });
});

// ----------------------
// Routes
// ----------------------
// Keep route mounting after parsers & limiters
app.get("/", (_req, res) => {
  res.send("Server is running.");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/trade", tradeRouter);
app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/market", marketRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/watchlist", watchlistRouter);
app.use("/api/v1/candles", candleRouter);

// ----------------------
// 404 handler
// ----------------------
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// ----------------------
// Error handler (keep your implementation)
// ----------------------
app.use(errorHandler);

// Export `app` (server.js will import and create http.Server)

// Short notes and rationale (quick)

// helmet() early: adds many security headers. I disabled CSP by default to avoid breaking apps that inject inline scripts — enable/adjust CSP later.

// trust proxy: necessary on managed platforms; keeps IP and secure cookie logic correct.

// morgan + your logger: morgan streams requests to your app logger instead of console — useful in production logs.

// compression: reduces bandwidth; useful for mobile users.

// options('*') and preflight: ensures preflight requests are handled fast.

// Rate limiters are left where you had them; keep tuning limits for your traffic.

// Health endpoints are useful for probes on platforms like Kubernetes / Railway.
