import { create } from 'zustand';
import { Task, apiTaskToTask } from '../utils/taskUtils';
import { taskAPI } from '../services/taskAPI';
import { PROGRESS, BOUNDS, BALL_COLORS } from '../constants';

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
      // API 已经返回包含 milestones 的完整数据
      const apiTasks = await taskAPI.getTasks();
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      // 转换 API 数据为前端 Task 格式
      const allTasks = apiTasks.map((apiTask) => {
        const task = apiTaskToTask(apiTask, screenWidth);

        // API 已经包含 milestones，直接转换格式
        task.milestones = (apiTask.milestones || []).map((m: any) => ({
          id: m.id,
          text: m.title,
          completed: m.completed,
        }));

        return task;
      });

      // 分离 active 和 archived tasks
      const tasks = allTasks.filter(t => !t.archived);
      const archivedTasks = allTasks.filter(t => t.archived);

      set({ tasks, archivedTasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTask: async (title: string, x: number, dueDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Generate random color and density for new task
      const density = BOUNDS.TOP + Math.random() * (BOUNDS.BOTTOM - BOUNDS.TOP);
      const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];

      await taskAPI.createTask({
        title,
        dueDate: dueDate || undefined,
        color,
        density,
      });

      // Reload all tasks from database to ensure consistency
      await get().loadTasks();

      return null; // We don't return the task anymore since we reload
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateTask: async (taskId, updates) => {
    set({ isLoading: true, error: null });

    try {
      // 1. 准备 API 更新数据（只发送数据库字段）
      const apiUpdates: any = {};
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate;
      if (updates.priority !== undefined) apiUpdates.priority = updates.priority;
      if (updates.tags !== undefined) apiUpdates.tags = updates.tags;
      if (updates.progress !== undefined) apiUpdates.progress = updates.progress;
      if (updates.archived !== undefined) apiUpdates.archived = updates.archived;
      if (updates.color !== undefined) apiUpdates.color = updates.color;
      if (updates.density !== undefined) apiUpdates.density = updates.density;

      // 归档逻辑
      if (updates.progress === PROGRESS.COMPLETE || updates.archived) {
        apiUpdates.archived = true;
        apiUpdates.completedAt = new Date().toISOString();
      }

      // 2. 先调用 API 持久化
      if (Object.keys(apiUpdates).length > 0) {
        await taskAPI.updateTask(taskId, apiUpdates);
      }

      // 3. API 成功后，更新本地缓存
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
        selectedTask: state.selectedTask?.id === taskId
          ? { ...state.selectedTask, ...updates }
          : state.selectedTask,
        isLoading: false,
      }));

      // 4. 归档时需要重新分类，reload
      if (apiUpdates.archived) {
        await get().loadTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });

    try {
      await taskAPI.deleteTask(taskId);

      // Reload all tasks from database to ensure consistency
      await get().loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
