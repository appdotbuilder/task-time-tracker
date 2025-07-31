
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task description', async () => {
    // Create a task directly in database for testing
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Original task description'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated task description'
    };

    const result = await updateTask(updateInput);

    // Verify the update
    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Updated task description');
    expect(result.total_time_minutes).toEqual(createdTask.total_time_minutes);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should save updated task to database', async () => {
    // Create a task directly in database
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Original description'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'New description'
    };

    await updateTask(updateInput);

    // Query database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('New description');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at > createdTask.updated_at).toBe(true);
  });

  it('should handle partial updates', async () => {
    // Create a task directly in database
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Original description'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update with only ID (no description)
    const updateInput: UpdateTaskInput = {
      id: createdTask.id
    };

    const result = await updateTask(updateInput);

    // Description should remain unchanged, but updated_at should change
    expect(result.description).toEqual('Original description');
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      description: 'This should fail'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve other task fields during update', async () => {
    // Create a task directly in database
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Original description'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update description
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    // All other fields should remain the same
    expect(result.total_time_minutes).toEqual(createdTask.total_time_minutes);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.id).toEqual(createdTask.id);
  });
});
