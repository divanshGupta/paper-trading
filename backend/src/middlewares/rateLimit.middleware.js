// middlewares/rateLimiter.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import logger from "../utils/logger.js";

// Generate unique key per user or per IP
const getKey = (req) => {
  if (req.user?.id) return req.user.id;
  return ipKeyGenerator(req); // logged-in users get separate limits
};

// Global API limit (100 requests per minute)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: getKey,
  handler: (req, res) => {
    logger.warn(`⚠️ Global rate limit exceeded: ${getKey(req)}`);
    return res.status(429).json({
      success: false,
      message: "Too many requests. Slow down."
    });
  }
});

// Authentication routes limit (20 per 15 mins)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: getKey,
  handler: (req, res) => {
    logger.warn(`⚠️ Auth rate limit exceeded: ${getKey(req)}`);
    return res.status(429).json({
      success: false,
      message: "Too many login attempts."
    });
  }
});

// Order routes limit (10 trades per 10 seconds)
export const tradeLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  keyGenerator: getKey,
  handler: (req, res) => {
    logger.warn(`⚠️ Order spam blocked: ${getKey(req)}`);
    return res.status(429).json({
      success: false,
      message: "Too many trade requests. Chill 😄"
    });
  }
});
