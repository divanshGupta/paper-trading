import { Router } from "express";
import { getPortfolio } from "../controllers/portfolio.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyAuth, getPortfolio);

export default router;