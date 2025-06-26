export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
}

// Enhanced API Response types with generics
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Strict literal types for better type safety
export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = typeof PRIORITY_LEVELS[number];

// Database entity types
export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

// Request/Response DTOs
export interface UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface TodoResponseDto {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
}

// Query parameter types
export interface TodoQueryParams {
  completed?: string;
  priority?: string;
  page?: string;
  limit?: string;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

// Service interfaces
export interface IUserService {
  createUser(userData: CreateUserData): Promise<UserResponseDto>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<UserResponseDto | null>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

export interface ITodoService {
  createTodo(userId: string, todoData: CreateTodoData): Promise<TodoResponseDto>;
  getTodos(userId: string, params: TodoQueryParams): Promise<PaginatedResponse<TodoResponseDto>>;
  getTodoById(userId: string, todoId: string): Promise<TodoResponseDto>;
  updateTodo(userId: string, todoId: string, updateData: UpdateTodoData): Promise<TodoResponseDto>;
  deleteTodo(userId: string, todoId: string): Promise<void>;
  toggleTodoCompletion(userId: string, todoId: string): Promise<TodoResponseDto>;
  getTodosByPriority(userId: string, priority: Priority): Promise<TodoResponseDto[]>;
  getOverdueTodos(userId: string): Promise<TodoResponseDto[]>;
}

export interface IAuthService {
  register(userData: CreateUserData): Promise<AuthResponseDto>;
  login(loginData: LoginData): Promise<AuthResponseDto>;
  verifyToken(token: string): Promise<AuthUser>;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

// Type guards
export const isValidPriority = (value: any): value is Priority => {
  return PRIORITY_LEVELS.includes(value);
};

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

// Utility functions for mapping database results
export const mapUserToDto = (user: User): UserResponseDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.created_at
});

export const mapTodoToDto = (todo: Todo): TodoResponseDto => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  completed: todo.completed,
  priority: todo.priority,
  dueDate: todo.due_date,
  createdAt: todo.created_at,
  updatedAt: todo.updated_at
});