import { AppConfig } from '../types';

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
};

export const config: AppConfig = {
  server: {
    port: getEnvNumber('PORT', 3000),
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100)
  },
  database: {
    url: getEnvVar('DATABASE_URL'),
    maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    connectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT', 10000)
  },
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'fallback-secret-change-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    issuer: getEnvVar('JWT_ISSUER', 'todo-api'),
    audience: getEnvVar('JWT_AUDIENCE', 'todo-app')
  }
};

export const validateConfig = (): void => {
  if (config.server.nodeEnv === 'production' && config.jwt.secret === 'fallback-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  
  if (!config.database.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
};