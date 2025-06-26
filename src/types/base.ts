// Base types and branded types for enhanced type safety
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