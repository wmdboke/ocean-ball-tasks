'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { taskAPI } from '../services/taskAPI';
import { PROGRESS } from '../constants';
import { Task } from '../utils/taskUtils';

interface TaskDrawerProps {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export default function TaskDrawer({ selectedTask, setSelectedTask, updateTask }: TaskDrawerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState('');

  const calculateProgress = (milestones: { text: string; completed: boolean }[]) => {
    if (milestones.length === 0) return 0;
    const completedCount = milestones.filter(m => m.completed).length;
    return Math.round((completedCount / milestones.length) * 100);
  };

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

  const handleAddMilestone = async () => {
    if (!selectedTask || !newMilestone.trim()) return;

    try {
      // 1. 先调用 API 创建 milestone
      const created = await taskAPI.createMilestone({
        taskId: selectedTask.id,
        title: newMilestone.trim(),
      });

      // 2. API 成功后，更新缓存中的 milestones
      const updatedMilestones = [
        ...selectedTask.milestones,
        { id: created.id, text: created.title, completed: created.completed }
      ];

      // 3. 计算新进度并更新 task
      const newProgress = calculateProgress(updatedMilestones);
      await updateTask(selectedTask.id, {
        milestones: updatedMilestones,
        progress: newProgress,
      });

      setNewMilestone('');
    } catch (error) {
      toast.error('Failed to add milestone');
    }
  };

  const toggleMilestone = async (milestone: { id?: string; text: string; completed: boolean }) => {
    if (!selectedTask || !milestone.id) return;

    try {
      // 1. 先调用 API 更新 milestone
      await taskAPI.updateMilestone(milestone.id, {
        completed: !milestone.completed,
      });

      // 2. API 成功后，更新缓存中的 milestones
      const updatedMilestones = selectedTask.milestones.map(m =>
        m.id === milestone.id ? { ...m, completed: !m.completed } : m
      );

      // 3. 计算新进度并更新 task
      const newProgress = calculateProgress(updatedMilestones);
      await updateTask(selectedTask.id, {
        milestones: updatedMilestones,
        progress: newProgress,
      });
    } catch (error) {
      toast.error('Failed to toggle milestone');
    }
  };

  const deleteMilestone = async (milestoneId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTask || !milestoneId) return;

    try {
      // 1. 先调用 API 删除 milestone
      await taskAPI.deleteMilestone(milestoneId);

      // 2. API 成功后，更新缓存中的 milestones
      const updatedMilestones = selectedTask.milestones.filter(m => m.id !== milestoneId);

      // 3. 计算新进度并更新 task
      const newProgress = calculateProgress(updatedMilestones);
      await updateTask(selectedTask.id, {
        milestones: updatedMilestones,
        progress: newProgress,
      });
    } catch (error) {
      toast.error('Failed to delete milestone');
    }
  };

  const handleArchive = () => {
    if (selectedTask) {
      updateTask(selectedTask.id, { progress: PROGRESS.COMPLETE });
      setSelectedTask(null);
    }
  };

  const handleDueDateClick = () => {
    const dueDateValue = selectedTask?.dueDate
      ? new Date(selectedTask.dueDate).toISOString().split('T')[0]
      : '';
    setEditedDueDate(dueDateValue);
    setIsEditingDueDate(true);
  };

  const handleDueDateSave = () => {
    if (selectedTask) {
      updateTask(selectedTask.id, { dueDate: editedDueDate || null });
    }
    setIsEditingDueDate(false);
  };

  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = 'text-gray-600 dark:text-gray-400';
    if (diffDays < 0) {
      color = 'text-red-600 dark:text-red-400'; // Overdue
    } else if (diffDays <= 3) {
      color = 'text-orange-600 dark:text-orange-400'; // Due soon
    }

    return (
      <span className={color}>
        {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        {diffDays < 0 && ' (Overdue)'}
        {diffDays >= 0 && diffDays <= 3 && ` (${diffDays} day${diffDays !== 1 ? 's' : ''} left)`}
      </span>
    );
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
            <div className="px-6 space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created at {new Date(selectedTask.createdAt).toLocaleString('en-US')}
              </div>
              <div className="text-xs">
                {isEditingDueDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editedDueDate}
                      onChange={(e) => setEditedDueDate(e.target.value)}
                      onBlur={handleDueDateSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleDueDateSave()}
                      className="text-xs bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1"
                      min={new Date().toISOString().split('T')[0]}
                      autoFocus
                    />
                    <button
                      onClick={handleDueDateSave}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Save
                    </button>
                  </div>
                ) : selectedTask.dueDate ? (
                  <div
                    onClick={handleDueDateClick}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span className="text-gray-500 dark:text-gray-400">Due:</span>
                    {formatDueDate(selectedTask.dueDate)}
                  </div>
                ) : (
                  <button
                    onClick={handleDueDateClick}
                    className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    + Add due date
                  </button>
                )}
              </div>
            </div>
            <div className="pb-4"></div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600">{selectedTask.progress}%</span>
                    {selectedTask.progress >= PROGRESS.MAX && (
                      <button
                        onClick={handleArchive}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors"
                      >
                        Archive
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
                  Milestones ({selectedTask.milestones.filter(m => m.completed).length}/{selectedTask.milestones.length})
                </h3>
                <div className="space-y-3 mb-4">
                  {selectedTask.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-start gap-3 group hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors">
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center cursor-pointer ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => toggleMilestone(milestone)}
                      >
                        {milestone.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span
                        className={`text-sm flex-1 cursor-pointer ${
                          milestone.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'
                        }`}
                        onClick={() => toggleMilestone(milestone)}
                      >
                        {milestone.text}
                      </span>
                      <button
                        onClick={(e) => deleteMilestone(milestone.id, e)}
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
                    placeholder="Add new milestone..."
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

