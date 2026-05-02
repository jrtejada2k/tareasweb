import { Request, Response, NextFunction } from 'express';
import * as notificationService from '@services/notificationService';
import logger from '@utils/logger';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const isReadParam = req.query['is_read'];
    const is_read = isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;
    const type = req.query['type'] as string | undefined;

    const result = await notificationService.getNotifications(
      userId,
      { is_read, type },
      { page, limit }
    );

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Notification ID required' });
      return;
    }
    await notificationService.markAsRead(id, userId);
    logger.info('Notification marked as read', { notificationId: id, userId });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const count = await notificationService.markAllAsRead(userId);
    logger.info('All notifications marked as read', { userId, count });
    res.json({ success: true, message: `${count} notifications marked as read`, data: { count } });
  } catch (error) {
    next(error);
  }
};
