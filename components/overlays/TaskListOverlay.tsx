'use client'

import React from 'react';
import { TaskListConfig } from '@/lib/types/overlay';
import OverlayWrapper from './OverlayWrapper';
import { defaultTheme, getThemeById } from '@/lib/themes/presets';

interface TaskListOverlayProps {
  config: TaskListConfig;
}

export default function TaskListOverlay({ config }: TaskListOverlayProps) {
  const theme = config.themeId ? getThemeById(config.themeId) || defaultTheme : defaultTheme;

  const visibleTasks = config.showCompleted
    ? config.tasks
    : config.tasks.filter((task) => !task.completed);

  const displayTasks = config.maxVisible
    ? visibleTasks.slice(0, config.maxVisible)
    : visibleTasks;

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return 'var(--color-accent)';
    }
  };

  return (
    <OverlayWrapper theme={theme} opacity={config.opacity}>
      <div className="max-w-xl w-full px-6">
        <h2
          className="text-3xl font-bold mb-6"
          style={{
            color: 'var(--color-primary)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          Tasks
        </h2>

        <div className="space-y-3">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                backgroundColor: task.completed
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-padding)',
                opacity: task.completed ? 0.5 : 1,
              }}
            >
              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: task.completed
                    ? 'var(--color-accent)'
                    : 'var(--color-text)',
                  backgroundColor: task.completed
                    ? 'var(--color-accent)'
                    : 'transparent',
                }}
              >
                {task.completed && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Priority Indicator */}
              {task.priority && (
                <div
                  className="w-1 h-5 rounded"
                  style={{
                    backgroundColor: getPriorityColor(task.priority),
                  }}
                />
              )}

              {/* Task Title */}
              <span
                className="flex-1"
                style={{
                  fontSize: 'var(--font-size-md)',
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>

        {visibleTasks.length === 0 && (
          <div
            className="text-center py-8"
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-secondary)',
            }}
          >
            All tasks completed!
          </div>
        )}
      </div>
    </OverlayWrapper>
  );
}
