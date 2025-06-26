import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TodoService } from '../services/TodoService';
import { authenticateToken } from '../middleware/auth';
import {
  createTodoSchema,
  updateTodoSchema,
  todoQuerySchema,
  validateBody,
  validateQuery
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  ApiResponse,
  TodoResponseDto,
  PaginatedResponse,
  TodoQueryParams
} from '../types';

const router = Router();
const prisma = new PrismaClient();
const todoService = new TodoService(prisma);

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all todos with enhanced filtering and pagination
router.get('/',
  validateQuery(todoQuerySchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user!.id;
    const queryParams = req.query as TodoQueryParams;

    const result = await todoService.getTodos(userId, queryParams);
    res.json(result);
  })
);

// Get single todo with type safety
router.get('/:id',
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await todoService.getTodoById(userId, id);

    const response: ApiResponse<TodoResponseDto> = {
      success: true,
      data: todo
    };

    res.json(response);
  })
);

// Create new todo with validation
router.post('/',
  validateBody(createTodoSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user!.id;
    const todo = await todoService.createTodo(userId, req.body);

    const response: ApiResponse<TodoResponseDto> = {
      success: true,
      data: todo,
      message: 'Todo created successfully'
    };

    res.status(201).json(response);
  })
);

// Update todo with validation
router.put('/:id',
  validateBody(updateTodoSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await todoService.updateTodo(userId, id, req.body);

    const response: ApiResponse<TodoResponseDto> = {
      success: true,
      data: todo,
      message: 'Todo updated successfully'
    };

    res.json(response);
  })
);

// Delete todo
router.delete('/:id',
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.id;

    await todoService.deleteTodo(userId, id);

    const response: ApiResponse = {
      success: true,
      message: 'Todo deleted successfully'
    };

    res.json(response);
  })
);

// Toggle todo completion
router.patch('/:id/toggle',
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await todoService.toggleTodoCompletion(userId, id);

    const response: ApiResponse<TodoResponseDto> = {
      success: true,
      data: todo,
      message: `Todo marked as ${todo.completed ? 'completed' : 'pending'}`
    };

    res.json(response);
  })
);

// Get todos by priority
router.get('/priority/:priority',
  asyncHandler(async (req, res): Promise<void> => {
    const { priority } = req.params;
    const userId = req.user!.id;

    const todos = await todoService.getTodosByPriority(
      userId,
      priority.toUpperCase() as any
    );

    const response: ApiResponse<TodoResponseDto[]> = {
      success: true,
      data: todos
    };

    res.json(response);
  })
);

// Get overdue todos
router.get('/status/overdue',
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user!.id;
    const todos = await todoService.getOverdueTodos(userId);

    const response: ApiResponse<TodoResponseDto[]> = {
      success: true,
      data: todos
    };

    res.json(response);
  })
);

export default router;