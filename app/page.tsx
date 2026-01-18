'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import OceanBall from './components/OceanBall';
import TaskDrawer from './components/TaskDrawer';
import ArchiveList from './components/ArchiveList';
import { UserAvatar } from './components/UserAvatar';
import { useDateTime } from './hooks/useDateTime';
import { Task, apiTaskToTask } from './utils/taskUtils';
import { taskAPI } from './services/taskAPI';
import { ApiMilestone } from './types/database';
import { PHYSICS, RIPPLE, CLICK_THRESHOLD, RENDER, TASK_CREATION, PROGRESS, BOUNDS, VISUAL_BOUNDS, FLOAT_BOUNDS, BALL_COLORS } from './constants';
import { SpatialGrid } from './utils/spatialGrid';

export default function Home() {
  const { data: session, status } = useSession();
  const { currentTime, currentDate } = useDateTime();

  // 状态管理（之前在 Zustand）
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI 状态
  const [showArchive, setShowArchive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [mouseDownInfo, setMouseDownInfo] = useState<{ taskId: string; x: number; y: number; time: number } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const spatialGridRef = useRef(new SpatialGrid());
  const physicsStateRef = useRef<Task[]>([]);
  const physicsMapRef = useRef<Map<string, Task>>(new Map());
  const [, forceUpdate] = useState({});

  // 定义任务更新的 API payload 类型
  interface TaskUpdatePayload {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    priority?: string | null;
    tags?: string[];
    progress?: number;
    archived?: boolean;
    color?: string;
    density?: number;
    completedAt?: string;
  }

  // 加载所有任务(登录时调用)
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiTasks = await taskAPI.getTasks();
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      const allTasks = apiTasks.map((apiTask) => {
        const task = apiTaskToTask(apiTask, screenWidth);
        task.milestones = (apiTask.milestones || []).map((m: ApiMilestone) => ({
          id: m.id,
          text: m.title,
          completed: m.completed,
        }));
        return task;
      });

      const activeTasks = allTasks.filter(t => !t.archived);
      const archived = allTasks.filter(t => t.archived);

      setTasks(activeTasks);
      setArchivedTasks(archived);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to load tasks');
      setError((error as Error).message);
      setIsLoading(false);
    }
  }, []);

  // 更新任务
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setIsLoading(true);
    setError(null);

    try {
      // 准备 API 更新数据
      const apiUpdates: TaskUpdatePayload = {};
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

      // 调用 API
      if (Object.keys(apiUpdates).length > 0) {
        await taskAPI.updateTask(taskId, apiUpdates);
      }

      // 更新本地缓存
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
      }

      // 归档时需要重新分类
      if (apiUpdates.archived) {
        await loadTasks();
      }

      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to update task');
      setError((error as Error).message);
      setIsLoading(false);
    }
  }, [selectedTask, loadTasks]);

  // 创建任务
  const createTask = useCallback(async (title: string, x: number, dueDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const density = BOUNDS.TOP + Math.random() * (BOUNDS.BOTTOM - BOUNDS.TOP);
      const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];

      await taskAPI.createTask({
        title,
        dueDate: dueDate || undefined,
        color,
        density,
      });

      await loadTasks();
      return null;
    } catch (error) {
      toast.error('Failed to create task');
      setError((error as Error).message);
      setIsLoading(false);
      return null;
    }
  }, [loadTasks]);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await taskAPI.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      toast.error('Failed to delete task');
      setError((error as Error).message);
      setIsLoading(false);
    }
  }, [loadTasks]);

  // Load tasks from database when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadTasks();
    }
  }, [status, session, loadTasks]);

  // Sync tasks with physics state
  useEffect(() => {
    // For each task in the store, either update existing physics state or add new one
    const updatedPhysicsState = tasks.map(storeTask => {
      const existingPhysics = physicsStateRef.current.find(p => p.id === storeTask.id);
      if (existingPhysics) {
        // Keep physics properties, update other properties
        return { ...storeTask, x: existingPhysics.x, y: existingPhysics.y, vx: existingPhysics.vx, vy: existingPhysics.vy };
      } else {
        // New task, use the properties from store (which already has random x, y, etc.)
        return storeTask;
      }
    });

    physicsStateRef.current = updatedPhysicsState;
    physicsMapRef.current = new Map(updatedPhysicsState.map(t => [t.id, t]));
  }, [tasks]);

  useEffect(() => {
    let frameCount = 0;
    const animate = () => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();

      const prev = physicsStateRef.current;
      const updated = prev.map(task => {
        if (draggedTask === task.id) return task;

        let { x, y, vx, vy } = task;

        // 计算浮动范围：从上边界到下边界
        const floatRangeTop = VISUAL_BOUNDS.TOP + FLOAT_BOUNDS.TOP_OFFSET;
        const floatRangeBottom = bounds.height - VISUAL_BOUNDS.BOTTOM - FLOAT_BOUNDS.BOTTOM_OFFSET;
        const floatRangeHeight = floatRangeBottom - floatRangeTop;

        // 将 density (0.15-0.8) 映射到浮动范围内的目标位置
        const normalizedDensity = (task.density - BOUNDS.TOP) / (BOUNDS.BOTTOM - BOUNDS.TOP);
        const targetY = floatRangeTop + normalizedDensity * floatRangeHeight;

        const restoreForce = -(y - targetY) * PHYSICS.RESTORE_FORCE;

        vy += restoreForce;
        vx *= PHYSICS.AIR_RESISTANCE;
        vy *= PHYSICS.AIR_RESISTANCE;
        x += vx;
        y += vy;

        const leftBound = bounds.width * BOUNDS.LEFT;
        const rightBound = bounds.width * BOUNDS.RIGHT;
        const topBound = VISUAL_BOUNDS.TOP + FLOAT_BOUNDS.TOP_OFFSET;
        const bottomBound = bounds.height - VISUAL_BOUNDS.BOTTOM - FLOAT_BOUNDS.BOTTOM_OFFSET;

        if (x - task.radius < leftBound) { x = leftBound + task.radius; vx = Math.abs(vx) * PHYSICS.BOUNCE_DAMPING; }
        if (x + task.radius > rightBound) { x = rightBound - task.radius; vx = -Math.abs(vx) * PHYSICS.BOUNCE_DAMPING; }
        if (y + task.radius > bottomBound) { y = bottomBound - task.radius; vy = -Math.abs(vy) * PHYSICS.BOUNCE_DAMPING; vx *= PHYSICS.FRICTION; }
        if (y - task.radius < topBound) { y = topBound + task.radius; vy = Math.abs(vy) * PHYSICS.BOUNCE_DAMPING; }

        return { ...task, x, y, vx, vy };
      });

      const grid = spatialGridRef.current;
      grid.clear();
      updated.forEach(task => grid.insert(task));

      updated.forEach(task => {
        const nearby = grid.getNearby(task);
        nearby.forEach(other => {
          if (task.id === other.id) return;
          const dx = other.x - task.x;
          const dy = other.y - task.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = task.radius + other.radius;

          if (dist < minDist && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const overlap = minDist - dist;
            task.x -= Math.cos(angle) * overlap / 2;
            task.y -= Math.sin(angle) * overlap / 2;
            other.x += Math.cos(angle) * overlap / 2;
            other.y += Math.sin(angle) * overlap / 2;

            const dvx = other.vx - task.vx;
            const dvy = other.vy - task.vy;
            const dvDotD = dvx * dx + dvy * dy;
            if (dvDotD < 0) {
              const impulse = dvDotD / (dist * dist);
              task.vx += impulse * dx * PHYSICS.COLLISION_DAMPING;
              task.vy += impulse * dy * PHYSICS.COLLISION_DAMPING;
              other.vx -= impulse * dx * PHYSICS.COLLISION_DAMPING;
              other.vy -= impulse * dy * PHYSICS.COLLISION_DAMPING;
            }
          }
        });
      });

      const filtered = updated.filter(task => task.progress <= PROGRESS.MAX);
      physicsStateRef.current = filtered;
      physicsMapRef.current = new Map(filtered.map(t => [t.id, t]));

      if (filtered.length !== prev.length) {
        setTasks(filtered);
      }

      frameCount++;
      if (frameCount % RENDER.FRAME_SKIP === 0) {
        forceUpdate({});
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [draggedTask]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const container = containerRef.current;
    const width = container ? container.getBoundingClientRect().width : 800;
    const x = Math.random() * (width - TASK_CREATION.PADDING) + TASK_CREATION.OFFSET;

    await createTask(newTaskTitle, x, newTaskDueDate || undefined);

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setShowAddDialog(false);
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    if (e.button === 0) {
      e.stopPropagation();
      setDraggedTask(taskId);
      setMouseDownInfo({ taskId, x: e.clientX, y: e.clientY, time: Date.now() });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedTask && containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      physicsStateRef.current = physicsStateRef.current.map(t =>
        t.id === draggedTask ? { ...t, x, y, vx: 0, vy: 0 } : t
      );
    }
  };

  const handleMouseUp = (e: React.MouseEvent, taskId: string) => {
    let isClick = false;
    if (mouseDownInfo && mouseDownInfo.taskId === taskId) {
      const dx = e.clientX - mouseDownInfo.x;
      const dy = e.clientY - mouseDownInfo.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - mouseDownInfo.time;

      if (distance < CLICK_THRESHOLD.DISTANCE && duration < CLICK_THRESHOLD.TIME) {
        isClick = true;
        const task = physicsStateRef.current.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
        }
      }
    }
    setDraggedTask(null);
    setMouseDownInfo(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const clickX = e.clientX - bounds.left;
    const clickY = e.clientY - bounds.top;

    const rippleId = Date.now();
    setRipples(prev => [...prev, { id: rippleId, x: clickX, y: clickY }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rippleId)), RIPPLE.DURATION);

    physicsStateRef.current = physicsStateRef.current.map(task => {
      const dx = task.x - clickX;
      const dy = task.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < RIPPLE.RADIUS && distance > 0) {
        const force = (RIPPLE.RADIUS - distance) / RIPPLE.FORCE_DIVISOR;
        const angle = Math.atan2(dy, dx);
        return {
          ...task,
          vx: task.vx + Math.cos(angle) * force,
          vy: task.vy + Math.sin(angle) * force
        };
      }
      return task;
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <TaskDrawer
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        updateTask={updateTask}
      />
      {showArchive && (
        <ArchiveList
          archivedTasks={archivedTasks}
          onClose={() => setShowArchive(false)}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-50/50 to-indigo-100/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm border-b border-blue-300/30 dark:border-gray-700/30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Ocean Ball Tasks</div>
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : session ? (
              <>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowArchive(true)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Archive
                </button>
                <UserAvatar user={session.user} />
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
                    Login
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-md">
                    Start for Free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-9xl font-bold text-gray-300/50 dark:text-gray-600/50">{currentTime}</div>
        <div className="text-3xl font-medium text-gray-300/40 dark:text-gray-600/40 mt-4">{currentDate}</div>
      </div>

      {/* Boundary lines */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${VISUAL_BOUNDS.TOP}px` }}>
        <div className="border-t-2 border-dashed border-blue-300/40"></div>
      </div>
      <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${VISUAL_BOUNDS.BOTTOM}px` }}>
        <div className="border-t-2 border-dashed border-blue-300/40"></div>
      </div>
      <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${VISUAL_BOUNDS.LEFT * 100}%` }}>
        <div className="border-l-2 border-dashed border-blue-300/40 h-full"></div>
      </div>
      <div className="absolute top-0 bottom-0 pointer-events-none" style={{ right: `${(1 - VISUAL_BOUNDS.RIGHT) * 100}%` }}>
        <div className="border-r-2 border-dashed border-blue-300/40 h-full"></div>
      </div>

      <div ref={containerRef} className="absolute inset-0" onMouseMove={handleMouseMove} onMouseUp={() => { setDraggedTask(null); setMouseDownInfo(null); }} onClick={(e) => { if (e.target === e.currentTarget) { handleBackgroundClick(e); } }}>
        {ripples.map(ripple => (
          <div key={ripple.id} className="absolute pointer-events-none" style={{ left: ripple.x, top: ripple.y }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-blue-400 ripple-animate" />
            <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-300 ripple-animate" style={{ animationDelay: '0.2s' }} />
          </div>
        ))}
        {tasks.map(task => {
          const displayTask = physicsMapRef.current.get(task.id) || task;
          return (
            <OceanBall
              key={task.id}
              task={displayTask}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => {}}
              onComplete={(taskId) => updateTask(taskId, { progress: PROGRESS.COMPLETE })}
            />
          );
        })}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Task</div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
              autoFocus
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addTask} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">Create</button>
              <button onClick={() => { setShowAddDialog(false); setNewTaskTitle(''); setNewTaskDueDate(''); }} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-50/50 to-indigo-100/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm border-t border-blue-300/30 dark:border-gray-700/30">
        <div className="px-6 py-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Ocean Ball Tasks - Innovative Physics-Based Task Management
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Visual Task Management System with Physics Engine | Make Task Management Fun
          </p>
        </div>
      </footer>
    </div>
  );
}
