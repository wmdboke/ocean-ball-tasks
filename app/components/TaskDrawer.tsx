'use client';

import { useState } from 'react';
import { useTaskStore } from '../store/taskStore';

export default function TaskDrawer() {
  const { selectedTask, setSelectedTask, updateTask } = useTaskStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [newMilestone, setNewMilestone] = useState('');

  const handleTitleClick = () => {
    setEditedTitle(selectedTask?.title || '');
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (selectedTask && editedTitle.trim()) {
      updateTask(selectedTask.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddMilestone = () => {
    if (selectedTask && newMilestone.trim()) {
      updateTask(selectedTask.id, {
        milestones: [...selectedTask.milestones, { text: newMilestone.trim(), completed: false }]
      });
      setNewMilestone('');
    }
  };

  const toggleMilestone = (index: number) => {
    if (selectedTask) {
      const updatedMilestones = selectedTask.milestones.map((m, i) =>
        i === index ? { ...m, completed: !m.completed } : m
      );
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : 0;
      updateTask(selectedTask.id, { milestones: updatedMilestones, progress });
    }
  };

  const deleteMilestone = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTask) {
      const updatedMilestones = selectedTask.milestones.filter((_, i) => i !== index);
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : 0;
      updateTask(selectedTask.id, { milestones: updatedMilestones, progress });
    }
  };

  const handleArchive = () => {
    if (selectedTask) {
      updateTask(selectedTask.id, { progress: 101 });
      setSelectedTask(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setSelectedTask(null)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          selectedTask ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedTask && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: selectedTask.color }}
                >
                  {selectedTask.title.charAt(0)}
                </div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                    className="flex-1 text-xl font-semibold bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <h2
                    onClick={handleTitleClick}
                    className="text-xl font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {selectedTask.title}
                  </h2>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 pb-4 text-xs text-gray-500 dark:text-gray-400">
              创建于 {new Date(selectedTask.createdAt).toLocaleString('zh-CN')}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">进度</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600">{selectedTask.progress}%</span>
                    {selectedTask.progress >= 100 && (
                      <button
                        onClick={handleArchive}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors"
                      >
                        归档
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${selectedTask.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  里程碑 ({selectedTask.milestones.filter(m => m.completed).length}/{selectedTask.milestones.length})
                </h3>
                <div className="space-y-3 mb-4">
                  {selectedTask.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-3 group hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center cursor-pointer ${milestone.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => toggleMilestone(idx)}>
                        {milestone.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm flex-1 cursor-pointer ${milestone.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`} onClick={() => toggleMilestone(idx)}>
                        {milestone.text}
                      </span>
                      <button
                        onClick={(e) => deleteMilestone(idx, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Milestone */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                    placeholder="添加新里程碑..."
                    className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                  />
                  <button
                    onClick={handleAddMilestone}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
