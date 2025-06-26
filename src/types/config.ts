// Configuration types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  ssl?: boolean;
  logging?: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn?: string;
  issuer?: string;
  audience?: string;
  algorithm?: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  trustProxy?: boolean;
  bodyLimit?: string;
}

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  apiKey?: string;
  from: string;
  templates?: {
    welcome?: string;
    resetPassword?: string;
    verification?: string;
  };
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'gcs';
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  publicUrl?: string;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  redis?: RedisConfig;
  email?: EmailConfig;
  storage?: StorageConfig;
  features?: {
    registration: boolean;
    emailVerification: boolean;
    passwordReset: boolean;
    fileUpload: boolean;
  };
}

// Environment validation schema
export interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  CORS_ORIGINS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  REDIS_URL?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
}