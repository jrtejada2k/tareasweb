/**
 * Dashboard Service
 * 
 * Business logic for dashboard data aggregation
 */

import { query } from '@utils/database';
import logger from '@utils/logger';

/**
 * Get master dashboard data
 * Returns all projects with task summaries and statistics
 */
export const getMasterDashboardData = async (): Promise<any> => {
  try {
    // Get all projects with task counts by status
    const projectsResult = await query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.start_date,
        p.end_date,
        p.created_at,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'not_started' THEN 1 END) as not_started_count,
        COUNT(CASE WHEN t.status = 'iniciada' THEN 1 END) as iniciada_count,
        COUNT(CASE WHEN t.status = 'en_progreso' THEN 1 END) as en_progreso_count,
        COUNT(CASE WHEN t.status = 'completada' THEN 1 END) as completada_count,
        COUNT(DISTINCT ta.user_id) as assigned_users
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    const projects = projectsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      start_date: row.start_date ? row.start_date.toISOString() : null,
      end_date: row.end_date ? row.end_date.toISOString() : null,
      created_at: row.created_at.toISOString(),
      task_summary: {
        total: parseInt(row.total_tasks, 10),
        not_started: parseInt(row.not_started_count, 10),
        iniciada: parseInt(row.iniciada_count, 10),
        en_progreso: parseInt(row.en_progreso_count, 10),
        completada: parseInt(row.completada_count, 10),
      },
      assigned_users: parseInt(row.assigned_users, 10),
    }));

    logger.debug('Master dashboard data retrieved', { projectCount: projects.length });

    return {
      projects,
      total_projects: projects.length,
    };
  } catch (error) {
    logger.error('Get master dashboard data failed', { error });
    throw error;
  }
};

/**
 * Get at-risk tasks
 * Tasks with end_date within 3 days that are not completed
 */
export const getAtRiskTasks = async (): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.end_date,
        t.project_id,
        p.name as project_name,
        COUNT(ta.user_id) as assigned_users_count
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       WHERE t.end_date IS NOT NULL
         AND t.end_date <= NOW() + INTERVAL '3 days'
         AND t.status != 'completada'
       GROUP BY t.id, p.name
       ORDER BY t.end_date ASC
       LIMIT 20`
    );

    const tasks = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      end_date: row.end_date ? row.end_date.toISOString() : null,
      project_id: row.project_id,
      project_name: row.project_name,
      assigned_users_count: parseInt(row.assigned_users_count, 10),
    }));

    logger.debug('At-risk tasks retrieved', { count: tasks.length });

    return tasks;
  } catch (error) {
    logger.error('Get at-risk tasks failed', { error });
    throw error;
  }
};

/**
 * Get recent deadline extension requests
 * Returns the 10 most recent deadline_requests
 */
export const getRecentDeadlineRequests = async (): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT 
        dr.id,
        dr.task_id,
        dr.requested_by,
        dr.status as request_status,
        dr.current_deadline,
        dr.requested_deadline,
        dr.reason,
        dr.created_at,
        t.title as task_title,
        t.project_id,
        p.name as project_name,
        u.full_name as requester_name
       FROM deadline_requests dr
       JOIN tasks t ON t.id = dr.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u ON u.id = dr.requested_by
       ORDER BY dr.created_at DESC
       LIMIT 10`
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      task_id: row.task_id,
      task_title: row.task_title,
      project_id: row.project_id,
      project_name: row.project_name,
      requested_by: row.requested_by,
      requester_name: row.requester_name,
      status: row.request_status,
      current_deadline: row.current_deadline ? row.current_deadline.toISOString() : null,
      requested_deadline: row.requested_deadline ? row.requested_deadline.toISOString() : null,
      reason: row.reason,
      created_at: row.created_at.toISOString(),
    }));

    logger.debug('Recent deadline requests retrieved', { count: requests.length });

    return requests;
  } catch (error) {
    logger.error('Get recent deadline requests failed', { error });
    throw error;
  }
};

/**
 * Get overall statistics for master dashboard
 */
export const getMasterStatistics = async (): Promise<any> => {
  try {
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completada' THEN 1 END) as completed_tasks,
        COUNT(DISTINCT u.id) as total_users
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN users u ON u.role = 'user'`
    );

    const stats = statsResult.rows[0];

    return {
      total_projects: parseInt(stats?.total_projects || '0', 10),
      active_projects: parseInt(stats?.active_projects || '0', 10),
      total_tasks: parseInt(stats?.total_tasks || '0', 10),
      completed_tasks: parseInt(stats?.completed_tasks || '0', 10),
      total_users: parseInt(stats?.total_users || '0', 10),
    };
  } catch (error) {
    logger.error('Get master statistics failed', { error });
    throw error;
  }
};

// ==================== USER DASHBOARD FUNCTIONS ====================

/**
 * Get user dashboard data with calendar tasks for specified month/year
 * @param userId User ID
 * @param month Month (1-12), defaults to current month
 * @param year Year (2000-2100), defaults to current year
 */
export const getUserDashboardData = async (
  userId: string,
  month?: number,
  year?: number
): Promise<any> => {
  try {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-based
    const targetYear = year || now.getFullYear();

    // Get all assigned tasks for the user
    const tasksResult = await query(
      `SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.start_date,
        t.end_date,
        t.completion_percentage,
        t.project_id,
        p.name as project_name,
        p.status as project_status
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN projects p ON p.id = t.project_id
       WHERE ta.user_id = $1
       ORDER BY t.start_date ASC NULLS LAST, t.end_date ASC NULLS LAST`,
      [userId]
    );

    const allTasks = tasksResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      start_date: row.start_date ? row.start_date.toISOString() : null,
      end_date: row.end_date ? row.end_date.toISOString() : null,
      completion_percentage: row.completion_percentage,
      project_id: row.project_id,
      project_name: row.project_name,
      project_status: row.project_status,
    }));

    // Filter tasks for the specified month (tasks with start_date or end_date in that month)
    const calendarTasks = allTasks.filter((task) => {
      if (!task.start_date && !task.end_date) return false;

      const startDate = task.start_date ? new Date(task.start_date) : null;
      const endDate = task.end_date ? new Date(task.end_date) : null;

      const isInMonth = 
        (startDate && startDate.getMonth() + 1 === targetMonth && startDate.getFullYear() === targetYear) ||
        (endDate && endDate.getMonth() + 1 === targetMonth && endDate.getFullYear() === targetYear);

      return isInMonth;
    });

    // Group calendar tasks by date
    const tasksByDate: Record<string, any[]> = {};
    calendarTasks.forEach((task) => {
      // Add task to start_date
      if (task.start_date) {
        const dateKey = task.start_date.split('T')[0]; // YYYY-MM-DD
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push({ ...task, date_type: 'start' });
      }

      // Add task to end_date (if different from start_date)
      if (task.end_date) {
        const dateKey = task.end_date.split('T')[0];
        const startDateKey = task.start_date ? task.start_date.split('T')[0] : null;
        if (dateKey !== startDateKey) {
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
          }
          tasksByDate[dateKey].push({ ...task, date_type: 'end' });
        }
      }
    });

    logger.debug('User dashboard data retrieved', { userId, taskCount: allTasks.length });

    return {
      calendar_tasks: tasksByDate,
      month: targetMonth,
      year: targetYear,
    };
  } catch (error) {
    logger.error('Get user dashboard data failed', { error, userId });
    throw error;
  }
};

/**
 * Get upcoming tasks for user (tasks starting in next 2 days)
 * @param userId User ID
 */
export const getUpcomingTasks = async (userId: string): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.start_date,
        t.end_date,
        t.completion_percentage,
        t.project_id,
        p.name as project_name
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN projects p ON p.id = t.project_id
       WHERE ta.user_id = $1
         AND t.start_date IS NOT NULL
         AND t.start_date BETWEEN NOW() AND NOW() + INTERVAL '2 days'
         AND t.status != 'completada'
       ORDER BY t.start_date ASC
       LIMIT 10`,
      [userId]
    );

    const tasks = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      start_date: row.start_date ? row.start_date.toISOString() : null,
      end_date: row.end_date ? row.end_date.toISOString() : null,
      completion_percentage: row.completion_percentage,
      project_id: row.project_id,
      project_name: row.project_name,
    }));

    logger.debug('Upcoming tasks retrieved', { userId, count: tasks.length });

    return tasks;
  } catch (error) {
    logger.error('Get upcoming tasks failed', { error, userId });
    throw error;
  }
};

/**
 * Get user statistics
 * @param userId User ID
 */
export const getUserStatistics = async (userId: string): Promise<any> => {
  try {
    // Get task counts and stats
    const statsResult = await query(
      `SELECT 
        COUNT(t.id) as total_assigned_tasks,
        COUNT(CASE WHEN t.status = 'completada' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.end_date IS NOT NULL AND t.end_date <= NOW() + INTERVAL '3 days' AND t.status != 'completada' THEN 1 END) as tasks_due_soon,
        COUNT(CASE WHEN t.status = 'completada' AND t.completed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as completed_this_week
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       WHERE ta.user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    return {
      total_assigned_tasks: parseInt(stats?.total_assigned_tasks || '0', 10),
      completed_tasks: parseInt(stats?.completed_tasks || '0', 10),
      tasks_due_soon: parseInt(stats?.tasks_due_soon || '0', 10),
      completed_this_week: parseInt(stats?.completed_this_week || '0', 10),
    };
  } catch (error) {
    logger.error('Get user statistics failed', { error, userId });
    throw error;
  }
};
