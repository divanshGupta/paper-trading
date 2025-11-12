import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import userRouter from './routes/user.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import portfolioRouter from './routes/portfolio.routes.js';
import tradeRouter from './routes/trade.routes.js';
import marketRouter from './routes/market.routes.js';
import transactionRouter from './routes/transaction.routes.js';

export const app = express();

// Configure CORS for both local development and Docker environments
const allowedOrigins = [
  'http://localhost:3000',   // Local development
  'http://frontend:3000',    // Docker internal network
  'http://127.0.0.1:3000'    // Alternative local access
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply middleware
app.use(cors(corsOptions));
app.use(morgan('dev'));

// Increase JSON payload limit and ensure JSON parsing is before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for handling refresh tokens in cookies if needed
app.use(cookieParser());

// Add basic security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.get('/', (req, res) => { res.send(`Server is running.`);});
// version route for debugging health checks
app.get('/api/v1', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));
app.get("/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach(mw => {
    if (mw.route) routes.push(mw.route.path);
    if (mw.name === 'router') {
      mw.handle.stack.forEach(handler => {
        if (handler.route) routes.push(handler.route.path);
      });
    }
  });
  res.json({ routes });
});

app.use('/api/v1/users/', userRouter);
app.use('/api/v1/trade/', tradeRouter);
app.use('/api/v1/portfolio/', portfolioRouter);
app.use('/api/v1/market/', marketRouter);
app.use('/api/v1/transactions/', transactionRouter);

app.use(errorHandler); // Error handling middleware


