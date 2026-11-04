/**
 * src/test/TaskItem.test.jsx
 *
 * Tests for the individual task row component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskItem from '../components/TaskItem';

const baseTask = {
  id:          1,
  title:       'Write tests',
  description: 'Make sure things work',
  completed:   false,
  created_at:  new Date().toISOString(),
  updated_at:  new Date().toISOString(),
};

describe('TaskItem', () => {
  let onToggle, onDelete;

  beforeEach(() => {
    onToggle = vi.fn().mockResolvedValue({});
    onDelete = vi.fn().mockResolvedValue({});
  });

  it('renders the task title and description', () => {
    render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={onDelete} />);
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Make sure things work')).toBeInTheDocument();
  });

  it('calls onToggle when the checkbox is clicked', async () => {
    render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(1, true);
    });
  });

  it('renders a checked checkbox for a completed task', () => {
    render(<TaskItem task={{ ...baseTask, completed: true }} onToggle={onToggle} onDelete={onDelete} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('shows confirm/cancel buttons after clicking delete', async () => {
    render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={onDelete} />);
    // Reveal delete button (it's hidden until hover/focus — use getByLabelText)
    const deleteBtn = screen.getByLabelText(/delete task/i);
    await userEvent.click(deleteBtn);
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onDelete after confirming deletion', async () => {
    render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText(/delete task/i));
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(1);
    });
  });

  it('cancels deletion when cancel is clicked', async () => {
    render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText(/delete task/i));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
    // Confirm button should no longer be visible
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });
});

