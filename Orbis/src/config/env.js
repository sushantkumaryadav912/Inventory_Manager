// src/config/env.js
import Constants from 'expo-constants';

// Access environment variables from app.json extra or .env
const ENV = {
  API_BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3000',
  NEON_PROJECT_ID: Constants.expoConfig?.extra?.neonProjectId || process.env.NEON_PROJECT_ID,
  NEON_AUTH_URL: Constants.expoConfig?.extra?.neonAuthUrl || process.env.NEON_AUTH_URL,
  ENV: Constants.expoConfig?.extra?.environment || process.env.NODE_ENV || 'development',
};

// Validate required env vars
const requiredEnvVars = ['API_BASE_URL'];
requiredEnvVars.forEach((key) => {
  if (!ENV[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
});

export default ENV;
