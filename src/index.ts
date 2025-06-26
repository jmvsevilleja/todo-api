import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config, validateConfig } from './config';
import { errorHandler } from './middleware/errorHandler';
import { runMigrations } from './database/migrations';
import { db } from './database/connection';

import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';

dotenv.config();
validateConfig();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: config.server.rateLimitWindowMs,
  max: config.server.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  
  res.status(dbHealthy ? 200 : 503).json({
    success: dbHealthy,
    message: dbHealthy ? 'Server is running' : 'Database connection failed',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Todo API v1.0 - PostgreSQL Direct',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify'
      },
      todos: {
        list: 'GET /api/todos',
        create: 'POST /api/todos',
        get: 'GET /api/todos/:id',
        update: 'PUT /api/todos/:id',
        delete: 'DELETE /api/todos/:id',
        toggle: 'PATCH /api/todos/:id/toggle',
        byPriority: 'GET /api/todos/priority/:priority',
        overdue: 'GET /api/todos/status/overdue'
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  
  try {
    await db.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Running database migrations...');
    await runMigrations();
    
    console.log('🔄 Testing database connection...');
    const isHealthy = await db.healthCheck();
    
    if (!isHealthy) {
      throw new Error('Database connection failed');
    }

    app.listen(config.server.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.server.port}`);
      console.log(`📚 Health check: http://localhost:${config.server.port}/health`);
      console.log(`📖 API docs: http://localhost:${config.server.port}/api`);
      console.log(`🔐 Auth endpoints: http://localhost:${config.server.port}/api/auth`);
      console.log(`📝 Todo endpoints: http://localhost:${config.server.port}/api/todos`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`🗄️  Database: PostgreSQL (Direct Connection)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();