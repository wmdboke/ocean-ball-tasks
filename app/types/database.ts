// Database Task type (matches database schema)
export interface DbTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string | null;
  tags: string[] | null;
  progress: number;
  archived: boolean;
  color: string;
  density: number;
  createAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

// Database Milestone type (matches database schema)
export interface DbMilestone {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  order: number;
  completed: boolean;
  createAt: Date;
  completedAt: Date | null;
}

// API response types
export interface ApiTask extends Omit<DbTask, 'createAt' | 'updatedAt' | 'completedAt' | 'dueDate'> {
  createAt: string;
  updatedAt: string;
  completedAt: string | null;
  dueDate: string | null;
  milestones?: ApiMilestone[]; // API 返回时包含 milestones
}

export interface ApiMilestone extends Omit<DbMilestone, 'createAt' | 'completedAt'> {
  createAt: string;
  completedAt: string | null;
}
