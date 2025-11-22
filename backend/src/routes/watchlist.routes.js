// backend/src/routes/watchlist.routes.js
import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
  toggleWatchlist
} from "../controllers/watchlist.controller.js";

const watchlistRouter = Router();

watchlistRouter.get("/", verifyAuth, getWatchlist);

watchlistRouter.post("/add", verifyAuth, addToWatchlist);

watchlistRouter.delete("/remove", verifyAuth, removeFromWatchlist);

watchlistRouter.get("/check/:symbol", verifyAuth, checkWatchlist);

watchlistRouter.post("/toggle", verifyAuth, toggleWatchlist);


export default watchlistRouter;