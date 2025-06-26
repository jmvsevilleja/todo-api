import {
  CreateUserData,
  LoginData,
  CreateTodoData,
  UpdateTodoData,
  UserResponseDto,
  TodoResponseDto,
  AuthResponseDto,
  TodoQueryParams,
} from "./dto";
import { AuthUser } from "./auth";
import { User } from "./entities";
import { Priority } from "./constants";
import { PaginatedResponse } from "./api";

// Service layer interfaces for dependency injection
export interface IUserService {
  createUser(userData: CreateUserData): Promise<UserResponseDto>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<UserResponseDto | null>;
  updateUser(
    id: string,
    updateData: Partial<CreateUserData>
  ): Promise<UserResponseDto>;
  deleteUser(id: string): Promise<void>;
  validatePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export interface ITodoService {
  createTodo(
    userId: string,
    todoData: CreateTodoData
  ): Promise<TodoResponseDto>;
  getTodos(
    userId: string,
    params: TodoQueryParams
  ): Promise<PaginatedResponse<TodoResponseDto>>;
  getTodoById(userId: string, todoId: string): Promise<TodoResponseDto>;
  updateTodo(
    userId: string,
    todoId: string,
    updateData: UpdateTodoData
  ): Promise<TodoResponseDto>;
  deleteTodo(userId: string, todoId: string): Promise<void>;
  toggleTodoCompletion(
    userId: string,
    todoId: string
  ): Promise<TodoResponseDto>;
  getTodosByPriority(
    userId: string,
    priority: Priority
  ): Promise<TodoResponseDto[]>;
  getOverdueTodos(userId: string): Promise<TodoResponseDto[]>;
  searchTodos(userId: string, searchTerm: string): Promise<TodoResponseDto[]>;
  getTodoStats(userId: string): Promise<TodoStats>;
}

export interface IAuthService {
  register(userData: CreateUserData): Promise<AuthResponseDto>;
  login(loginData: LoginData): Promise<AuthResponseDto>;
  verifyToken(token: string): Promise<AuthUser>;
  refreshToken(refreshToken: string): Promise<AuthResponseDto>;
  logout(token: string): Promise<void>;
}

// Additional service types
export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}
