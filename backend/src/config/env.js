import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
    PORT, SERVER_URL,
    JWT_SECRET, JWT_EXPIRES_IN,
    ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET,
    DATABASE_URL,
} = process.env;