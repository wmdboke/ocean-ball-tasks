import { Task } from './taskUtils';

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Task[]>;

  constructor(cellSize: number = 150) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear() {
    this.grid.clear();
  }

  insert(task: Task) {
    const key = this.getKey(task.x, task.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(task);
  }

  getNearby(task: Task): Task[] {
    const nearby: Task[] = [];
    const cellX = Math.floor(task.x / this.cellSize);
    const cellY = Math.floor(task.y / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cell = this.grid.get(key);
        if (cell) nearby.push(...cell);
      }
    }
    return nearby;
  }
}
