
import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  total_time_minutes: integer('total_time_minutes').notNull().default(0), // Total time in minutes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const timeEntriesTable = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
  minutes: integer('minutes').notNull(), // Time spent in minutes for this entry
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const tasksRelations = relations(tasksTable, ({ many }) => ({
  timeEntries: many(timeEntriesTable),
}));

export const timeEntriesRelations = relations(timeEntriesTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [timeEntriesTable.task_id],
    references: [tasksTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
export type TimeEntry = typeof timeEntriesTable.$inferSelect;
export type NewTimeEntry = typeof timeEntriesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  tasks: tasksTable, 
  timeEntries: timeEntriesTable 
};
