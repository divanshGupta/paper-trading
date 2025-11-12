import { Router } from 'express';
import { fetchBalance, getAllUsers, getProfile, updateProfile } from '../controllers/user.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const userRouter = Router();

// fetch all users
userRouter.get('/', getAllUsers);

// fetch user balance
userRouter.get('/balance', verifyAuth, fetchBalance);

// GET profile
userRouter.get('/profile', verifyAuth, getProfile);

// UPDATE profile
userRouter.put('/profile', verifyAuth, updateProfile);

export default userRouter;