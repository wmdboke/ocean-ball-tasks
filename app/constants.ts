export const BALL_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

export const PHYSICS = {
  RESTORE_FORCE: 0.01,
  AIR_RESISTANCE: 0.98,
  BOUNCE_DAMPING: 0.8,
  COLLISION_DAMPING: 0.8,
  FRICTION: 0.95,
} as const;

// 虚线边界位置（固定像素值，用于显示）
export const VISUAL_BOUNDS = {
  TOP: 72,      // 上虚线位置（header 高度）
  BOTTOM: 64,   // 下虚线位置（footer 高度）
  LEFT: 0.1,    // 左虚线位置（10%）
  RIGHT: 0.9,   // 右虚线位置（90%）
} as const;

// 海洋球浮动边界（相对于虚线的偏移量）
export const FLOAT_BOUNDS = {
  TOP_OFFSET: 80,      // 上虚线往下的像素偏移量（最高浮动位置）
  BOTTOM_OFFSET: 80,   // 下虚线往上的像素偏移量（最低浮动位置）
} as const;

// 旧的 BOUNDS 保留用于左右边界百分比（兼容性）
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
