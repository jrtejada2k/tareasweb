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
import {
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { tasksService } from '../../services/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  project_name?: string;
}

const UpcomingTasksPanel: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingTasks();
  }, []);

  const loadUpcomingTasks = async () => {
    try {
      setLoading(true);
      // Get all tasks and filter for upcoming ones
      const response = await tasksService.getAll({});
      const allTasks = response.tasks || [];
      
      // Filter for non-completed tasks with upcoming deadlines
      const upcoming = allTasks
        .filter((task: Task) => 
          task.status !== 'completed' && 
          task.status !== 'cancelled' &&
          new Date(task.deadline) >= new Date()
        )
        .sort((a: Task, b: Task) => 
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        )
        .slice(0, 10); // Show top 10 upcoming tasks
      
      setTasks(upcoming);
    } catch (error) {
      console.error('Failed to load upcoming tasks:', error);
      // Set empty tasks on error
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const isDueSoon = (deadline: string) => {
    const daysUntilDeadline = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Tasks
        </Typography>
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upcoming Tasks
      </Typography>

      {tasks.length === 0 ? (
        <Typography color="text.secondary">No upcoming tasks</Typography>
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
                        {isOverdue(task.deadline) && (
                          <Chip
                            icon={<WarningIcon />}
                            label="Overdue"
                            size="small"
                            color="error"
                          />
                        )}
                        {!isOverdue(task.deadline) && isDueSoon(task.deadline) && (
                          <Chip
                            icon={<TimeIcon />}
                            label="Due Soon"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {task.project_name && (
                          <Typography variant="caption" display="block">
                            Project: {task.project_name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                        </Typography>
                      </Box>
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

export default UpcomingTasksPanel;
