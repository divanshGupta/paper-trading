import bcrypt from "bcryptjs";
import { prisma } from "../utils/db.js";
// import { PrismaClient } from "@prisma/client"; // moved to utils/db.js
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { add } from "date-fns";

// const prisma = new PrismaClient(); // we are now importing prisma from utils/db.js

// sign up function
export const signUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken();

    // store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: add(new Date(), { days: 7 }) // 7 days
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        balance: Number(newUser.balance),
      },
      accessToken,
      refreshToken,
    });
   
  } catch (err) {
    next(err);
  }
};

// sign in function 
export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;  

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    };

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    };

    // Auto-clean expired tokens on signin
    // Make this a background cron job (daily/weekly), not an inline operation.
    // Calling this during every sign-in. It works, but it will block login slightly on large datasets.
    cleanupExpiredTokens().catch(console.error);


    // generating tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Save refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: add(new Date(), { days: 7 }) // 7 days
      }
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
} catch (err) {
    next(err);
  } 
}


// sign out function (for JWT, this is usually handled on the client side by deleting the token)
// Handles both authenticated and token-based logout
// If using cookies later, clear them (res.clearCookie(...))
// Add a fallback response if neither req.user nor refreshToken exists — otherwise the route will silently succeed even when nothing is deleted.
export const signOut = async (req, res, next) => {
  try {
    const { refreshToken } = req.body; // add this
    if (req.user) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    } else if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    // fallback response if neither req.user nor refreshToken exists — otherwise the route will silently succeed even when nothing is deleted.
    if (!req.user && !refreshToken) {
      return res.status(400).json({ message: "No refresh token or session found" });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};


// Refresh token function
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Missing refresh token' });

    // it never rotates refresh tokens after use.
    // That means a stolen refresh token can be reused indefinitely until expiry.
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};


// Cleanup expired refresh tokens
export const cleanupExpiredTokens = async () => {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
};

