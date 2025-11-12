import { Server } from "socket.io";
import { registerStockHandlers } from "../websocket/stockTicker.js";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";

let io;

export const initSocket = (server) => {
  console.log("🧩 Initializing socket server...");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // attach middleware BEFORE connection
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.user?.id);
    registerStockHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.user?.id);
    });
  });

  // ✅ return io so it can be used in server.js
  return io;
};

export { io };
