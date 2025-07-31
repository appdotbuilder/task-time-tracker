
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toHaveLength(0);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          description: 'First task',
          total_time_minutes: 30
        },
        {
          description: 'Second task',
          total_time_minutes: 60
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify all fields are present
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.total_time_minutes).toBeDefined();
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Verify task data
    const descriptions = result.map(task => task.description);
    expect(descriptions).toContain('First task');
    expect(descriptions).toContain('Second task');
  });

  it('should return tasks ordered by created_at descending', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        description: 'Older task',
        total_time_minutes: 15
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        description: 'Newer task',
        total_time_minutes: 25
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    // Newer task should come first (descending order)
    expect(result[0].description).toEqual('Newer task');
    expect(result[1].description).toEqual('Older task');
    
    // Verify ordering by timestamps
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle tasks with default values correctly', async () => {
    // Insert task with minimal data (relying on defaults)
    await db.insert(tasksTable)
      .values({
        description: 'Task with defaults'
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Task with defaults');
    expect(result[0].total_time_minutes).toEqual(0); // Default value
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
