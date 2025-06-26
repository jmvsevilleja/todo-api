import { Priority, TodoSortField, SortOrder } from "./constants";

// Data Transfer Objects for API requests/responses
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

// Request DTOs
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

// Query parameter types
export interface TodoQueryParams {
  completed?: string;
  priority?: string;
  page?: string;
  limit?: string;
  sortBy?: TodoSortField;
  sortOrder?: SortOrder;
  search?: string;
}

export interface UserQueryParams {
  page?: string;
  limit?: string;
  sortBy?: "createdAt" | "updatedAt" | "email" | "name";
  sortOrder?: SortOrder;
  search?: string;
}
