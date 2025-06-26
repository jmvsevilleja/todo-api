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

export const TODO_STATUS = ['PENDING', 'COMPLETED'] as const;
export type TodoStatus = typeof TODO_STATUS[number];

// Utility types for better type manipulation
export type TodoWithoutTimestamps = Omit<Todo, 'createdAt' | 'updatedAt'>;
export type TodoCreateInput = Pick<Todo, 'title' | 'description' | 'priority' | 'dueDate'>;
export type TodoUpdateInput = Partial<TodoCreateInput> & { completed?: boolean };

// Database entity types (matching Prisma schema)
export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Request/Response DTOs (Data Transfer Objects)
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
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Error types for better error handling
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

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

// Service layer interfaces for dependency injection
export interface IUserService {
  createUser(userData: CreateUserData): Promise<UserResponseDto>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<UserResponseDto | null>;
}

export interface ITodoService {
  createTodo(userId: string, todoData: CreateTodoData): Promise<TodoResponseDto>;
  getTodos(userId: string, params: TodoQueryParams): Promise<PaginatedResponse<TodoResponseDto>>;
  getTodoById(userId: string, todoId: string): Promise<TodoResponseDto>;
  updateTodo(userId: string, todoId: string, updateData: UpdateTodoData): Promise<TodoResponseDto>;
  deleteTodo(userId: string, todoId: string): Promise<void>;
  toggleTodoCompletion(userId: string, todoId: string): Promise<TodoResponseDto>;
}

export interface IAuthService {
  register(userData: CreateUserData): Promise<AuthResponseDto>;
  login(loginData: LoginData): Promise<AuthResponseDto>;
  verifyToken(token: string): Promise<AuthUser>;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer?: string;
  audience?: string;
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

// Middleware types
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Type guards for runtime type checking
export const isValidPriority = (value: any): value is Priority => {
  return PRIORITY_LEVELS.includes(value);
};

export const isValidTodoStatus = (value: any): value is TodoStatus => {
  return TODO_STATUS.includes(value);
};

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

// Branded types for better type safety
export type UserId = string & { readonly brand: unique symbol };
export type TodoId = string & { readonly brand: unique symbol };
export type Email = string & { readonly brand: unique symbol };

export const createUserId = (id: string): UserId => id as UserId;
export const createTodoId = (id: string): TodoId => id as TodoId;
export const createEmail = (email: string): Email => email as Email;

// Result type for better error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const createSuccess = <T>(data: T): Result<T> => ({
  success: true,
  data
});

export const createError = <E>(error: E): Result<never, E> => ({
  success: false,
  error
});