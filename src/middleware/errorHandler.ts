import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  isAppError 
} from '../types';
import { config } from '../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle known application errors
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(config.server.nodeEnv !== 'production' && { stack: error.stack })
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(400).json({
          success: false,
          error: 'A record with this information already exists'
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found'
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database error occurred'
        });
        return;
    }
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const zodError = error as any;
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: zodError.errors
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired'
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(config.server.nodeEnv !== 'production' && { stack: error.stack })
  });
};

// Async error wrapper for route handlers
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};