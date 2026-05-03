import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import { PendingActions as PendingIcon } from '@mui/icons-material';
import { tasksService } from '../../services/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  end_date: string | null;
  project_name?: string;
}

const PRIORITY_RANK: Record<Task['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PendingTasksPanel: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingTasks();
  }, []);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksService.getAll({});
      const allTasks: Task[] = response.data || [];

      const pending = allTasks
        .filter(
          (task) => task.status !== 'completada' && task.status !== 'cancelled'
        )
        .sort((a, b) => {
          const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          if (pr !== 0) return pr;
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        })
        .slice(0, 10);

      setTasks(pending);
    } catch (error) {
      console.error('Failed to load pending tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <PendingIcon color="action" />
          <Typography variant="h6">Pending Tasks</Typography>
        </Box>
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <PendingIcon color="action" />
        <Typography variant="h6">Pending Tasks</Typography>
      </Box>

      {tasks.length === 0 ? (
        <Typography color="text.secondary">No pending tasks</Typography>
      ) : (
        <List>
          {tasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate(`/tasks/${task.id}`)}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body1">{task.title}</Typography>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority)}
                        />
                        <Chip label={formatStatus(task.status)} size="small" />
                      </Box>
                    }
                    secondary={
                      task.project_name ? (
                        <Typography variant="caption" color="text.secondary">
                          Project: {task.project_name}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default PendingTasksPanel;
