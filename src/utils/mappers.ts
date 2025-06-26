import { User, Todo, UserResponseDto, TodoResponseDto } from '../types';

// Utility functions for mapping database entities to DTOs
export const mapUserToDto = (user: User): UserResponseDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt
});

export const mapTodoToDto = (todo: Todo): TodoResponseDto => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  completed: todo.completed,
  priority: todo.priority,
  dueDate: todo.dueDate,
  createdAt: todo.createdAt,
  updatedAt: todo.updatedAt
});

// Array mappers
export const mapUsersToDto = (users: User[]): UserResponseDto[] => 
  users.map(mapUserToDto);

export const mapTodosToDto = (todos: Todo[]): TodoResponseDto[] => 
  todos.map(mapTodoToDto);

// Utility for creating paginated responses
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true as const,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};