
import { db } from '../db';
import { timeEntriesTable } from '../db/schema';
import { type TimeEntry } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getTimeEntries = async (taskId: number): Promise<TimeEntry[]> => {
  try {
    const results = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, taskId))
      .orderBy(desc(timeEntriesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get time entries:', error);
    throw error;
  }
};
