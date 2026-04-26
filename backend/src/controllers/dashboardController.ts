/**
 * Dashboard Controller
 * 
 * HTTP request handlers for dashboard endpoints
 */

import { Request, Response } from 'express';
import {
  getMasterDashboardData,
  getAtRiskTasks,
  getRecentDeadlineRequests,
  getMasterStatistics,
  getUserDashboardData,
  getUpcomingTasks,
  getUserStatistics,
} from '@services/dashboardService';
import { asyncHandler } from '@middleware/errorMiddleware';
import logger from '@utils/logger';

/**
 * Get master dashboard
 * GET /api/v1/dashboard/master
 * Requires: master role
 */
export const getMasterDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId!;

  logger.info('Master dashboard accessed', { userId });

  // Get all dashboard data in parallel
  const [dashboardData, atRiskTasks, deadlineRequests, statistics] = await Promise.all([
    getMasterDashboardData(),
    getAtRiskTasks(),
    getRecentDeadlineRequests(),
    getMasterStatistics(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      statistics,
      projects: dashboardData.projects,
      at_risk_tasks: atRiskTasks,
      recent_deadline_requests: deadlineRequests,
    },
  });
});

/**
 * Get user dashboard
 * GET /api/v1/dashboard/user
 * Query params: month (1-12), year (2000-2100)
 * Requires: authentication (any user)
 */
export const getUserDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  const month = req.query['month'] ? parseInt(req.query['month'] as string, 10) : undefined;
  const year = req.query['year'] ? parseInt(req.query['year'] as string, 10) : undefined;

  logger.info('User dashboard accessed', { userId, month, year });

  // Get all dashboard data in parallel
  const [dashboardData, upcomingTasks, statistics] = await Promise.all([
    getUserDashboardData(userId, month, year),
    getUpcomingTasks(userId),
    getUserStatistics(userId),
  ]);

  res.status(200).json({
    success: true,
    data: {
      statistics,
      calendar_tasks: dashboardData.calendar_tasks,
      upcoming_tasks: upcomingTasks,
      month: dashboardData.month,
      year: dashboardData.year,
    },
  });
});
