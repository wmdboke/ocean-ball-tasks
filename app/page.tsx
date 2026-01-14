'use client';

import { useState, useEffect, useRef } from 'react';
import OceanBall from './components/OceanBall';
import TaskDrawer from './components/TaskDrawer';
import { useDateTime } from './hooks/useDateTime';
import { useTaskStore } from './store/taskStore';
import { Task, createTask, createDefaultTasks } from './utils/taskUtils';
import { PHYSICS, RIPPLE, CLICK_THRESHOLD } from './constants';

export default function Home() {
  const { currentTime, currentDate } = useDateTime();
  const { tasks, setTasks } = useTaskStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [mouseDownInfo, setMouseDownInfo] = useState<{ taskId: string; x: number; y: number; time: number } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem('ocean-ball-tasks');
    if (saved && saved !== 'undefined') {
      try {
        const savedTasks = JSON.parse(saved);
        const container = containerRef.current;
        const bounds = container?.getBoundingClientRect();
        const width = bounds?.width || 1200;

        const tasksWithPhysics = savedTasks.map((task: any) => ({
          ...task,
          x: task.x || Math.random() * width,
          y: task.y || 100,
          vx: task.vx || 0,
          vy: task.vy || 0,
        }));
        setTasks(tasksWithPhysics, false);
      } catch {
        localStorage.removeItem('ocean-ball-tasks');
        setTasks(createDefaultTasks());
      }
    } else {
      setTasks(createDefaultTasks());
    }
  }, [setTasks]);

  useEffect(() => {
    const animate = () => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();

      setTasks(prev => {
        return prev.map(task => {
          if (draggedTask === task.id) return task;

          let { x, y, vx, vy } = task;
          const targetY = bounds.height * task.density;
          const restoreForce = -(y - targetY) * PHYSICS.RESTORE_FORCE;

          vy += restoreForce;
          vx *= PHYSICS.AIR_RESISTANCE;
          vy *= PHYSICS.AIR_RESISTANCE;
          x += vx;
          y += vy;

          // Bounce off walls
          if (x - task.radius < 0) { x = task.radius; vx = Math.abs(vx) * PHYSICS.BOUNCE_DAMPING; }
          if (x + task.radius > bounds.width) { x = bounds.width - task.radius; vx = -Math.abs(vx) * PHYSICS.BOUNCE_DAMPING; }
          if (y + task.radius > bounds.height) { y = bounds.height - task.radius; vy = -Math.abs(vy) * PHYSICS.BOUNCE_DAMPING; vx *= PHYSICS.FRICTION; }
          if (y - task.radius < 0) { y = task.radius; vy = Math.abs(vy) * PHYSICS.BOUNCE_DAMPING; }

          return { ...task, x, y, vx, vy };
        }).map((task, i, arr) => {
          // Collision detection
          for (let j = i + 1; j < arr.length; j++) {
            const other = arr[j];
            const dx = other.x - task.x;
            const dy = other.y - task.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = task.radius + other.radius;

            if (dist < minDist) {
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
          }
          return task;
        }).filter(task => task.progress < 100);
      }, false);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [draggedTask]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const container = containerRef.current;
    const width = container ? container.getBoundingClientRect().width : 800;
    const newTask = createTask(newTaskTitle, Math.random() * (width - 200) + 100);
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setShowAddDialog(false);
    setIsMenuOpen(false);
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
      setTasks(prev => prev.map(t => t.id === draggedTask ? { ...t, x: e.clientX - bounds.left, y: e.clientY - bounds.top, vx: 0, vy: 0 } : t));
    }
  };

  const handleMouseUp = (e: React.MouseEvent, taskId: string) => {
    if (mouseDownInfo && mouseDownInfo.taskId === taskId) {
      const dx = e.clientX - mouseDownInfo.x;
      const dy = e.clientY - mouseDownInfo.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - mouseDownInfo.time;

      if (distance < CLICK_THRESHOLD.DISTANCE && duration < CLICK_THRESHOLD.TIME) {
        setContextMenu(taskId);
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

    setTasks(prev => prev.map(task => {
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
    }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <TaskDrawer />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-9xl font-bold text-gray-300/50 dark:text-gray-600/50">{currentTime}</div>
        <div className="text-3xl font-medium text-gray-300/40 dark:text-gray-600/40 mt-4">{currentDate}</div>
      </div>

      {/* Boundary lines */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '10%' }}>
        <div className="border-t-2 border-dashed border-blue-300/40"></div>
      </div>
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '75%' }}>
        <div className="border-t-2 border-dashed border-blue-300/40"></div>
      </div>
      <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: '10%' }}>
        <div className="border-l-2 border-dashed border-blue-300/40 h-full"></div>
      </div>
      <div className="absolute top-0 bottom-0 pointer-events-none" style={{ right: '10%' }}>
        <div className="border-r-2 border-dashed border-blue-300/40 h-full"></div>
      </div>


      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className="block h-0.5 w-full bg-gray-800 dark:bg-gray-200"></span>
          <span className="block h-0.5 w-full bg-gray-800 dark:bg-gray-200"></span>
          <span className="block h-0.5 w-full bg-gray-800 dark:bg-gray-200"></span>
        </div>
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-16 left-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <button onClick={() => { setShowAddDialog(true); setIsMenuOpen(false); }} className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700">新增任务球</button>
            <button onClick={() => { alert('归档记录'); setIsMenuOpen(false); }} className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700">归档记录</button>
          </div>
        </>
      )}

      <div ref={containerRef} className="absolute inset-0" onMouseMove={handleMouseMove} onMouseUp={() => { setDraggedTask(null); setMouseDownInfo(null); }} onClick={(e) => { if (e.target === e.currentTarget) { setContextMenu(null); handleBackgroundClick(e); } }}>
        {ripples.map(ripple => (
          <div key={ripple.id} className="absolute pointer-events-none" style={{ left: ripple.x, top: ripple.y }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-blue-400 ripple-animate" />
            <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-300 ripple-animate" style={{ animationDelay: '0.2s' }} />
          </div>
        ))}
        {tasks.map(task => (
          <OceanBall
            key={task.id}
            task={task}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => {}}
          />
        ))}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-lg font-semibold">新增任务球</div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="输入任务标题"
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={addTask} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">创建</button>
              <button onClick={() => { setShowAddDialog(false); setNewTaskTitle(''); }} className="flex-1 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
