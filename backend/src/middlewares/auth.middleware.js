import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verify using Supabase JWT secret (from your Supabase project settings)
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: "Invalid Supabase token" });
    }

    // ✅ Attach user info to request
    req.user = {
      id: decoded.sub, // Supabase UUID
      email: decoded.email || decoded.user_metadata?.email || "unknown",
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid Supabase token signature" });
    }
    return res.status(500).json({ message: error.message });
  }
};
