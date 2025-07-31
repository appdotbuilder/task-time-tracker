
import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  total_time_minutes: z.number().int().nonnegative(), // Total time in minutes
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Time entry schema
export const timeEntrySchema = z.object({
  id: z.number(),
  task_id: z.number(),
  minutes: z.number().int().positive(), // Time spent in minutes for this entry
  created_at: z.coerce.date()
});

export type TimeEntry = z.infer<typeof timeEntrySchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  description: z.string().min(1, "Description is required")
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1, "Description is required").optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for adding time to a task
export const addTimeInputSchema = z.object({
  task_id: z.number(),
  minutes: z.number().int().positive("Minutes must be positive")
});

export type AddTimeInput = z.infer<typeof addTimeInputSchema>;

// Input schema for getting a single task
export const getTaskInputSchema = z.object({
  id: z.number()
});

export type GetTaskInput = z.infer<typeof getTaskInputSchema>;

// Input schema for deleting a task
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;
