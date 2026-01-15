import { BALL_COLORS, BALL, BOUNDS, DENSITY } from '../constants';

export interface Task {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  progress: number;
  milestones: { text: string; completed: boolean }[];
  color: string;
  title: string;
  density: number;
  createdAt: string;
  completedAt?: string;
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

  return ['任务1', '任务2', '任务3', '任务4', '任务5'].map((title, i) => {
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
