import { ApiTask, ApiMilestone } from '../types/database';

class TaskAPI {
  private async fetchWithAuth(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Tasks
  async getTasks(): Promise<ApiTask[]> {
    return this.fetchWithAuth('/api/tasks');
  }

  async createTask(data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    tags?: string[];
    color: string;
    density: number;
  }): Promise<ApiTask> {
    return this.fetchWithAuth('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      dueDate: string | null;
      priority: string | null;
      tags: string[];
      progress: number;
      archived: boolean;
      completedAt: string;
      color: string;
      density: number;
    }>
  ): Promise<ApiTask> {
    return this.fetchWithAuth(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.fetchWithAuth(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Milestones
  async getMilestones(taskId: string): Promise<ApiMilestone[]> {
    return this.fetchWithAuth(`/api/milestones?taskId=${taskId}`);
  }

  async createMilestone(data: {
    taskId: string;
    title: string;
    description?: string;
    order?: number;
  }): Promise<ApiMilestone> {
    return this.fetchWithAuth('/api/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMilestone(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      order: number;
      completed: boolean;
      completedAt: string;
    }>
  ): Promise<ApiMilestone> {
    return this.fetchWithAuth(`/api/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMilestone(id: string): Promise<{ message: string }> {
    return this.fetchWithAuth(`/api/milestones/${id}`, {
      method: 'DELETE',
    });
  }
}

export const taskAPI = new TaskAPI();
