
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, timeEntriesTable } from '../db/schema';
import { type AddTimeInput } from '../schema';
import { addTime } from '../handlers/add_time';
import { eq } from 'drizzle-orm';

describe('addTime', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add time to existing task', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        total_time_minutes: 60
      })
      .returning()
      .execute();

    const task = taskResult[0];
    const originalUpdatedAt = task.updated_at;

    // Add time to the task
    const input: AddTimeInput = {
      task_id: task.id,
      minutes: 30
    };

    const result = await addTime(input);

    // Verify the updated task
    expect(result.id).toEqual(task.id);
    expect(result.description).toEqual('Test task');
    expect(result.total_time_minutes).toEqual(90); // 60 + 30
    expect(result.created_at).toEqual(task.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should create time entry record', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        total_time_minutes: 0
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Add time to the task
    const input: AddTimeInput = {
      task_id: task.id,
      minutes: 45
    };

    await addTime(input);

    // Verify time entry was created
    const timeEntries = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, task.id))
      .execute();

    expect(timeEntries).toHaveLength(1);
    expect(timeEntries[0].task_id).toEqual(task.id);
    expect(timeEntries[0].minutes).toEqual(45);
    expect(timeEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple time additions correctly', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        total_time_minutes: 120
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Add time multiple times
    await addTime({ task_id: task.id, minutes: 15 });
    await addTime({ task_id: task.id, minutes: 25 });
    const finalResult = await addTime({ task_id: task.id, minutes: 10 });

    // Verify final total
    expect(finalResult.total_time_minutes).toEqual(170); // 120 + 15 + 25 + 10

    // Verify all time entries were created
    const timeEntries = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, task.id))
      .execute();

    expect(timeEntries).toHaveLength(3);
    expect(timeEntries.map(entry => entry.minutes)).toEqual([15, 25, 10]);
  });

  it('should throw error for non-existent task', async () => {
    const input: AddTimeInput = {
      task_id: 999,
      minutes: 30
    };

    await expect(addTime(input)).rejects.toThrow(/task with id 999 not found/i);
  });

  it('should update task in database', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Database test task',
        total_time_minutes: 90
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Add time to the task
    const input: AddTimeInput = {
      task_id: task.id,
      minutes: 60
    };

    await addTime(input);

    // Query database directly to verify update
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].total_time_minutes).toEqual(150); // 90 + 60
    expect(updatedTasks[0].updated_at.getTime()).toBeGreaterThan(task.updated_at.getTime());
  });
});
