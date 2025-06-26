import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { PRIORITY_LEVELS, TODO_SORT_FIELDS, SORT_ORDERS } from '../types/constants';
import { ValidationError } from '../types/errors';

// Enhanced validation schemas with better error messages
export const registerSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name is too long')
    .trim()
    .optional()
    .or(z.literal(''))
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .min(1, 'Email is required')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
});

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  priority: z
    .enum(PRIORITY_LEVELS, {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' })
    })
    .optional(),
  dueDate: z
    .string()
    .datetime('Due date must be a valid ISO datetime string')
    .optional()
    .or(z.literal(''))
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  completed: z
    .boolean({
      errorMap: () => ({ message: 'Completed must be a boolean value' })
    })
    .optional(),
  priority: z
    .enum(PRIORITY_LEVELS, {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' })
    })
    .optional(),
  dueDate: z
    .string()
    .datetime('Due date must be a valid ISO datetime string')
    .optional()
    .or(z.literal(''))
});

export const todoQuerySchema = z.object({
  completed: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === 'true' || val === 'false', {
      message: 'Completed must be "true" or "false"'
    }),
  priority: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return PRIORITY_LEVELS.includes(val.toUpperCase() as any);
    }, {
      message: 'Priority must be LOW, MEDIUM, or HIGH'
    }),
  page: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, {
      message: 'Page must be a positive number'
    }),
  limit: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0 && num <= 100;
    }, {
      message: 'Limit must be a positive number between 1 and 100'
    }),
  sortBy: z
    .enum(TODO_SORT_FIELDS)
    .optional(),
  sortOrder: z
    .enum(SORT_ORDERS)
    .optional(),
  search: z
    .string()
    .min(1, 'Search term cannot be empty')
    .max(100, 'Search term is too long')
    .trim()
    .optional()
});

// Validation middleware factories
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Query validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Parameter validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// Custom validation functions
export const isValidObjectId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const isStrongPassword = (password: string): boolean => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};