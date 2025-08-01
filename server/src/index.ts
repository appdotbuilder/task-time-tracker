
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  addTimeInputSchema, 
  getTaskInputSchema, 
  deleteTaskInputSchema 
} from './schema';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTask } from './handlers/get_task';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { addTime } from './handlers/add_time';
import { getTimeEntries } from './handlers/get_time_entries';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Task management procedures
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
    
  getTasks: publicProcedure
    .query(() => getTasks()),
    
  getTask: publicProcedure
    .input(getTaskInputSchema)
    .query(({ input }) => getTask(input)),
    
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
    
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),
    
  // Time tracking procedures
  addTime: publicProcedure
    .input(addTimeInputSchema)
    .mutation(({ input }) => addTime(input)),
    
  getTimeEntries: publicProcedure
    .input(getTaskInputSchema)
    .query(({ input }) => getTimeEntries(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
