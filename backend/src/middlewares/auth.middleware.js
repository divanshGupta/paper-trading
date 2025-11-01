import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Expecting header format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      // Attach decoded user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error in authentication" });
  }
};
