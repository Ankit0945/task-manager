/**
 * src/components/TaskList.jsx
 *
 * Renders loading, error, empty, and populated states for the task list.
 */

import TaskItem from './TaskItem';

export default function TaskList({ tasks, loading, error, onRetry, onToggle, onDelete }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400" aria-live="polite" aria-busy="true">
        <svg className="h-8 w-8 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm">Loading tasks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16" role="alert">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="
            rounded-lg border border-indigo-300 px-4 py-2
            text-sm font-medium text-indigo-600
            hover:bg-indigo-50 transition
          "
        >
          Try again
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400" aria-live="polite">
        {/* Empty clipboard illustration */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <p className="text-sm font-medium text-slate-500">No tasks yet</p>
        <p className="text-xs text-slate-400">Add your first task above to get started!</p>
      </div>
    );
  }

  const pending   = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) =>  t.completed);

  return (
    <section aria-label="Task list">
      {/* Stats bar */}
      <div className="flex gap-4 mb-4 text-xs text-slate-500 font-medium">
        <span>{tasks.length} total</span>
        <span>·</span>
        <span>{pending.length} pending</span>
        <span>·</span>
        <span>{completed.length} done</span>
      </div>

      <ul className="space-y-3" aria-label="Tasks">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

