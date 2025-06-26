import { Router } from 'express';
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
  TodoQueryParams 
} from '../types';

const router = Router();
const todoService = new TodoService();

router.use(authenticateToken);

router.get('/',
  validateQuery(todoQuerySchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user!.id;
    const queryParams = req.query as TodoQueryParams;

    const result = await todoService.getTodos(userId, queryParams);
    res.json(result);
  })
);

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