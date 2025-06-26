export type UserId = string & { readonly brand: unique symbol };
export type TodoId = string & { readonly brand: unique symbol };
export type Email = string & { readonly brand: unique symbol };

export const createUserId = (id: string): UserId => id as UserId;
export const createTodoId = (id: string): TodoId => id as TodoId;
export const createEmail = (email: string): Email => email as Email;
