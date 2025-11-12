import http from 'http';
import { app } from './app.js';
import { initSocket} from './config/socket.js';
import { PORT } from './config/env.js';
import { startPriceEngine, PRICES } from './services/priceEngine.js';

global.STOCKS = PRICES;

global.STOCKS = PRICES;

const server = http.createServer(app);

const io = initSocket(server);

// ✅ Start live ticker
startPriceEngine(io);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("💹 Price engine initialized, broadcasting every 2s...");
});

// const startApp = async () => {
//     try {
//         // 1. AWAIT the database connection. The message will print here.

//         // 2. Start the Express server ONLY after a successful DB connection
//         server.listen(PORT, () => {
//             console.log(`✅ Server running on port ${PORT}`);
//         });
//     } catch (error) {
//         console.error("❌ Failed to start application due to a database error:", error.message);
//         process.exit(1); 
//     }
// };

// startApp(); // Execute the application start function

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);
  server.close(() => process.exit(1)); // graceful shutdown
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Handle termination signals (like Ctrl+C or Docker stop)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('🟢 Process terminated!');
  });
});