
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, timeEntriesTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput, type AddTimeInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test inputs
const testDeleteInput: DeleteTaskInput = {
  id: 1
};

const testTaskInput: CreateTaskInput = {
  description: 'Test Task to Delete'
};

const testTimeEntryInput = {
  task_id: 1,
  minutes: 30
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task successfully', async () => {
    // Create a task first
    await db.insert(tasksTable)
      .values({
        description: testTaskInput.description
      })
      .execute();

    const result = await deleteTask(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testDeleteInput.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when deleting non-existent task', async () => {
    const result = await deleteTask({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should cascade delete associated time entries', async () => {
    // Create a task
    await db.insert(tasksTable)
      .values({
        description: testTaskInput.description
      })
      .execute();

    // Add time entries to the task
    await db.insert(timeEntriesTable)
      .values([
        { task_id: 1, minutes: 30 },
        { task_id: 1, minutes: 45 }
      ])
      .execute();

    // Verify time entries exist before deletion
    const timeEntriesBeforeDelete = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, 1))
      .execute();

    expect(timeEntriesBeforeDelete).toHaveLength(2);

    // Delete the task
    const result = await deleteTask(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify time entries are cascade deleted
    const timeEntriesAfterDelete = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, 1))
      .execute();

    expect(timeEntriesAfterDelete).toHaveLength(0);

    // Verify task is also deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testDeleteInput.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    await db.insert(tasksTable)
      .values([
        { description: 'Task 1' },
        { description: 'Task 2' }
      ])
      .execute();

    // Add time entries to both tasks
    await db.insert(timeEntriesTable)
      .values([
        { task_id: 1, minutes: 30 },
        { task_id: 2, minutes: 45 }
      ])
      .execute();

    // Delete first task
    const result = await deleteTask({ id: 1 });

    expect(result.success).toBe(true);

    // Verify second task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, 2))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].description).toBe('Task 2');

    // Verify second task's time entries still exist
    const remainingTimeEntries = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, 2))
      .execute();

    expect(remainingTimeEntries).toHaveLength(1);
    expect(remainingTimeEntries[0].minutes).toBe(45);

    // Verify first task's time entries are deleted
    const deletedTimeEntries = await db.select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.task_id, 1))
      .execute();

    expect(deletedTimeEntries).toHaveLength(0);
  });
});
