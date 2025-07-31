
import { db } from '../db';
import { tasksTable, timeEntriesTable } from '../db/schema';
import { type AddTimeInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const addTime = async (input: AddTimeInput): Promise<Task> => {
  try {
    // Start a transaction to ensure both operations succeed or fail together
    const result = await db.transaction(async (tx) => {
      // First, verify the task exists and get current total
      const existingTask = await tx.select()
        .from(tasksTable)
        .where(eq(tasksTable.id, input.task_id))
        .execute();

      if (existingTask.length === 0) {
        throw new Error(`Task with id ${input.task_id} not found`);
      }

      // Create the time entry record
      await tx.insert(timeEntriesTable)
        .values({
          task_id: input.task_id,
          minutes: input.minutes
        })
        .execute();

      // Update the task's total time and updated_at timestamp
      const updatedTask = await tx.update(tasksTable)
        .set({
          total_time_minutes: existingTask[0].total_time_minutes + input.minutes,
          updated_at: new Date()
        })
        .where(eq(tasksTable.id, input.task_id))
        .returning()
        .execute();

      return updatedTask[0];
    });

    return result;
  } catch (error) {
    console.error('Add time operation failed:', error);
    throw error;
  }
};
