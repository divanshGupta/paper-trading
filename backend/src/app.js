import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRouter from './routes/auth.routes.js';
import testRouter from './routes/test.routes.js';
import userRouter from './routes/user.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import portfolioRouter from './routes/portfolio.routes.js';

export const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// API Routes
app.get('/', (req, res) => {
    res.send(`Server is running.`);
});
// version route for debugging health checks
app.get('/api/v1', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/users/', userRouter);
// app.use('/api/v1/trade/', tradeRouter);
app.use('/api/v1/portfolio/', portfolioRouter);
app.use('/api/v1/test/', testRouter);

app.use(errorHandler); // Error handling middleware


