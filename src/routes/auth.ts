import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { registerSchema, loginSchema, validateBody } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, AuthResponseDto } from '../types';

const router = Router();
const prisma = new PrismaClient();
const userService = new UserService(prisma);
const authService = new AuthService(userService);

// Register endpoint with enhanced type safety
router.post('/register', 
  validateBody(registerSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const authResponse = await authService.register(req.body);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      data: authResponse,
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  })
);

// Login endpoint with enhanced type safety
router.post('/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const authResponse = await authService.login(req.body);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      data: authResponse,
      message: 'Login successful'
    };

    res.json(response);
  })
);

// Token verification endpoint
router.get('/verify',
  asyncHandler(async (req, res): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const user = await authService.verifyToken(token);

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'Token is valid'
    };

    res.json(response);
  })
);

export default router;