import {
  Priority,
  TodoStatus,
  UserRole,
  SortOrder,
  TodoSortField,
  PRIORITY_LEVELS,
  TODO_STATUS,
  USER_ROLES,
  SORT_ORDERS,
  TODO_SORT_FIELDS,
} from "./constants";
import { AppError } from "./errors";

// Type guards for runtime type checking
export const isValidPriority = (value: any): value is Priority => {
  return (
    typeof value === "string" && PRIORITY_LEVELS.includes(value as Priority)
  );
};

export const isValidTodoStatus = (value: any): value is TodoStatus => {
  return typeof value === "string" && TODO_STATUS.includes(value as TodoStatus);
};

export const isValidUserRole = (value: any): value is UserRole => {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
};

export const isValidSortOrder = (value: any): value is SortOrder => {
  return typeof value === "string" && SORT_ORDERS.includes(value as SortOrder);
};

export const isValidTodoSortField = (value: any): value is TodoSortField => {
  return (
    typeof value === "string" &&
    TODO_SORT_FIELDS.includes(value as TodoSortField)
  );
};

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isNonEmptyString = (value: any): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isPositiveInteger = (value: any): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};
