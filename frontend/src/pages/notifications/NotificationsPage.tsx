// pages/notifications/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItemText,
  ListItemButton,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { notificationsService, Notification } from '../../services/notificationsService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const isRead = filter === 'unread' ? false : undefined;
      const { notifications } = await notificationsService.getAll(isRead);
      setNotifications(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to related resource
    if (notification.related_task_id) {
      navigate(`/tasks/${notification.related_task_id}`);
    } else if (notification.related_project_id) {
      navigate(`/projects/${notification.related_project_id}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </Box>

      <Paper>
        <Tabs
          value={filter}
          onChange={(_e, value) => setFilter(value)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" value="all" />
          <Tab
            label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            value="unread"
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {notification.title}
                      {!notification.is_read && (
                        <Chip label="New" size="small" color="primary" />
                      )}
                      <Chip
                        label={notification.type}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" component="div">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;
