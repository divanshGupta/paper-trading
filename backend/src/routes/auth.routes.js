import { Router } from "express";
import { signUp, signIn, signOut, refreshAccessToken } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Path: /api/v1/auth/sign-up (POST)
authRouter.post('/sign-up', signUp);

// Path: /api/v1/auth/refresh (POST)
authRouter.post('/refresh', refreshAccessToken)

// Path: /api/v1/auth/sign-in (POST)
authRouter.post('/sign-in', signIn);

// Path: /api/v1/auth/sign-out (POST)
authRouter.post('/sign-out', authenticateToken, signOut);

// authRouter.post(
//   "/sign-up",
//   [
//     body("email").isEmail(),
//     body("password").isLength({ min: 6 }),
//     body("username").notEmpty(),
//   ],
//   validate,
//   signUp
// );


export default authRouter;