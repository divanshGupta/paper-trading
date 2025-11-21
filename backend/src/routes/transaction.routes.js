import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { getRealizedPnL, getRealizedToday, getTransactions } from "../controllers/transaction.controller.js";

const transactionRouter = Router();

transactionRouter.get("/orders", verifyAuth, getTransactions);
transactionRouter.get("/realized-pnl", verifyAuth, getRealizedPnL);
transactionRouter.get("/realized-today", verifyAuth, getRealizedToday)

export default transactionRouter;