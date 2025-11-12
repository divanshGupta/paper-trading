import { Router } from 'express';
import { buyStock, sellStock, squaredOffPosition } from '../controllers/trade.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const tradeRouter = Router();

tradeRouter.post('/buy', verifyAuth , buyStock);   
tradeRouter.post('/sell', verifyAuth, sellStock);
tradeRouter.post('/squareoff', verifyAuth, squaredOffPosition);
// tradeRouter.get('/status/:tradeId', getTradeStatusHandler);
// tradeRouter.delete('/cancel/:tradeId', cancelTradeHandler);

export default tradeRouter;