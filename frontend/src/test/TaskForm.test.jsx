/**
 * src/test/TaskForm.test.jsx
 *
 * Tests for the task creation form.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../components/TaskForm';

describe('TaskForm', () => {
  let onAdd;

  beforeEach(() => {
    onAdd = vi.fn().mockResolvedValue({});
  });

  it('renders title and description inputs and a submit button', () => {
    render(<TaskForm onAdd={onAdd} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('disables submit button when title is empty', () => {
    render(<TaskForm onAdd={onAdd} />);
    expect(screen.getByRole('button', { name: /add task/i })).toBeDisabled();
  });

  it('enables submit button when title has content', async () => {
    render(<TaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText(/title/i), 'Buy milk');
    expect(screen.getByRole('button', { name: /add task/i })).toBeEnabled();
  });

  it('calls onAdd with title and description on submit', async () => {
    render(<TaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText(/title/i), 'Buy milk');
    await userEvent.type(screen.getByLabelText(/description/i), '2 litres');
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({ title: 'Buy milk', description: '2 litres' });
    });
  });

  it('clears the form after a successful submission', async () => {
    render(<TaskForm onAdd={onAdd} />);
    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.type(titleInput, 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await waitFor(() => expect(titleInput.value).toBe(''));
  });

  it('shows an error message when onAdd rejects', async () => {
    onAdd.mockRejectedValueOnce(new Error('Network error'));
    render(<TaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText(/title/i), 'Task');
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('does not submit when title is only whitespace', async () => {
    render(<TaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText(/title/i), '   ');
    // Button should remain disabled for whitespace-only input
    expect(screen.getByRole('button', { name: /add task/i })).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
