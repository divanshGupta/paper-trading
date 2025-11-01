import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/env.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};
