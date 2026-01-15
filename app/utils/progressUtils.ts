import { PROGRESS } from '../constants';

export function calculateProgress(milestones: { completed: boolean }[]): number {
  if (milestones.length === 0) return 0;
  const completedCount = milestones.filter(m => m.completed).length;
  return Math.round((completedCount / milestones.length) * PROGRESS.MAX);
}
