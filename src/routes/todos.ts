import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { createTodoSchema, updateTodoSchema } from '../utils/validation';
import { ApiResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all todos for authenticated user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { completed, priority } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };

    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority.toUpperCase();
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: todos
    } as ApiResponse);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Get single todo
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!todo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: todo
    } as ApiResponse);
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Create new todo
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createTodoSchema.parse(req.body);
    const userId = req.user!.id;

    const todoData: any = {
      ...validatedData,
      userId
    };

    if (validatedData.dueDate) {
      todoData.dueDate = new Date(validatedData.dueDate);
    }

    const todo = await prisma.todo.create({
      data: todoData
    });

    res.status(201).json({
      success: true,
      data: todo,
      message: 'Todo created successfully'
    } as ApiResponse);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      } as ApiResponse);
      return;
    }

    console.error('Create todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Update todo
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateTodoSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTodo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      } as ApiResponse);
      return;
    }

    const updateData: any = { ...validatedData };

    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: todo,
      message: 'Todo updated successfully'
    } as ApiResponse);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      } as ApiResponse);
      return;
    }

    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Delete todo
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTodo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      } as ApiResponse);
      return;
    }

    await prisma.todo.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Toggle todo completion
router.patch('/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTodo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      } as ApiResponse);
      return;
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        completed: !existingTodo.completed
      }
    });

    res.json({
      success: true,
      data: todo,
      message: `Todo marked as ${todo.completed ? 'completed' : 'pending'}`
    } as ApiResponse);
  } catch (error) {
    console.error('Toggle todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

export default router;

export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}