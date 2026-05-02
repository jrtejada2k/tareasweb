import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@controllers/notificationController';
import { requireAuth } from '@middleware/authMiddleware';

const router = Router();

// GET /api/v1/notifications?is_read=true|false&type=...&page=1&limit=20
router.get('/', requireAuth, getNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', requireAuth, getUnreadCount);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', requireAuth, markAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', requireAuth, markAsRead);

export default router;
