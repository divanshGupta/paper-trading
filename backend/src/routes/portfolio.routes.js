import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
// import { verifyToken } from '../middlewares/auth.middleware.js';

const portfolioRouter = Router();

portfolioRouter.get('/', authenticateToken, (req, res) => {
    res.json({ 
        message: `Welcome ${req.user.username}, here's your portfolio data.`,
        user: req.user 
    });
});

export default portfolioRouter;