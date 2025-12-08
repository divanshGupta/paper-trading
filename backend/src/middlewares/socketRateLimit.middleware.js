// src/middlewares/socketRateLimit.middleware.js
import logger from "../utils/logger.js";

// Limits and buckets (tune to your usage)
const MESSAGE_LIMIT = 20; // max user messages per second (user actions)
const BUCKET_WINDOW_MS = 1000; // reset window

// In-memory stores (fine for single-instance or small scale; use redis for multiple instances)
const messageBuckets = new Map();

// Events that we consider "user actions" and should be rate-limited.
// Add your domain-specific event names here.
const USER_EVENTS = new Set([
  "buy",
  "sell",
  "place_order",
  "cancel_order",
  "update_profile",
  "add_watch",
  "remove_watch",
  // add any other user-initiated events
]);

/**
 * socketRateLimiter - called during connection to attach a lightweight key
 * This should not ban reconnects; simply set a key for message tracking.
 */
export const socketRateLimiter = (socket, next) => {
  const userId = socket?.user?.id;
  const ip = socket.handshake.address;
  const key = userId || ip || socket.id;

  // attach key for later use
  socket._rateKey = key;

  // ensure a bucket exists
  if (!messageBuckets.has(key)) {
    messageBuckets.set(key, { count: 0, lastReset: Date.now() });
  }

  // Allow connection to continue (do not ban on connect)
  return next();
};

/**
 * socketMessageLimiter - called per event
 * Only rate-limits events classified as USER_EVENTS. Ignores system events.
 */
export const socketMessageLimiter = (socket, eventName) => {
  try {
    // ignore internal engine/socket events
    if (!eventName || !USER_EVENTS.has(eventName)) return;

    const key = socket._rateKey || socket.id;
    let bucket = messageBuckets.get(key);

    const now = Date.now();
    if (!bucket) {
      bucket = { count: 0, lastReset: now };
      messageBuckets.set(key, bucket);
    }

    // reset window
    if (now - bucket.lastReset > BUCKET_WINDOW_MS) {
      bucket.count = 0;
      bucket.lastReset = now;
    }

    bucket.count += 1;

    if (bucket.count > MESSAGE_LIMIT) {
      logger.warn(`⚠️ Rate limit: ${key} sent ${bucket.count} '${eventName}' events in ${BUCKET_WINDOW_MS}ms`);
      // Inform the client politely but do NOT disconnect (avoids silent failures)
      socket.emit("rate-limit", { message: "Too many actions. Slow down a bit." });
    }
  } catch (err) {
    // never throw from limiter
    logger.error("socketMessageLimiter error:", err);
  }
};
