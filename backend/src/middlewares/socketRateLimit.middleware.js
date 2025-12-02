import logger from "../utils/logger.js";

const MESSAGE_LIMIT = 10;       // max messages in 1 second
const RECONNECT_LIMIT = 10;     // max reconnect attempts in 1 minute
const BAN_TIME = 60 * 1000;     // ban user for 60 seconds

// Track message frequency per user
const messageBuckets = new Map();

// Track reconnect attempts
const reconnectTracker = new Map();

// Track banned users
const bannedUsers = new Map();

export const socketRateLimiter = (socket, next) => {
  const userId = socket?.user?.id;
  const ip = socket.handshake.address;
  const key = userId || ip;

  // 🚫 Check ban
  const bannedUntil = bannedUsers.get(key);
  if (bannedUntil && Date.now() < bannedUntil) {
    logger.warn(`🚫 Socket blocked due to ban: ${key}`);
    return next(new Error("Too many requests. Try again later."));
  }

  // Track reconnect attempts
  const now = Date.now();
  const reconnectData = reconnectTracker.get(key) || { count: 0, last: now };

  if (now - reconnectData.last < 60 * 1000) {
    reconnectData.count++;
  } else {
    reconnectData.count = 1;
  }

  reconnectData.last = now;
  reconnectTracker.set(key, reconnectData);

  if (reconnectData.count > RECONNECT_LIMIT) {
    bannedUsers.set(key, now + BAN_TIME);
    logger.warn(`⛔ Reconnect flood detected. User banned: ${key}`);
    return next(new Error("Reconnect spam detected."));
  }

  // Initialize message bucket
  if (!messageBuckets.has(key)) {
    messageBuckets.set(key, {
      count: 0,
      lastReset: now,
    });
  }

  socket._rateKey = key; // Store for message handler
  return next();
};

export const socketMessageLimiter = (socket) => {
    console.log("Limiter triggered for socket:", socket._rateKey); // ← TEST LOG
  const key = socket._rateKey;
  const bucket = messageBuckets.get(key);
  const now = Date.now();

  // reset bucket every second
  if (now - bucket.lastReset > 1000) {
    bucket.count = 0;
    bucket.lastReset = now;
  }

  bucket.count++;

  if (bucket.count > MESSAGE_LIMIT) {
    logger.warn(`⚠️ Spam detected: ${key} sent too many socket messages.`);
    socket.emit("rate-limit", { message: "You're sending too many messages." });
  }
};


