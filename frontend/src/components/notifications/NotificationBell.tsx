// components/notifications/NotificationBell.tsx
import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { notificationsService, Notification } from '../../services/notificationsService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const { notifications } = await notificationsService.getAll();
      setNotifications(notifications.slice(0, 5)); // Show latest 5 in dropdown
      const unread = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await notificationsService.markAllAsRead();
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 480 },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) {
                  handleMarkAsRead(notification.id);
                }
                handleClose();
                // Navigate to related resource if available
                if (notification.related_task_id) {
                  navigate(`/tasks/${notification.related_task_id}`);
                } else if (notification.related_project_id) {
                  navigate(`/projects/${notification.related_project_id}`);
                }
              }}
              sx={{
                bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <ListItemText
                primary={notification.title}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(notification.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button fullWidth variant="text" onClick={handleViewAll}>
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
