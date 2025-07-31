
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (input: GetTaskInput): Promise<Task | null> => {
  try {
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const task = result[0];
    return {
      id: task.id,
      description: task.description,
      total_time_minutes: task.total_time_minutes,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
};
