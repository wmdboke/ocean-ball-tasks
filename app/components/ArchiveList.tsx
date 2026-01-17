'use client';

import { useTaskStore } from '../store/taskStore';

interface ArchiveListProps {
  onClose: () => void;
}

export default function ArchiveList({ onClose }: ArchiveListProps) {
  const archivedTasks = useTaskStore((s) => s.archivedTasks);

  // Sort by completedAt in descending order (newest first)
  const sortedArchivedTasks = [...archivedTasks].sort((a, b) => {
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 z-50 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Archived Tasks</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sortedArchivedTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No archived tasks</div>
        ) : (
          <div className="space-y-3">
            {sortedArchivedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                >
                  {task.title.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {task.milestones.length} milestones completed
                  </p>
                  {task.completedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Completed at {new Date(task.completedAt).toLocaleString('en-US')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
