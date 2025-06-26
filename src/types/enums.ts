export const PRIORITY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const TODO_STATUS = ["PENDING", "COMPLETED"] as const;
export type TodoStatus = (typeof TODO_STATUS)[number];
