export const allowedOrigins = [
  'http://localhost:3000',   // Local development
  'http://frontend:3000',    // Docker internal network
  'http://127.0.0.1:3000',    // Alternative local access
    process.env.FRONTEND_URL,    // Vercel frontend URL
].filter(Boolean); // removes undefined
