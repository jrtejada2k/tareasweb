import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingTasksPanel from '../PendingTasksPanel';

vi.mock('../../../services/api', () => ({
  tasksService: {
    getAll: vi.fn(),
  },
}));

import { tasksService } from '../../../services/api';

const renderPanel = () =>
  render(
    <MemoryRouter>
      <PendingTasksPanel />
    </MemoryRouter>
  );

const makeTask = (overrides: Partial<any> = {}) => ({
  id: 't1',
  title: 'Default task',
  status: 'iniciada',
  priority: 'medium',
  end_date: '2026-06-01T00:00:00Z',
  project_name: 'Proj 1',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PendingTasksPanel', () => {
  it('renders empty state when no pending tasks', async () => {
    (tasksService.getAll as any).mockResolvedValue({ data: [] });
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/no pending tasks/i)).toBeInTheDocument();
    });
  });

  it('filters out completada and cancelled tasks', async () => {
    (tasksService.getAll as any).mockResolvedValue({
      data: [
        makeTask({ id: '1', title: 'Done', status: 'completada' }),
        makeTask({ id: '2', title: 'Killed', status: 'cancelled' }),
        makeTask({ id: '3', title: 'Active task', status: 'iniciada' }),
      ],
    });
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Active task')).toBeInTheDocument();
    });
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
    expect(screen.queryByText('Killed')).not.toBeInTheDocument();
  });

  it('sorts critical priority above lower priorities', async () => {
    (tasksService.getAll as any).mockResolvedValue({
      data: [
        makeTask({ id: '1', title: 'Low task', priority: 'low' }),
        makeTask({ id: '2', title: 'Critical task', priority: 'critical' }),
        makeTask({ id: '3', title: 'Medium task', priority: 'medium' }),
      ],
    });
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Critical task')).toBeInTheDocument();
    });

    const titles = screen.getAllByRole('button').map((el) => el.textContent ?? '');
    const criticalIdx = titles.findIndex((t) => t.includes('Critical task'));
    const lowIdx = titles.findIndex((t) => t.includes('Low task'));
    expect(criticalIdx).toBeLessThan(lowIdx);
  });

  it('caps display at 10 items', async () => {
    const tasks = Array.from({ length: 15 }, (_, i) =>
      makeTask({ id: String(i), title: `Task ${i}` })
    );
    (tasksService.getAll as any).mockResolvedValue({ data: tasks });
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Task 0')).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(10);
  });

  it('renders empty state on API error', async () => {
    (tasksService.getAll as any).mockRejectedValue(new Error('boom'));
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/no pending tasks/i)).toBeInTheDocument();
    });
  });
});
