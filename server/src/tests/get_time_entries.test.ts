
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, timeEntriesTable } from '../db/schema';
import { getTimeEntries } from '../handlers/get_time_entries';

describe('getTimeEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when task has no time entries', async () => {
    // Create a task first
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test Task'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;
    const result = await getTimeEntries(taskId);

    expect(result).toEqual([]);
  });

  it('should return time entries for specific task', async () => {
    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test Task'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Create time entries for this task
    await db.insert(timeEntriesTable)
      .values([
        { task_id: taskId, minutes: 30 },
        { task_id: taskId, minutes: 45 }
      ])
      .execute();

    const result = await getTimeEntries(taskId);

    expect(result).toHaveLength(2);
    
    // Verify all entries belong to the correct task
    result.forEach(entry => {
      expect(entry.task_id).toEqual(taskId);
      expect(entry.id).toBeDefined();
      expect(entry.created_at).toBeInstanceOf(Date);
    });

    // Verify the minutes values are present (order may vary)
    const minutes = result.map(entry => entry.minutes).sort();
    expect(minutes).toEqual([30, 45]);
  });

  it('should return entries ordered by created_at descending', async () => {
    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({
        description: 'Test Task'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Create time entries with slight delay to ensure different timestamps
    const firstEntry = await db.insert(timeEntriesTable)
      .values({ task_id: taskId, minutes: 30 })
      .returning()
      .execute();

    // Small delay to ensure different created_at times
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondEntry = await db.insert(timeEntriesTable)
      .values({ task_id: taskId, minutes: 45 })
      .returning()
      .execute();

    const result = await getTimeEntries(taskId);

    expect(result).toHaveLength(2);
    // Most recent entry should be first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[0].id).toEqual(secondEntry[0].id);
    expect(result[1].id).toEqual(firstEntry[0].id);
  });

  it('should only return entries for specified task', async () => {
    // Create two tasks
    const task1Result = await db.insert(tasksTable)
      .values({ description: 'Task 1' })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({ description: 'Task 2' })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Create time entries for both tasks
    await db.insert(timeEntriesTable)
      .values([
        { task_id: task1Id, minutes: 30 },
        { task_id: task1Id, minutes: 45 },
        { task_id: task2Id, minutes: 60 }
      ])
      .execute();

    const result = await getTimeEntries(task1Id);

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.task_id).toEqual(task1Id);
    });
  });
});
