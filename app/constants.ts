export const BALL_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

export const PHYSICS = {
  RESTORE_FORCE: 0.01,
  AIR_RESISTANCE: 0.98,
  BOUNCE_DAMPING: 0.8,
  COLLISION_DAMPING: 0.8,
  FRICTION: 0.95,
} as const;

export const BOUNDS = {
  TOP: 0.15,
  BOTTOM: 0.8,
  LEFT: 0.1,
  RIGHT: 0.9,
} as const;

export const RIPPLE = {
  RADIUS: 300,
  DURATION: 1500,
  FORCE_DIVISOR: 30,
} as const;

export const BALL = {
  RADIUS: 50,
  INITIAL_Y: 50,
} as const;

export const CLICK_THRESHOLD = {
  DISTANCE: 5,
  TIME: 300,
} as const;

export const RENDER = {
  FRAME_SKIP: 2,
} as const;

export const TASK_CREATION = {
  PADDING: 200,
  OFFSET: 100,
} as const;

export const PROGRESS = {
  MAX: 100,
  COMPLETE: 101,
} as const;

export const DENSITY = {
  MIN_MULTIPLIER: 0.7,
  RANGE_MULTIPLIER: 0.6,
} as const;
