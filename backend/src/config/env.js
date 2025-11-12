import { config } from 'dotenv';
import path from 'path';

// Load base .env file from the backend root directory
config({ path: path.resolve(process.cwd(), '.env') });

// Then load environment specific overrides if they exist
const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}.local`);
try {
    config({ path: envPath, override: true });
} catch (error) {
    console.log(`No ${process.env.NODE_ENV} specific .env file found`);
}

// Validate required environment variables
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE',
    'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const {
    PORT, SERVER_URL,
    JWT_SECRET, JWT_EXPIRES_IN,
    ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET,
    DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE
} = process.env;