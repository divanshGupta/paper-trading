import jwt from "jsonwebtoken";

export const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    // decode only; we trust Supabase signature at the edge
    const decoded = jwt.decode(token);
    if (!decoded?.sub) return next(new Error("Invalid token"));

    socket.user = { id: decoded.sub, email: decoded.email ?? null };
    next();
  } catch (e) {
    next(new Error("Auth failure"));
  }
};
