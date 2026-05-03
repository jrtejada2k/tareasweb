/**
 * Dashboard Service Unit Tests
 *
 * Mocks @utils/database and @utils/logger.
 */

import * as dashboardService from '../../src/services/dashboardService';
import * as database from '../../src/utils/database';

jest.mock('../../src/utils/database');
jest.mock('../../src/utils/logger');

const mockQuery = database.query as jest.MockedFunction<typeof database.query>;

const buildResult = <T = any>(rows: T[]) => ({
  rows,
  rowCount: rows.length,
  command: 'SELECT',
  oid: 0,
  fields: [] as any,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dashboardService.getMasterDashboardData', () => {
  it('maps project rows to project objects with task_summary counts', async () => {
    const created = new Date('2026-01-01T00:00:00Z');
    const start = new Date('2026-02-01T00:00:00Z');
    const end = new Date('2026-03-01T00:00:00Z');

    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 'p1',
          name: 'Proj 1',
          description: 'd',
          status: 'active',
          start_date: start,
          end_date: end,
          created_at: created,
          total_tasks: '5',
          not_started_count: '1',
          iniciada_count: '1',
          en_progreso_count: '1',
          completada_count: '2',
          assigned_users: '3',
        },
      ])
    );

    const result = await dashboardService.getMasterDashboardData();

    expect(result.total_projects).toBe(1);
    expect(result.projects[0]).toMatchObject({
      id: 'p1',
      name: 'Proj 1',
      status: 'active',
      assigned_users: 3,
      task_summary: {
        total: 5,
        not_started: 1,
        iniciada: 1,
        en_progreso: 1,
        completada: 2,
      },
    });
    expect(result.projects[0].start_date).toBe(start.toISOString());
    expect(result.projects[0].end_date).toBe(end.toISOString());
    expect(result.projects[0].created_at).toBe(created.toISOString());
  });

  it('returns empty list when no projects exist', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    const result = await dashboardService.getMasterDashboardData();
    expect(result.projects).toEqual([]);
    expect(result.total_projects).toBe(0);
  });

  it('handles null start_date / end_date safely', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 'p2',
          name: 'no dates',
          description: null,
          status: 'archived',
          start_date: null,
          end_date: null,
          created_at: new Date(),
          total_tasks: '0',
          not_started_count: '0',
          iniciada_count: '0',
          en_progreso_count: '0',
          completada_count: '0',
          assigned_users: '0',
        },
      ])
    );

    const result = await dashboardService.getMasterDashboardData();
    expect(result.projects[0].start_date).toBeNull();
    expect(result.projects[0].end_date).toBeNull();
  });

  it('rethrows on db failure', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db down'));
    await expect(dashboardService.getMasterDashboardData()).rejects.toThrow('db down');
  });
});

describe('dashboardService.getAtRiskTasks', () => {
  it('maps rows and parses assigned_users_count', async () => {
    const due = new Date('2026-05-04T00:00:00Z');
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 't1',
          title: 'risky',
          status: 'iniciada',
          priority: 'high',
          end_date: due,
          project_id: 'p1',
          project_name: 'Proj 1',
          assigned_users_count: '2',
        },
      ])
    );

    const tasks = await dashboardService.getAtRiskTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual({
      id: 't1',
      title: 'risky',
      status: 'iniciada',
      priority: 'high',
      end_date: due.toISOString(),
      project_id: 'p1',
      project_name: 'Proj 1',
      assigned_users_count: 2,
    });
  });

  it('uses INTERVAL 3 days and excludes completada', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await dashboardService.getAtRiskTasks();
    const sql = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("INTERVAL '3 days'");
    expect(sql).toContain("status != 'completada'");
    expect(sql).toContain('LIMIT 20');
  });
});

describe('dashboardService.getRecentDeadlineRequests', () => {
  it('maps rows with current_deadline (not original_deadline)', async () => {
    const cur = new Date('2026-05-10T00:00:00Z');
    const req = new Date('2026-05-20T00:00:00Z');
    const created = new Date('2026-05-02T00:00:00Z');

    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 'r1',
          task_id: 't1',
          requested_by: 'u1',
          request_status: 'pending',
          current_deadline: cur,
          requested_deadline: req,
          reason: 'need more time',
          created_at: created,
          task_title: 'T1',
          project_id: 'p1',
          project_name: 'Proj 1',
          requester_name: 'Alice',
        },
      ])
    );

    const reqs = await dashboardService.getRecentDeadlineRequests();

    expect(reqs[0]).toEqual({
      id: 'r1',
      task_id: 't1',
      task_title: 'T1',
      project_id: 'p1',
      project_name: 'Proj 1',
      requested_by: 'u1',
      requester_name: 'Alice',
      status: 'pending',
      current_deadline: cur.toISOString(),
      requested_deadline: req.toISOString(),
      reason: 'need more time',
      created_at: created.toISOString(),
    });
  });

  it('caps at LIMIT 10', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await dashboardService.getRecentDeadlineRequests();
    const sql = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain('LIMIT 10');
  });
});

describe('dashboardService.getMasterStatistics', () => {
  it('parses all counts as integers', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          total_projects: '10',
          active_projects: '7',
          total_tasks: '42',
          completed_tasks: '15',
          total_users: '4',
        },
      ])
    );
    const stats = await dashboardService.getMasterStatistics();
    expect(stats).toEqual({
      total_projects: 10,
      active_projects: 7,
      total_tasks: 42,
      completed_tasks: 15,
      total_users: 4,
    });
  });

  it('defaults missing values to 0', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([{}]));
    const stats = await dashboardService.getMasterStatistics();
    expect(stats).toEqual({
      total_projects: 0,
      active_projects: 0,
      total_tasks: 0,
      completed_tasks: 0,
      total_users: 0,
    });
  });
});

describe('dashboardService.getUserDashboardData', () => {
  it('groups tasks by date for target month', async () => {
    const start = new Date('2026-05-15T10:00:00Z');
    const end = new Date('2026-05-20T10:00:00Z');

    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 't1',
          title: 'May task',
          description: 'd',
          status: 'iniciada',
          priority: 'medium',
          start_date: start,
          end_date: end,
          completion_percentage: 30,
          project_id: 'p1',
          project_name: 'Proj 1',
          project_status: 'active',
        },
      ])
    );

    const data = await dashboardService.getUserDashboardData('user-1', 5, 2026);

    expect(data.month).toBe(5);
    expect(data.year).toBe(2026);
    expect(data.calendar_tasks['2026-05-15']).toHaveLength(1);
    expect(data.calendar_tasks['2026-05-20']).toHaveLength(1);
    expect(data.calendar_tasks['2026-05-15'][0].date_type).toBe('start');
    expect(data.calendar_tasks['2026-05-20'][0].date_type).toBe('end');
  });

  it('excludes tasks outside target month', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 't2',
          title: 'June task',
          description: null,
          status: 'iniciada',
          priority: 'low',
          start_date: new Date('2026-06-10T00:00:00Z'),
          end_date: null,
          completion_percentage: 0,
          project_id: 'p1',
          project_name: 'Proj 1',
          project_status: 'active',
        },
      ])
    );

    const data = await dashboardService.getUserDashboardData('user-1', 5, 2026);
    expect(Object.keys(data.calendar_tasks)).toHaveLength(0);
  });

  it('passes userId as bind parameter', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await dashboardService.getUserDashboardData('user-xyz', 5, 2026);
    expect(mockQuery.mock.calls[0]![1]).toEqual(['user-xyz']);
  });
});

describe('dashboardService.getUpcomingTasks', () => {
  it('maps rows and parses fields', async () => {
    const start = new Date('2026-05-03T08:00:00Z');
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          id: 't9',
          title: 'soon',
          status: 'iniciada',
          priority: 'high',
          start_date: start,
          end_date: null,
          completion_percentage: 10,
          project_id: 'p1',
          project_name: 'Proj 1',
        },
      ])
    );

    const tasks = await dashboardService.getUpcomingTasks('user-1');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].start_date).toBe(start.toISOString());
    expect(tasks[0].end_date).toBeNull();
  });

  it('filter window is 2 days and excludes completada', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await dashboardService.getUpcomingTasks('user-1');
    const sql = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("INTERVAL '2 days'");
    expect(sql).toContain("status != 'completada'");
  });
});

describe('dashboardService.getUserStatistics', () => {
  it('parses all counts and defaults missing to 0', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([
        {
          total_assigned_tasks: '8',
          completed_tasks: '3',
          tasks_due_soon: '2',
          completed_this_week: '1',
        },
      ])
    );
    const stats = await dashboardService.getUserStatistics('user-1');
    expect(stats).toEqual({
      total_assigned_tasks: 8,
      completed_tasks: 3,
      tasks_due_soon: 2,
      completed_this_week: 1,
    });
  });

  it('defaults to zeros if row missing', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([{}]));
    const stats = await dashboardService.getUserStatistics('user-1');
    expect(stats).toEqual({
      total_assigned_tasks: 0,
      completed_tasks: 0,
      tasks_due_soon: 0,
      completed_this_week: 0,
    });
  });
});
