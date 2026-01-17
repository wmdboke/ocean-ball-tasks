import { create } from 'zustand';
import { Task, apiTaskToTask } from '../utils/taskUtils';
import { taskAPI } from '../services/taskAPI';
import { PROGRESS } from '../constants';

interface TaskStore {
  selectedTask: Task | null;
  tasks: Task[];
  archivedTasks: Task[];
  isLoading: boolean;
  error: string | null;
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[]), persist?: boolean) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  loadTasks: () => Promise<void>;
  createTask: (title: string, x: number, dueDate?: string) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  selectedTask: null,
  tasks: [],
  archivedTasks: [],
  isLoading: false,
  error: null,

  setSelectedTask: (task) => set({ selectedTask: task }),

  setTasks: (tasks, persist = true) => {
    const newTasks = typeof tasks === 'function' ? tasks(get().tasks) : tasks;
    set({ tasks: newTasks });
  },

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const apiTasks = await taskAPI.getTasks();
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      // Convert API tasks to frontend tasks with physics properties
      const tasks = apiTasks
        .filter(t => !t.archived)
        .map(t => apiTaskToTask(t, screenWidth));

      const archivedTasks = apiTasks
        .filter(t => t.archived)
        .map(t => apiTaskToTask(t, screenWidth));

      set({ tasks, archivedTasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTask: async (title: string, x: number, dueDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const apiTask = await taskAPI.createTask({
        title,
        dueDate: dueDate || undefined,
      });
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const newTask = apiTaskToTask(apiTask, screenWidth);

      // Override x position with provided value
      newTask.x = x;

      set(state => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));

      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateTask: async (taskId, updates) => {
    // Optimistic update
    const previousTasks = get().tasks;
    const previousArchived = get().archivedTasks;

    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    }));

    // Update selected task if it's the one being updated
    const selectedTask = get().selectedTask;
    if (selectedTask?.id === taskId) {
      set({ selectedTask: { ...selectedTask, ...updates } });
    }

    try {
      // Prepare data for API (only send fields that exist in database)
      const apiUpdates: any = {};
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate;
      if (updates.priority !== undefined) apiUpdates.priority = updates.priority;
      if (updates.tags !== undefined) apiUpdates.tags = updates.tags;
      if (updates.progress !== undefined) apiUpdates.progress = updates.progress;
      if (updates.archived !== undefined) apiUpdates.archived = updates.archived;

      await taskAPI.updateTask(taskId, apiUpdates);

      // Handle archiving logic
      if (updates.progress === PROGRESS.COMPLETE || updates.archived) {
        const task = get().tasks.find(t => t.id === taskId);
        if (task) {
          const taskWithCompletedTime = {
            ...task,
            completedAt: new Date().toISOString(),
            archived: true,
          };

          set(state => ({
            tasks: state.tasks.filter(t => t.id !== taskId),
            archivedTasks: [...state.archivedTasks, taskWithCompletedTime],
          }));
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      // Rollback on error
      set({ tasks: previousTasks, archivedTasks: previousArchived });
      set({ error: (error as Error).message });
    }
  },

  deleteTask: async (taskId) => {
    const previousTasks = get().tasks;

    // Optimistic delete
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
    }));

    try {
      await taskAPI.deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Rollback on error
      set({ tasks: previousTasks, error: (error as Error).message });
    }
  },
}));
