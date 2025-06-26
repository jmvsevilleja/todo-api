import { Priority } from './constants';

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

// Utility types for better type manipulation
export type TodoWithoutTimestamps = Omit<Todo, 'createdAt' | 'updatedAt'>;
export type TodoCreateInput = Pick<Todo, 'title' | 'description' | 'priority' | 'dueDate'>;
export type TodoUpdateInput = Partial<TodoCreateInput> & { completed?: boolean };
export type UserWithoutPassword = Omit<User, 'password'>;
export type UserCreateInput = Pick<User, 'email' | 'name'> & { password: string };