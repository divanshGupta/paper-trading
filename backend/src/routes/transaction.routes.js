import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { getRealizedPnL, getTransactions } from "../controllers/transaction.controller.js";

const transactionRouter = Router();

transactionRouter.get("/orders", verifyAuth, getTransactions);
transactionRouter.get("/realized-pnl", verifyAuth, getRealizedPnL);

export default transactionRouter;