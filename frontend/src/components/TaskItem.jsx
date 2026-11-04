/**
 * src/components/TaskItem.jsx
 *
 * Renders a single task row with:
 * - Checkbox to toggle completion (optimistic update)
 * - Title and description
 * - Readable creation date
 * - Delete button with a two-step confirmation
 */

import { useState } from 'react';

/** Format an ISO date string as "Nov 4, 2026 at 11:30 PM" */
function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
    hour:  'numeric',
    minute: '2-digit',
  });
}

export default function TaskItem({ task, onToggle, onDelete }) {
  const [toggling,     setToggling]     = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError,  setActionError]  = useState('');

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    setActionError('');
    try {
      await onToggle(task.id, !task.completed);
    } catch (err) {
      setActionError(err.message || 'Could not update task');
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      // First click: show confirmation UI
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setActionError('');
    try {
      await onDelete(task.id);
      // Component will unmount after successful delete — no cleanup needed
    } catch (err) {
      setActionError(err.message || 'Could not delete task');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function cancelDelete() {
    setConfirmDelete(false);
  }

  return (
    <li
      className={`
        group flex gap-4 rounded-xl border p-4 shadow-sm transition
        ${task.completed
          ? 'bg-slate-50 border-slate-200 opacity-80'
          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'}
      `}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <input
          type="checkbox"
          id={`task-${task.id}`}
          checked={task.completed}
          onChange={handleToggle}
          disabled={toggling || deleting}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          className="
            h-5 w-5 rounded border-slate-300 text-indigo-600
            cursor-pointer accent-indigo-600
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`task-${task.id}`}
          className={`
            block text-sm font-semibold cursor-pointer leading-snug
            ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}
          `}
        >
          {task.title}
        </label>

        {task.description && (
          <p className={`mt-1 text-xs leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-500'}`}>
            {task.description}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-400">
          Added {formatDate(task.created_at)}
          {task.completed && ' · Completed ✓'}
        </p>

        {/* Inline action error */}
        {actionError && (
          <p role="alert" className="mt-1 text-xs text-red-600 font-medium">
            {actionError}
          </p>
        )}
      </div>

      {/* Delete controls */}
      <div className="shrink-0 flex items-start gap-2">
        {confirmDelete ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Confirm delete"
              className="
                rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white
                hover:bg-red-700 disabled:opacity-50 transition
              "
            >
              {deleting ? 'Deleting…' : 'Confirm'}
            </button>
            <button
              onClick={cancelDelete}
              disabled={deleting}
              aria-label="Cancel delete"
              className="
                rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium
                text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition
              "
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleDelete}
            aria-label={`Delete task "${task.title}"`}
            className="
              rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50
              opacity-0 group-hover:opacity-100 focus:opacity-100
              transition
            "
          >
            {/* Trash icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

