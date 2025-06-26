import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ConflictError,
  DatabaseError,
  isAppError,
  HTTP_STATUS
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
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle known application errors
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(config.server.nodeEnv !== 'production' && { stack: error.stack })
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'A record with this information already exists',
          code: 'DUPLICATE_RECORD',
          timestamp: new Date().toISOString()
        });
        return;
      case 'P2025':
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        return;
      case 'P2003':
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_CONSTRAINT',
          timestamp: new Date().toISOString()
        });
        return;
      default:
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Database error occurred',
          code: 'DATABASE_ERROR',
          timestamp: new Date().toISOString()
        });
        return;
    }
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const zodError = error as any;
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: zodError.errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: config.server.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
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