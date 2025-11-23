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

    // Decode Supabase JWT
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // MUST have id + email
    req.user = {
      id: decoded.sub,  // Supabase user UUID (THIS MUST NOT BE UNDEFINED)
      email:
        decoded.email ||
        decoded.user_metadata?.email ||
        decoded?.app_metadata?.email ||
        "unknown",
    };

    if (!req.user.id) {
      console.error("JWT missing sub:", decoded);
      return res.status(401).json({ message: "Invalid token: no user id" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid Supabase token" });
  }
};
