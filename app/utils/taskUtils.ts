import { BALL_COLORS, BALL, BOUNDS, DENSITY } from '../constants';
import { ApiTask } from '../types/database';

export interface Task {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  progress: number;
  milestones: { id?: string; text: string; completed: boolean }[]; // 添加 id 字段（可选，用于 API 操作）
  color: string;
  title: string;
  density: number;
  createdAt: string;
  completedAt?: string;
  // Additional fields from database
  description?: string | null;
  dueDate?: string | null;
  priority?: string | null;
  tags?: string[];
  archived?: boolean;
}

// Convert API task to frontend Task with physics properties
export function apiTaskToTask(apiTask: ApiTask, screenWidth: number = 1200): Task {
  const leftBound = screenWidth * BOUNDS.LEFT;
  const rightBound = screenWidth * BOUNDS.RIGHT;
  const effectiveWidth = rightBound - leftBound;

  // Use stored color and density from database
  const density = apiTask.density;
  const color = apiTask.color;

  const radius = BALL.RADIUS * (DENSITY.MIN_MULTIPLIER + density * DENSITY.RANGE_MULTIPLIER);
  const x = leftBound + Math.random() * effectiveWidth;

  return {
    id: apiTask.id,
    x,
    y: BALL.INITIAL_Y, // Start from top, will drop down
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    radius,
    progress: apiTask.progress,
    milestones: [], // Will be loaded separately
    color,
    title: apiTask.title,
    density,
    createdAt: apiTask.createAt,
    completedAt: apiTask.completedAt || undefined,
    description: apiTask.description,
    dueDate: apiTask.dueDate,
    priority: apiTask.priority,
    tags: apiTask.tags || [],
    archived: apiTask.archived,
  };
}

export function createTask(title: string, x: number): Task {
  const density = BOUNDS.TOP + Math.random() * (BOUNDS.BOTTOM - BOUNDS.TOP);
  const radius = BALL.RADIUS * (DENSITY.MIN_MULTIPLIER + density * DENSITY.RANGE_MULTIPLIER);
  return {
    id: Date.now().toString(),
    x,
    y: BALL.INITIAL_Y,
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    radius,
    progress: 0,
    milestones: [],
    color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
    title,
    density,
    createdAt: new Date().toISOString(),
  };
}

export function createDefaultTasks(): Task[] {
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const leftBound = screenWidth * BOUNDS.LEFT;
  const rightBound = screenWidth * BOUNDS.RIGHT;
  const effectiveWidth = rightBound - leftBound;

  return ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'].map((title, i) => {
    const density = BOUNDS.TOP + Math.random() * (BOUNDS.BOTTOM - BOUNDS.TOP);
    const radius = BALL.RADIUS * (DENSITY.MIN_MULTIPLIER + density * DENSITY.RANGE_MULTIPLIER);
    return {
      id: `default-${i}`,
      x: leftBound + Math.random() * effectiveWidth,
      y: BALL.INITIAL_Y,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      radius,
      progress: 0,
      milestones: [],
      color: BALL_COLORS[i],
      title,
      density,
      createdAt: new Date().toISOString(),
    };
  });
}
