interface Task {
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
}

interface TaskPanelProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export default function TaskPanel({ tasks, selectedTaskId, onSelectTask }: TaskPanelProps) {
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  if (!selectedTask) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t-2 border-gray-300/50 dark:border-gray-600/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm p-4 overflow-y-auto z-10" style={{ height: '200px' }} onClick={(e) => e.stopPropagation()}>
      {selectedTask && (
        <div>
          <div className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">
            {selectedTask.title}
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>进度&emsp;{selectedTask.milestones.filter(m => m.completed).length}/{selectedTask.milestones.length}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{selectedTask.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${selectedTask.progress}%` }} />
            </div>
          </div>
          <div className="mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">里程碑</div>
            {selectedTask.milestones.length > 0 ? (
              <div className="space-y-1 mb-2">
                {selectedTask.milestones.map((m, i) => (
                  <div key={i} className="text-xs text-gray-700 dark:text-gray-300">
                    {i + 1}. {m.text} {m.completed && '✅'}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder="新里程碑"
                className="flex-1 border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                autoFocus
              />
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
