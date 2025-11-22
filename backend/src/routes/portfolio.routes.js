import { Router } from "express";
import { getPortfolio } from "../controllers/portfolio.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const portfolioRouter = Router();

portfolioRouter.get("/", verifyAuth, getPortfolio);

export default portfolioRouter;