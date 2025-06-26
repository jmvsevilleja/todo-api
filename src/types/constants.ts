// Application constants with strict typing
export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = typeof PRIORITY_LEVELS[number];

export const TODO_STATUS = ['PENDING', 'COMPLETED'] as const;
export type TodoStatus = typeof TODO_STATUS[number];

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export type UserRole = typeof USER_ROLES[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = typeof SORT_ORDERS[number];

export const TODO_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'] as const;
export type TodoSortField = typeof TODO_SORT_FIELDS[number];

// API Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
} as const;