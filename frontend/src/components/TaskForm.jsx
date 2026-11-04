/**
 * src/components/TaskForm.jsx
 *
 * Controlled form for creating a new task.
 * - Validates on the client before hitting the API.
 * - Disables the submit button while a request is in-flight.
 * - Clears itself after a successful submission.
 */

import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  const titleTrimmed = title.trim();
  const isValid      = titleTrimmed.length > 0 && titleTrimmed.length <= 255;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await onAdd({ title: titleTrimmed, description: description.trim() || undefined });
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to add task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add a new task"
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-700">New Task</h2>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="task-title" className="block text-sm font-medium text-slate-600">
          Title <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={255}
          required
          aria-required="true"
          aria-describedby={error ? 'form-error' : undefined}
          disabled={submitting}
          className="
            w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5
            text-sm text-slate-800 placeholder-slate-400
            transition focus:border-indigo-400 focus:bg-white
            disabled:opacity-50
          "
        />
        <p className="text-xs text-slate-400 text-right">
          {title.length} / 255
        </p>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="task-desc" className="block text-sm font-medium text-slate-600">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details…"
          maxLength={2000}
          rows={3}
          disabled={submitting}
          className="
            w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5
            text-sm text-slate-800 placeholder-slate-400 resize-none
            transition focus:border-indigo-400 focus:bg-white
            disabled:opacity-50
          "
        />
      </div>

      {/* Submission error */}
      {error && (
        <p id="form-error" role="alert" className="text-sm text-red-600 font-medium">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        aria-busy={submitting}
        className="
          w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2.5
          text-sm font-semibold text-white shadow-sm
          hover:bg-indigo-700 active:bg-indigo-800
          transition disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        "
      >
        {submitting ? (
          <>
            <Spinner />
            Adding…
          </>
        ) : (
          'Add Task'
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
