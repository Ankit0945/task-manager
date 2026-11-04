/**
 * src/App.jsx
 *
 * Root component — wires together TaskForm and TaskList via the
 * useTasks hook.  Keeps presentational logic out of the top level.
 */

import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const { tasks, loading, error, fetchTasks, addTask, toggleTask, removeTask } = useTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Task Manager
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <TaskForm onAdd={addTask} />
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onRetry={fetchTasks}
          onToggle={toggleTask}
          onDelete={removeTask}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-400">
        Personal Task Manager &mdash; built with React, Express &amp; PostgreSQL
      </footer>
    </div>
  );
}
