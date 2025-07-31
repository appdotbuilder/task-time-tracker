
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  description: 'Test task description'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.description).toEqual('Test task description');
    expect(result.total_time_minutes).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Test task description');
    expect(tasks[0].total_time_minutes).toEqual(0);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different task descriptions', async () => {
    const input1: CreateTaskInput = { description: 'First task' };
    const input2: CreateTaskInput = { description: 'Second task with longer description' };

    const result1 = await createTask(input1);
    const result2 = await createTask(input2);

    expect(result1.description).toEqual('First task');
    expect(result2.description).toEqual('Second task with longer description');
    expect(result1.id).not.toEqual(result2.id);
  });
});
