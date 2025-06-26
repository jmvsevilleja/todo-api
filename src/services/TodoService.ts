import { PrismaClient, Prisma } from '@prisma/client';
import {
  ITodoService,
  CreateTodoData,
  UpdateTodoData,
  TodoResponseDto,
  TodoQueryParams,
  PaginatedResponse,
  NotFoundError,
  Priority,
  TodoStats,
  isValidPriority,
  PAGINATION
} from '../types';
import { createPaginatedResponse } from '../utils/mappers';

export class TodoService implements ITodoService {
  constructor(private readonly prisma: PrismaClient) {}

  async createTodo(userId: string, todoData: CreateTodoData): Promise<TodoResponseDto> {
    const data: Prisma.TodoCreateInput = {
      title: todoData.title,
      description: todoData.description || null,
      priority: todoData.priority || 'MEDIUM',
      dueDate: todoData.dueDate ? new Date(todoData.dueDate) : null,
      user: {
        connect: { id: userId }
      }
    };

    const todo = await this.prisma.todo.create({
      data,
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return todo;
  }

  async getTodos(userId: string, params: TodoQueryParams): Promise<PaginatedResponse<TodoResponseDto>> {
    const page = parseInt(params.page || PAGINATION.DEFAULT_PAGE.toString(), 10);
    const limit = Math.min(parseInt(params.limit || PAGINATION.DEFAULT_LIMIT.toString(), 10), PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TodoWhereInput = { userId };

    if (params.completed !== undefined) {
      where.completed = params.completed === 'true';
    }

    if (params.priority && isValidPriority(params.priority.toUpperCase())) {
      where.priority = params.priority.toUpperCase() as Priority;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: Prisma.TodoOrderByWithRelationInput[] = [];

    if (params.sortBy && params.sortOrder) {
      orderBy.push({
        [params.sortBy]: params.sortOrder
      });
    }

    // Default sorting
    orderBy.push(
      { completed: 'asc' },
      { createdAt: 'desc' }
    );

    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          completed: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.todo.count({ where })
    ]);

    return createPaginatedResponse(todos, page, limit, total);
  }

  async getTodoById(userId: string, todoId: string): Promise<TodoResponseDto> {
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        userId
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!todo) {
      throw new NotFoundError('Todo');
    }

    return todo;
  }

  async updateTodo(userId: string, todoId: string, updateData: UpdateTodoData): Promise<TodoResponseDto> {
    // Check if todo exists and belongs to user
    await this.getTodoById(userId, todoId);

    const data: Prisma.TodoUpdateInput = {};

    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.completed !== undefined) data.completed = updateData.completed;
    if (updateData.priority !== undefined) data.priority = updateData.priority;
    if (updateData.dueDate !== undefined) {
      data.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    }

    const todo = await this.prisma.todo.update({
      where: { id: todoId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return todo;
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    // Check if todo exists and belongs to user
    await this.getTodoById(userId, todoId);

    await this.prisma.todo.delete({
      where: { id: todoId }
    });
  }

  async toggleTodoCompletion(userId: string, todoId: string): Promise<TodoResponseDto> {
    const existingTodo = await this.getTodoById(userId, todoId);

    const todo = await this.prisma.todo.update({
      where: { id: todoId },
      data: {
        completed: !existingTodo.completed
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return todo;
  }

  async getTodosByPriority(userId: string, priority: Priority): Promise<TodoResponseDto[]> {
    return this.prisma.todo.findMany({
      where: {
        userId,
        priority
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOverdueTodos(userId: string): Promise<TodoResponseDto[]> {
    const now = new Date();

    return this.prisma.todo.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          lt: now
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async searchTodos(userId: string, searchTerm: string): Promise<TodoResponseDto[]> {
    return this.prisma.todo.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTodoStats(userId: string): Promise<TodoStats> {
    const now = new Date();

    const [total, completed, pending, overdue, priorityStats] = await Promise.all([
      this.prisma.todo.count({ where: { userId } }),
      this.prisma.todo.count({ where: { userId, completed: true } }),
      this.prisma.todo.count({ where: { userId, completed: false } }),
      this.prisma.todo.count({
        where: {
          userId,
          completed: false,
          dueDate: { lt: now }
        }
      }),
      this.prisma.todo.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { priority: true }
      })
    ]);

    const byPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0
    };

    priorityStats.forEach(stat => {
      byPriority[stat.priority] = stat._count.priority;
    });

    return {
      total,
      completed,
      pending,
      overdue,
      byPriority
    };
  }
}