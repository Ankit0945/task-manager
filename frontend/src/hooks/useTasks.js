/**
 * src/hooks/useTasks.js
 *
 * Custom hook that owns the task state and exposes CRUD operations.
 * Components call these functions and read the returned state — they
 * never call the API module directly.
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/tasks';

export function useTasks() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch all tasks ──────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Create ───────────────────────────────────────────────────────────────────
  const addTask = useCallback(async ({ title, description }) => {
    const { data } = await api.createTask({ title, description });
    // Optimistically prepend (API returns newest-first anyway)
    setTasks((prev) => [data, ...prev]);
    return data;
  }, []);

  // ── Toggle completed ─────────────────────────────────────────────────────────
  const toggleTask = useCallback(async (id, completed) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
    try {
      const { data } = await api.updateTask(id, { completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    } catch (err) {
      // Roll back
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
      throw err;
    }
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const removeTask = useCallback(async (id) => {
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      // Roll back
      await fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  return { tasks, loading, error, fetchTasks, addTask, toggleTask, removeTask };
}
