import React, { useState } from 'react';
import './Tasks.css';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodorosSpent: number;
  archived: boolean;
}

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTaskId: string | null;
  setActiveTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  themeColor: string;
  pomodoroIcon: string;
}

export const Tasks: React.FC<TasksProps> = ({ tasks, setTasks, activeTaskId, setActiveTaskId, themeColor, pomodoroIcon }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      pomodorosSpent: 0,
      archived: false,
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    
    // Eğer hiç aktif görev yoksa, ilk ekleneni aktif yap
    if (!activeTaskId && tasks.filter(t => !t.archived && !t.completed).length === 0) {
      setActiveTaskId(newTask.id);
    }
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newlyCompleted = !t.completed;
        // Eğer görev tamamlandıysa ve aktiftiyse, aktiflikten çıkar
        if (newlyCompleted && activeTaskId === id) {
          setActiveTaskId(null);
        }
        return { ...t, completed: newlyCompleted };
      }
      return t;
    }));
  };

  const archiveTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (activeTaskId === id) setActiveTaskId(null);
        return { ...t, archived: true };
      }
      return t;
    }));
  };

  const toggleActiveTask = (id: string, completed: boolean) => {
    if (completed) return; // Tamamlananlar aktif olamaz
    setActiveTaskId(prev => prev === id ? null : id);
  };

  const activeTasks = tasks.filter(t => !t.archived && !t.completed);
  const completedTasks = tasks.filter(t => !t.archived && t.completed);

  return (
    <div className="tasks-container">
      <div className="task-filter-group">
        <button 
          className={`task-filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
          style={{ '--active-bg': themeColor } as React.CSSProperties}
        >
          Aktif Görevler ({activeTasks.length})
        </button>
        <button 
          className={`task-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
          style={{ '--active-bg': themeColor } as React.CSSProperties}
        >
          Tamamlananlar ({completedTasks.length})
        </button>
      </div>

      <form className="add-task-form" onSubmit={addTask}>
        <input 
          type="text" 
          placeholder="Yeni bir görev ekle..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{ '--focus-color': themeColor } as React.CSSProperties}
        />
        <button type="submit" style={{ backgroundColor: themeColor }}>Ekle</button>
        <button 
          type="button" 
          className="layout-toggle-btn"
          onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Liste Görünümüne Geç' : 'Izgara Görünümüne Geç'}
        >
          {viewMode === 'grid' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          )}
        </button>
      </form>

      <div className={`tasks-list ${viewMode === 'list' ? 'list-view' : ''}`}>
        {filter === 'active' && activeTasks.length === 0 && (
          <div className="no-tasks">Henüz görev eklenmemiş veya tümü tamamlanmış!</div>
        )}
        {filter === 'completed' && completedTasks.length === 0 && (
          <div className="no-tasks">Henüz tamamlanan bir görev yok.</div>
        )}

        {/* Filtered Tasks Rendering */}
        {filter === 'active' && activeTasks.map(task => (
          <div 
            key={task.id} 
            className={`task-item ${activeTaskId === task.id ? 'active' : ''}`}
            onClick={() => toggleActiveTask(task.id, task.completed)}
            style={{ '--theme-color': themeColor } as React.CSSProperties}
          >
            <div className="task-left">
              <div 
                className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
              >
                {task.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className="task-title" title={task.title}>{task.title}</span>
            </div>
            <div className="task-right">
              {task.pomodorosSpent > 0 && (
                <span className="task-pomodoros" title="Harcanan Seans">
                  {task.pomodorosSpent} {pomodoroIcon}
                </span>
              )}
            </div>
          </div>
        ))}

        {filter === 'completed' && completedTasks.map(task => (
          <div key={task.id} className="task-item completed">
            <div className="task-left">
              <div 
                className="task-checkbox checked"
                onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="task-title" title={task.title}>{task.title}</span>
            </div>
            <div className="task-right">
              {task.pomodorosSpent > 0 && (
                <span className="task-pomodoros">{task.pomodorosSpent} {pomodoroIcon}</span>
              )}
              <button className="delete-task-btn" onClick={(e) => archiveTask(task.id, e)} title="Ekrandan Sil (Geçmişte kalır)">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
