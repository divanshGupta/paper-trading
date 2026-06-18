// src/config/corsConfig.js
export const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://frontend:3000",
  "http://10.203.130.13:3000",

  "http://localhost:3001",
  "http://127.0.0.1:3001",
  // Optional: set via Fly secrets
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,

  // Backend domain (required for some Fly upgrade flows)
  "https://backend-proud-haze-8547.fly.dev",
  "http://backend-proud-haze-8547.fly.dev",
].filter(Boolean);
