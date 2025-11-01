import { Server } from 'socket.io';
import { registerStockHandlers } from '../websocket/stockTicker.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",  // 👈 must match your Next.js port
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);
    registerStockHandlers(io, socket);  // <-- crucial line

    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
    });
  });
};

export { io };
