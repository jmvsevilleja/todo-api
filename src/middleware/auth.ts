import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { AuthUser, AuthenticationError } from '../types';
import { asyncHandler } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Create service instances
const userService = new UserService();
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

export const authorize = (...roles: string[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      next();
    }
  );
};