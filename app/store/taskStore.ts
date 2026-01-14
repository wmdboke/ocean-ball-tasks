import { create } from 'zustand';
import { Task } from '../utils/taskUtils';

interface TaskStore {
  selectedTask: Task | null;
  tasks: Task[];
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[]), persist?: boolean) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  selectedTask: null,
  tasks: [],
  setSelectedTask: (task) => set({ selectedTask: task }),
  setTasks: (tasks, persist = true) => {
    const newTasks = typeof tasks === 'function' ? tasks(get().tasks) : tasks;
    set({ tasks: newTasks });
    if (persist && typeof window !== 'undefined') {
      const tasksToSave = newTasks.map(({ x, y, vx, vy, ...rest }) => rest);
      localStorage.setItem('ocean-ball-tasks', JSON.stringify(tasksToSave));
    }
  },
  updateTask: (taskId, updates) => {
    const tasks = get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    set({ tasks });
    if (typeof window !== 'undefined') {
      const tasksToSave = tasks.map(({ x, y, vx, vy, ...rest }) => rest);
      localStorage.setItem('ocean-ball-tasks', JSON.stringify(tasksToSave));
    }
    const selectedTask = get().selectedTask;
    if (selectedTask?.id === taskId) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        set({ selectedTask: updatedTask });
      }
    }
  },
}));
