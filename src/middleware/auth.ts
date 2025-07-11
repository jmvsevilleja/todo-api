import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { PrismaClient } from '@prisma/client';
import { AuthUser, AuthenticationError, AuthorizationError } from '../types';
import { asyncHandler } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Dependency injection setup
const prisma = new PrismaClient();
const userService = new UserService(prisma);
const authService = new AuthService(userService);

export const authenticateToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  }
);

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // This would require adding roles to the user model
      // For now, we'll just pass through
      // if (roles.length > 0 && !roles.includes(req.user.role)) {
      //   throw new AuthorizationError('Insufficient permissions');
      // }

      next();
    }
  );
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const user = await authService.verifyToken(token);
        req.user = user;
      } catch (error) {
        // Silently ignore invalid tokens for optional auth
      }
    }

    next();
  }
);