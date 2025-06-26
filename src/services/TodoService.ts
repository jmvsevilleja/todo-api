import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { 
  ITodoService, 
  CreateTodoData, 
  UpdateTodoData, 
  TodoResponseDto, 
  TodoQueryParams,
  PaginatedResponse,
  NotFoundError,
  ValidationError,
  Priority,
  Todo,
  mapTodoToDto,
  isValidPriority
} from '../types';

export class TodoService implements ITodoService {
  async createTodo(userId: string, todoData: CreateTodoData): Promise<TodoResponseDto> {
    const todoId = uuidv4();
    const dueDate = todoData.dueDate ? new Date(todoData.dueDate) : null;

    const { rows } = await db.query<Todo>(
      `INSERT INTO todos (id, title, description, priority, due_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        todoId,
        todoData.title,
        todoData.description || null,
        todoData.priority || 'MEDIUM',
        dueDate,
        userId
      ]
    );

    return mapTodoToDto(rows[0]);
  }

  async getTodos(userId: string, params: TodoQueryParams): Promise<PaginatedResponse<TodoResponseDto>> {
    const page = parseInt(params.page || '1', 10);
    const limit = Math.min(parseInt(params.limit || '10', 10), 100);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: string[] = ['user_id = $1'];
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (params.completed !== undefined) {
      whereConditions.push(`completed = $${paramIndex++}`);
      queryParams.push(params.completed === 'true');
    }

    if (params.priority && isValidPriority(params.priority.toUpperCase())) {
      whereConditions.push(`priority = $${paramIndex++}`);
      queryParams.push(params.priority.toUpperCase());
    }

    // Build ORDER BY clause
    let orderBy = 'completed ASC, created_at DESC';
    if (params.sortBy && params.sortOrder) {
      const validSortFields = ['created_at', 'updated_at', 'due_date', 'priority'];
      if (validSortFields.includes(params.sortBy)) {
        orderBy = `${params.sortBy} ${params.sortOrder.toUpperCase()}, created_at DESC`;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const { rows: countRows } = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM todos WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countRows[0].count);

    // Get todos with pagination
    const { rows } = await db.query<Todo>(
      `SELECT * FROM todos 
       WHERE ${whereClause} 
       ORDER BY ${orderBy} 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...queryParams, limit, offset]
    );

    const todos = rows.map(mapTodoToDto);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: todos,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getTodoById(userId: string, todoId: string): Promise<TodoResponseDto> {
    const { rows } = await db.query<Todo>(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Todo');
    }

    return mapTodoToDto(rows[0]);
  }

  async updateTodo(userId: string, todoId: string, updateData: UpdateTodoData): Promise<TodoResponseDto> {
    // Check if todo exists and belongs to user
    await this.getTodoById(userId, todoId);

    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(updateData.description || null);
    }

    if (updateData.completed !== undefined) {
      setParts.push(`completed = $${paramIndex++}`);
      values.push(updateData.completed);
    }

    if (updateData.priority !== undefined) {
      setParts.push(`priority = $${paramIndex++}`);
      values.push(updateData.priority);
    }

    if (updateData.dueDate !== undefined) {
      setParts.push(`due_date = $${paramIndex++}`);
      values.push(updateData.dueDate ? new Date(updateData.dueDate) : null);
    }

    if (setParts.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    values.push(todoId);

    const { rows } = await db.query<Todo>(
      `UPDATE todos SET ${setParts.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );

    return mapTodoToDto(rows[0]);
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    // Check if todo exists and belongs to user
    await this.getTodoById(userId, todoId);

    await db.query('DELETE FROM todos WHERE id = $1', [todoId]);
  }

  async toggleTodoCompletion(userId: string, todoId: string): Promise<TodoResponseDto> {
    const existingTodo = await this.getTodoById(userId, todoId);

    const { rows } = await db.query<Todo>(
      `UPDATE todos SET completed = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [!existingTodo.completed, todoId]
    );

    return mapTodoToDto(rows[0]);
  }

  async getTodosByPriority(userId: string, priority: Priority): Promise<TodoResponseDto[]> {
    const { rows } = await db.query<Todo>(
      `SELECT * FROM todos 
       WHERE user_id = $1 AND priority = $2 
       ORDER BY created_at DESC`,
      [userId, priority]
    );

    return rows.map(mapTodoToDto);
  }

  async getOverdueTodos(userId: string): Promise<TodoResponseDto[]> {
    const { rows } = await db.query<Todo>(
      `SELECT * FROM todos 
       WHERE user_id = $1 AND completed = false AND due_date < NOW() 
       ORDER BY due_date ASC`,
      [userId]
    );

    return rows.map(mapTodoToDto);
  }

  async getTodosByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TodoResponseDto[]> {
    const { rows } = await db.query<Todo>(
      `SELECT * FROM todos 
       WHERE user_id = $1 AND due_date BETWEEN $2 AND $3 
       ORDER BY due_date ASC`,
      [userId, startDate, endDate]
    );

    return rows.map(mapTodoToDto);
  }

  async searchTodos(userId: string, searchTerm: string): Promise<TodoResponseDto[]> {
    const { rows } = await db.query<Todo>(
      `SELECT * FROM todos 
       WHERE user_id = $1 AND (
         title ILIKE $2 OR 
         description ILIKE $2
       )
       ORDER BY created_at DESC`,
      [userId, `%${searchTerm}%`]
    );

    return rows.map(mapTodoToDto);
  }
}