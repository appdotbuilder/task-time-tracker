
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Form state for creating new tasks
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // State for adding time to tasks
  const [timeInputs, setTimeInputs] = useState<Record<number, string>>({});
  const [addingTimeFor, setAddingTimeFor] = useState<number | null>(null);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    setIsCreatingTask(true);
    try {
      const taskInput: CreateTaskInput = {
        description: newTaskDescription.trim()
      };
      const newTask = await trpc.createTask.mutate(taskInput);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Add time to a task
  const handleAddTime = async (taskId: number) => {
    const minutesStr = timeInputs[taskId];
    if (!minutesStr || !minutesStr.trim()) return;

    const minutes = parseInt(minutesStr);
    if (isNaN(minutes) || minutes <= 0) return;

    setAddingTimeFor(taskId);
    try {
      const updatedTask = await trpc.addTime.mutate({
        task_id: taskId,
        minutes: minutes
      });
      
      // Update the task in the list
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => 
          task.id === taskId ? updatedTask : task
        )
      );
      
      // Clear the time input for this task
      setTimeInputs((prev: Record<number, string>) => ({
        ...prev,
        [taskId]: ''
      }));
    } catch (error) {
      console.error('Failed to add time:', error);
    } finally {
      setAddingTimeFor(null);
    }
  };

  // Format minutes to hours and minutes
  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '0 minutes';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  // Update time input for a specific task
  const updateTimeInput = (taskId: number, value: string) => {
    setTimeInputs((prev: Record<number, string>) => ({
      ...prev,
      [taskId]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">⏳ Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Task Manager</h1>
        <p className="text-gray-600">Track your daily tasks and time spent on each one</p>
      </div>

      {/* Create new task form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">✨ Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTask} className="flex gap-3">
            <Input
              placeholder="What do you need to get done?"
              value={newTaskDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNewTaskDescription(e.target.value)
              }
              className="flex-1"
              required
            />
            <Button 
              type="submit" 
              disabled={isCreatingTask || !newTaskDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingTask ? 'Creating...' : 'Add Task'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No tasks yet!</h2>
            <p className="text-gray-600">Create your first task above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Tasks ({tasks.length})
            </h2>
            <Badge variant="secondary" className="text-sm">
              Total: {formatTime(tasks.reduce((sum: number, task: Task) => sum + task.total_time_minutes, 0))}
            </Badge>
          </div>

          {tasks.map((task: Task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {task.description}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⏱️ {formatTime(task.total_time_minutes)}</span>
                      <span>📅 Created {task.created_at.toLocaleDateString()}</span>
                      {task.updated_at.getTime() !== task.created_at.getTime() && (
                        <span>🔄 Updated {task.updated_at.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={task.total_time_minutes > 0 ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {formatTime(task.total_time_minutes)}
                  </Badge>
                </div>

                <Separator className="mb-4" />

                {/* Add time section */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Add time:</span>
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={timeInputs[task.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      updateTimeInput(task.id, e.target.value)
                    }
                    className="w-24"
                    min="1"
                    max="1440" // Max 24 hours
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                  <Button
                    onClick={() => handleAddTime(task.id)}
                    disabled={
                      !timeInputs[task.id] || 
                      addingTimeFor === task.id ||
                      parseInt(timeInputs[task.id]) <= 0
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {addingTimeFor === task.id ? '⏳' : '➕'} Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
