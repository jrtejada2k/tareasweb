/**
 * Deadline Service Unit Tests
 *
 * Mocks @utils/database and @utils/logger.
 */

import * as deadlineService from '../../src/services/deadlineService';
import * as database from '../../src/utils/database';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '../../src/middleware/errorMiddleware';

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

const futureDate = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deadlineService.createRequest', () => {
  const baseData = () => ({
    task_id: 'task-1',
    requested_by: 'user-1',
    current_deadline: futureDate(2),
    requested_deadline: futureDate(7),
    reason: 'need more time',
  });

  it('rejects when requested_deadline <= current_deadline', async () => {
    const data = baseData();
    data.requested_deadline = data.current_deadline;
    await expect(deadlineService.createRequest(data)).rejects.toThrow(ValidationError);
  });

  it('rejects when requested_deadline is in the past', async () => {
    const data = baseData();
    data.current_deadline = new Date('2020-01-01');
    data.requested_deadline = new Date('2020-06-01');
    await expect(deadlineService.createRequest(data)).rejects.toThrow(ValidationError);
  });

  it('rejects when user is not assigned to task', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([])); // assignment check empty
    await expect(deadlineService.createRequest(baseData())).rejects.toThrow(ForbiddenError);
  });

  it('rejects when task not found', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ id: 'a1' }])) // assignment found
      .mockResolvedValueOnce(buildResult([])); // task lookup empty
    await expect(deadlineService.createRequest(baseData())).rejects.toThrow(NotFoundError);
  });

  it('rejects when task is completada', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ id: 'a1' }]))
      .mockResolvedValueOnce(
        buildResult([{ id: 'task-1', end_date: new Date(), status: 'completada' }])
      );
    await expect(deadlineService.createRequest(baseData())).rejects.toThrow(ValidationError);
  });

  it('rejects when a pending request already exists', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ id: 'a1' }])) // assignment
      .mockResolvedValueOnce(
        buildResult([{ id: 'task-1', end_date: new Date(), status: 'iniciada' }])
      ) // task
      .mockResolvedValueOnce(buildResult([{ id: 'existing-req' }])); // pending exists
    await expect(deadlineService.createRequest(baseData())).rejects.toThrow(ValidationError);
  });

  it('creates request when all checks pass', async () => {
    const inserted = {
      id: 'r1',
      task_id: 'task-1',
      requested_by: 'user-1',
      current_deadline: baseData().current_deadline,
      requested_deadline: baseData().requested_deadline,
      reason: 'need more time',
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: new Date(),
    };
    mockQuery
      .mockResolvedValueOnce(buildResult([{ id: 'a1' }])) // assignment
      .mockResolvedValueOnce(
        buildResult([{ id: 'task-1', end_date: new Date(), status: 'iniciada' }])
      ) // task
      .mockResolvedValueOnce(buildResult([])) // no pending
      .mockResolvedValueOnce(buildResult([inserted])); // insert returning

    const result = await deadlineService.createRequest(baseData());
    expect(result).toEqual(inserted);
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });
});

describe('deadlineService.approveRequest', () => {
  const reviewData = { reviewed_by: 'master-1', review_notes: 'ok' };

  it('throws NotFoundError when request does not exist', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await expect(deadlineService.approveRequest('r1', reviewData)).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when request already reviewed', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([{ id: 'r1', status: 'approved', task_id: 't1', requested_deadline: new Date() }])
    );
    await expect(deadlineService.approveRequest('r1', reviewData)).rejects.toThrow(ValidationError);
  });

  it('updates task end_date and request status, returns updated row', async () => {
    const newDeadline = futureDate(5);
    const original = {
      id: 'r1',
      task_id: 't1',
      requested_deadline: newDeadline,
      status: 'pending',
    };
    const updated = { ...original, status: 'approved', reviewed_by: 'master-1' };

    mockQuery
      .mockResolvedValueOnce(buildResult([original])) // SELECT request
      .mockResolvedValueOnce(buildResult([])) // BEGIN
      .mockResolvedValueOnce(buildResult([])) // UPDATE tasks
      .mockResolvedValueOnce(buildResult([updated])) // UPDATE request RETURNING
      .mockResolvedValueOnce(buildResult([])); // COMMIT

    const result = await deadlineService.approveRequest('r1', reviewData);
    expect(result).toEqual(updated);

    const calls = mockQuery.mock.calls.map((c) => c[0]);
    expect(calls[1]).toBe('BEGIN');
    expect(calls[2]).toContain('UPDATE tasks');
    expect(calls[3]).toContain('UPDATE deadline_requests');
    expect(calls[4]).toBe('COMMIT');
  });

  it('rolls back on UPDATE tasks failure', async () => {
    mockQuery
      .mockResolvedValueOnce(
        buildResult([{ id: 'r1', task_id: 't1', requested_deadline: new Date(), status: 'pending' }])
      )
      .mockResolvedValueOnce(buildResult([])) // BEGIN
      .mockRejectedValueOnce(new Error('update failed')) // UPDATE tasks throws
      .mockResolvedValueOnce(buildResult([])); // ROLLBACK

    await expect(deadlineService.approveRequest('r1', reviewData)).rejects.toThrow('update failed');
    const calls = mockQuery.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ROLLBACK');
  });
});

describe('deadlineService.denyRequest', () => {
  const reviewData = { reviewed_by: 'master-1', review_notes: 'no' };

  it('throws NotFoundError when request not found', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await expect(deadlineService.denyRequest('r1', reviewData)).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when request already reviewed', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([{ id: 'r1', status: 'denied', task_id: 't1' }]));
    await expect(deadlineService.denyRequest('r1', reviewData)).rejects.toThrow(ValidationError);
  });

  it('updates request status without touching task', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ id: 'r1', status: 'pending', task_id: 't1' }]))
      .mockResolvedValueOnce(buildResult([{ id: 'r1', status: 'denied' }]));

    const result = await deadlineService.denyRequest('r1', reviewData);
    expect(result.status).toBe('denied');
    // Only 2 queries: SELECT + UPDATE (no BEGIN/COMMIT/UPDATE tasks)
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe('deadlineService.getRequests', () => {
  it('master sees all (no requested_by filter)', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ count: '5' }])) // count
      .mockResolvedValueOnce(buildResult([])); // requests

    await deadlineService.getRequests('master-1', 'master');

    const countSql = mockQuery.mock.calls[0]![0] as string;
    const countParams = mockQuery.mock.calls[0]![1] as any[];
    expect(countSql).not.toContain('dr.requested_by');
    expect(countParams).toEqual([]);
  });

  it('non-master only sees own requests', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ count: '2' }]))
      .mockResolvedValueOnce(buildResult([]));

    await deadlineService.getRequests('user-1', 'user');

    const countParams = mockQuery.mock.calls[0]![1] as any[];
    expect(countParams).toEqual(['user-1']);
  });

  it('applies status, task_id, project_id filters', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ count: '0' }]))
      .mockResolvedValueOnce(buildResult([]));

    await deadlineService.getRequests('master-1', 'master', {
      status: 'pending',
      task_id: 't1',
      project_id: 'p1',
    });

    const params = mockQuery.mock.calls[0]![1] as any[];
    expect(params).toEqual(['pending', 't1', 'p1']);
  });

  it('returns total parsed as int', async () => {
    mockQuery
      .mockResolvedValueOnce(buildResult([{ count: '7' }]))
      .mockResolvedValueOnce(buildResult([{ id: 'r1' } as any]));

    const out = await deadlineService.getRequests('master-1', 'master');
    expect(out.total).toBe(7);
    expect(out.requests).toHaveLength(1);
  });
});

describe('deadlineService.getRequestById', () => {
  it('throws NotFoundError when not found', async () => {
    mockQuery.mockResolvedValueOnce(buildResult([]));
    await expect(deadlineService.getRequestById('r1', 'u1', 'user')).rejects.toThrow(NotFoundError);
  });

  it('master can access any request', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([{ id: 'r1', requested_by: 'someone-else' } as any])
    );
    const req = await deadlineService.getRequestById('r1', 'master-1', 'master');
    expect(req.id).toBe('r1');
  });

  it('non-master accessing another user request throws ForbiddenError', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([{ id: 'r1', requested_by: 'other-user' } as any])
    );
    await expect(deadlineService.getRequestById('r1', 'user-1', 'user')).rejects.toThrow(
      ForbiddenError
    );
  });

  it('non-master accessing own request succeeds', async () => {
    mockQuery.mockResolvedValueOnce(
      buildResult([{ id: 'r1', requested_by: 'user-1' } as any])
    );
    const req = await deadlineService.getRequestById('r1', 'user-1', 'user');
    expect(req.id).toBe('r1');
  });
});
