
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when found', async () => {
    // Create a test task
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        total_time_minutes: 120
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    const input: GetTaskInput = { id: createdTask.id };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.description).toEqual('Test task');
    expect(result!.total_time_minutes).toEqual(120);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task not found', async () => {
    const input: GetTaskInput = { id: 999 };

    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should return task with correct data types', async () => {
    // Create a test task
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Another test task',
        total_time_minutes: 60
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    const input: GetTaskInput = { id: createdTask.id };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.description).toBe('string');
    expect(typeof result!.total_time_minutes).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
