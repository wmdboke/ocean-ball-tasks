import { create } from 'zustand';
import { Task } from '../utils/taskUtils';

interface TaskStore {
  selectedTask: Task | null;
  tasks: Task[];
  archivedTasks: Task[];
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[]), persist?: boolean) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  selectedTask: null,
  tasks: [],
  archivedTasks: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('ocean-ball-archived') || '[]')
    : [],
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

    // 如果进度设置为 101，归档任务并记录完成时间
    if (updates.progress === 101) {
      const archivedTask = tasks.find(t => t.id === taskId);
      if (archivedTask) {
        const taskWithCompletedTime = { ...archivedTask, completedAt: new Date().toISOString() };
        const archivedTasks = [...get().archivedTasks, taskWithCompletedTime];
        set({ archivedTasks });
        if (typeof window !== 'undefined') {
          localStorage.setItem('ocean-ball-archived', JSON.stringify(archivedTasks));
        }
      }
    }

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
