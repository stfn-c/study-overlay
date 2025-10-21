'use client'

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { widgetsService } from '@/lib/services/widgets';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface TodoList {
  id: string;
  name: string;
  color: string;
  todos: TodoItem[];
}

interface TodoClientProps {
  widgetId?: string;
  style?: string;
  styleSettings?: any;
}

const DEFAULT_LIST: TodoList = {
  id: 'default',
  name: 'My Tasks',
  color: '#8B5CF6',
  todos: []
};

export default function TodoClient({ widgetId, style = 'minimal', styleSettings: initialStyleSettings = {} }: TodoClientProps) {
  const [todoLists, setTodoLists] = useState<TodoList[]>([DEFAULT_LIST]);
  const [activeListId, setActiveListId] = useState('default');
  const [styleConfig, setStyleConfig] = useState(style);
  const [styleSettings, setStyleSettings] = useState(initialStyleSettings);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const activeList = todoLists.find(list => list.id === activeListId) || todoLists[0];

  // Update widget config
  const updateConfig = useCallback(async (lists: TodoList[], activeId: string) => {
    if (!widgetId) return;

    try {
      await widgetsService.updateWidget(widgetId, {
        config: {
          todoLists: lists,
          activeListId: activeId,
          todoStyle: styleConfig,
          todoStyleSettings: styleSettings
        }
      });
    } catch (error) {
      console.error('Failed to update todo config:', error);
    }
  }, [widgetId, styleConfig, styleSettings]);

  // Load config from database
  useEffect(() => {
    if (!widgetId) {
      setIsLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('widgets')
          .select('config')
          .eq('id', widgetId)
          .single();

        if (error) throw error;

        if (data?.config) {
          if (data.config.todoLists && data.config.todoLists.length > 0) {
            setTodoLists(data.config.todoLists);
          }
          if (data.config.activeListId) {
            setActiveListId(data.config.activeListId);
          }
          if (data.config.todoStyle) {
            setStyleConfig(data.config.todoStyle);
          }
          if (data.config.todoStyleSettings) {
            setStyleSettings(data.config.todoStyleSettings);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch config:', error);
        setIsLoading(false);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 5000);
    return () => clearInterval(interval);
  }, [widgetId, supabase]);

  const toggleTodo = useCallback((todoId: string) => {
    const newLists = todoLists.map(list => {
      if (list.id === activeListId) {
        return {
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId
              ? {
                  ...todo,
                  completed: !todo.completed,
                  completedAt: !todo.completed ? new Date().toISOString() : null
                }
              : todo
          )
        };
      }
      return list;
    });
    setTodoLists(newLists);
    updateConfig(newLists, activeListId);
  }, [todoLists, activeListId, updateConfig]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center px-8">
          <div className="text-2xl text-white/90">Loading todos...</div>
        </div>
      </div>
    );
  }

  const fontSize = styleSettings.fontSize || 20;
  const titleSize = styleSettings.titleSize || 32;
  const textColor = styleSettings.textColor || '#FFFFFF';
  const completedColor = styleSettings.completedColor || '#94A3B8';
  const accentColor = styleSettings.accentColor || activeList.color;
  const showPriority = styleSettings.showPriority !== false;
  const showDueDate = styleSettings.showDueDate !== false;
  const maxWidth = styleSettings.maxWidth || 600;
  const font = styleSettings.font || 'Inter';

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Background customization settings - check if enabled
  const enableBackgroundCustomization = styleSettings.enableBackgroundCustomization || false;

  // Build background styles - default styles when disabled
  const defaultBackgroundStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px'
  };

  // Custom background styles when enabled
  const customBackgroundStyle: React.CSSProperties = enableBackgroundCustomization ? {
    backgroundColor: hexToRgba(styleSettings.backgroundColor || '#000000', styleSettings.backgroundOpacity ?? 0.05),
    border: `${styleSettings.borderWidth ?? 1}px solid ${hexToRgba(styleSettings.borderColor || '#FFFFFF', styleSettings.borderOpacity ?? 0.1)}`,
    borderRadius: `${styleSettings.borderRadius ?? 12}px`,
    padding: `${styleSettings.padding ?? 16}px`,
    ...(styleSettings.enableBackdropBlur && { backdropFilter: `blur(${styleSettings.backdropBlur ?? 8}px)` }),
    ...(styleSettings.enableShadow && {
      boxShadow: `0 4px ${styleSettings.shadowBlur ?? 20}px ${hexToRgba(styleSettings.shadowColor || '#000000', styleSettings.shadowOpacity ?? 0.3)}`
    })
  } : defaultBackgroundStyle;

  const itemBackgroundStyle = customBackgroundStyle;

  const sortedTodos = [...activeList.todos].sort((a, b) => {
    // Uncompleted first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
    const aPriority = priorityOrder[a.priority || 'null'];
    const bPriority = priorityOrder[b.priority || 'null'];
    if (aPriority !== bPriority) return aPriority - bPriority;

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally by creation date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return 'transparent';
    }
  };

  // MINIMAL STYLE
  if (styleConfig === 'minimal') {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600;700&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center items-start px-8 py-12"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, width: '100%' }}>
            {/* Header */}
            <div className="mb-8">
              <h1
                style={{
                  fontSize: `${titleSize}px`,
                  color: textColor,
                  fontWeight: 700,
                  marginBottom: '8px'
                }}
              >
                {activeList.name}
              </h1>
              <div className="flex items-center gap-2">
                <div style={{ width: '40px', height: '3px', backgroundColor: accentColor, borderRadius: '2px' }} />
                <span style={{ fontSize: '14px', color: textColor, opacity: 0.6 }}>
                  {activeList.todos.filter(t => !t.completed).length} active
                </span>
              </div>
            </div>

            {/* Todos */}
            <div className="space-y-3">
              {sortedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-4 transition-all cursor-pointer hover:brightness-110"
                  onClick={() => toggleTodo(todo.id)}
                  style={itemBackgroundStyle}
                >
                  {/* Checkbox */}
                  <div
                    className="flex-shrink-0 mt-1"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: `2px solid ${todo.completed ? accentColor : 'rgba(255, 255, 255, 0.3)'}`,
                      backgroundColor: todo.completed ? accentColor : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {todo.completed && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: `${fontSize}px`,
                        color: todo.completed ? completedColor : textColor,
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        opacity: todo.completed ? 0.6 : 1,
                        wordBreak: 'break-word'
                      }}
                    >
                      {todo.text}
                    </p>

                    {/* Meta info */}
                    {(showPriority || showDueDate) && (
                      <div className="flex items-center gap-2 mt-2">
                        {showPriority && todo.priority && (
                          <div
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: getPriorityColor(todo.priority) + '20',
                              color: getPriorityColor(todo.priority),
                              textTransform: 'uppercase',
                              fontSize: '10px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {todo.priority}
                          </div>
                        )}
                        {showDueDate && todo.dueDate && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{
                              color: isOverdue(todo.dueDate) ? '#EF4444' : 'rgba(255, 255, 255, 0.5)'
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10 2h-1V1a1 1 0 00-2 0v1H5V1a1 1 0 00-2 0v1H2a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2zM2 10V5h8v5H2z" />
                            </svg>
                            {formatDueDate(todo.dueDate)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {activeList.todos.length === 0 && (
                <div className="text-center py-12" style={{ color: textColor, opacity: 0.4 }}>
                  <p style={{ fontSize: `${fontSize}px` }}>No tasks yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Add tasks from the edit page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // MODERN STYLE
  if (styleConfig === 'modern') {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center items-start px-8 py-12"
          style={{
            backgroundColor: 'transparent',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, width: '100%' }}>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1
                  style={{
                    fontSize: `${titleSize}px`,
                    color: textColor,
                    fontWeight: 800,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {activeList.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                      color: '#FFFFFF'
                    }}
                  >
                    {activeList.todos.filter(t => !t.completed).length} TO DO
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: textColor
                    }}
                  >
                    {activeList.todos.filter(t => t.completed).length} DONE
                  </div>
                </div>
              </div>
            </div>

            {/* Todos */}
            <div className="space-y-3">
              {sortedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="group relative overflow-hidden transition-all cursor-pointer hover:brightness-110"
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    ...itemBackgroundStyle,
                    background: todo.completed
                      ? itemBackgroundStyle.backgroundColor
                      : `linear-gradient(135deg, ${accentColor}15, ${itemBackgroundStyle.backgroundColor})`,
                  }}
                >
                  {/* Priority indicator line */}
                  {todo.priority && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: getPriorityColor(todo.priority) }}
                    />
                  )}

                  <div className="flex items-start gap-4" style={{ paddingLeft: todo.priority ? '24px' : '0' }}>
                    {/* Checkbox */}
                    <div
                      className="flex-shrink-0 mt-1"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        border: `3px solid ${todo.completed ? accentColor : 'rgba(255, 255, 255, 0.3)'}`,
                        backgroundColor: todo.completed ? accentColor : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {todo.completed && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L6 11L12 3" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: `${fontSize}px`,
                          color: todo.completed ? completedColor : textColor,
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          fontWeight: 600,
                          wordBreak: 'break-word'
                        }}
                      >
                        {todo.text}
                      </p>

                      {/* Meta info */}
                      {(showPriority || showDueDate) && (
                        <div className="flex items-center gap-2 mt-2">
                          {showDueDate && todo.dueDate && (
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                              style={{
                                backgroundColor: isOverdue(todo.dueDate) ? '#EF444420' : 'rgba(255, 255, 255, 0.1)',
                                color: isOverdue(todo.dueDate) ? '#EF4444' : 'rgba(255, 255, 255, 0.7)'
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M10 2h-1V1a1 1 0 00-2 0v1H5V1a1 1 0 00-2 0v1H2a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2zM2 10V5h8v5H2z" />
                              </svg>
                              {formatDueDate(todo.dueDate)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {activeList.todos.length === 0 && (
                <div className="text-center py-16" style={{ color: textColor, opacity: 0.5 }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                  }}>✓</div>
                  <p style={{ fontSize: `${fontSize + 4}px`, fontWeight: 700 }}>All Clear!</p>
                  <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Add tasks from the edit page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // COMPACT STYLE
  if (styleConfig === 'compact') {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center items-start px-8 py-12"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, width: '100%' }}>
            {/* Compact Header */}
            <div className="flex items-center gap-3 mb-6">
              <h1
                style={{
                  fontSize: `${titleSize}px`,
                  color: textColor,
                  fontWeight: 600
                }}
              >
                {activeList.name}
              </h1>
              <span style={{ fontSize: '14px', color: textColor, opacity: 0.5 }}>
                ({activeList.todos.filter(t => !t.completed).length}/{activeList.todos.length})
              </span>
            </div>

            {/* Compact Todos */}
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 transition-all cursor-pointer hover:brightness-110"
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    ...itemBackgroundStyle,
                    borderLeft: todo.priority ? `3px solid ${getPriorityColor(todo.priority)}` : `3px solid transparent`
                  }}
                >
                  {/* Compact Checkbox */}
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `2px solid ${todo.completed ? accentColor : 'rgba(255, 255, 255, 0.3)'}`,
                      backgroundColor: todo.completed ? accentColor : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {todo.completed && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 5L4 8L9 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Compact Content */}
                  <p
                    className="flex-1 min-w-0"
                    style={{
                      fontSize: `${fontSize}px`,
                      color: todo.completed ? completedColor : textColor,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      opacity: todo.completed ? 0.6 : 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {todo.text}
                  </p>

                  {/* Compact Due Date */}
                  {showDueDate && todo.dueDate && (
                    <span
                      className="text-xs flex-shrink-0"
                      style={{
                        color: isOverdue(todo.dueDate) ? '#EF4444' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: '11px'
                      }}
                    >
                      {formatDueDate(todo.dueDate)}
                    </span>
                  )}
                </div>
              ))}

              {activeList.todos.length === 0 && (
                <div className="text-center py-8" style={{ color: textColor, opacity: 0.4 }}>
                  <p style={{ fontSize: '14px' }}>No tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
