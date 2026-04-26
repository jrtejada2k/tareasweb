import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { tasksService } from '../../services/api';
import UserAssignmentPanel from '../../components/assignments/UserAssignmentPanel';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  deadline: string;
  estimated_hours: number;
  actual_hours: number;
  project_id: string;
  parent_task_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  project_name?: string;
  assigned_users?: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    start_date: '',
    deadline: '',
    estimated_hours: 0,
  });

  const isMaster = user?.role === 'master';

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await tasksService.getById(id!);
      setTask(response.task);
      setNewStatus(response.task.status);
      setEditForm({
        title: response.task.title,
        description: response.task.description,
        priority: response.task.priority,
        start_date: response.task.start_date.split('T')[0],
        deadline: response.task.deadline.split('T')[0],
        estimated_hours: response.task.estimated_hours,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await tasksService.update(id!, editForm);
      toast.success('Task updated successfully');
      setEditDialogOpen(false);
      loadTask();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async () => {
    try {
      await tasksService.updateStatus(id!, newStatus);
      toast.success('Task status updated successfully');
      setStatusDialogOpen(false);
      loadTask();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await tasksService.delete(id!);
      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'in_progress':
        return 'info';
      case 'blocked':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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

  const getProgressPercentage = () => {
    if (!task || task.estimated_hours === 0) return 0;
    return Math.min(Math.round((task.actual_hours / task.estimated_hours) * 100), 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box p={3}>
        <Typography>Task not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/tasks')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{task.title}</Typography>
          <Chip label={formatStatus(task.status)} color={getStatusColor(task.status)} />
          <Chip label={task.priority} color={getPriorityColor(task.priority)} />
        </Box>
        {isMaster && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={() => setStatusDialogOpen(true)}>
              Change Status
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Task Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Details
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {task.description}
              </Typography>

              <Grid container spacing={2} mt={1}>
                {task.project_name && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Project
                    </Typography>
                    <Typography variant="body1">
                      <Button
                        variant="text"
                        onClick={() => navigate(`/projects/${task.project_id}`)}
                        sx={{ p: 0, textTransform: 'none', fontSize: '1rem' }}
                      >
                        {task.project_name}
                      </Button>
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(task.start_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Deadline
                  </Typography>
                  <Typography variant="body1">
                    {new Date(task.deadline).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(task.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(task.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Time Tracking */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TimeIcon />
              <Typography variant="h6">Time Tracking</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Hours
                </Typography>
                <Typography variant="h5">{task.estimated_hours}h</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Actual Hours
                </Typography>
                <Typography variant="h5">{task.actual_hours}h</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="h5">{getProgressPercentage()}%</Typography>
              </Grid>
            </Grid>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Variance: {task.actual_hours - task.estimated_hours > 0 ? '+' : ''}
                {task.actual_hours - task.estimated_hours}h
              </Typography>
            </Box>
          </Paper>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Subtasks ({task.subtasks.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {task.subtasks.map((subtask) => (
                      <TableRow
                        key={subtask.id}
                        hover
                        onClick={() => navigate(`/tasks/${subtask.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{subtask.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(subtask.status)}
                            size="small"
                            color={getStatusColor(subtask.status)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <UserAssignmentPanel
              resourceId={task.id}
              resourceType="task"
              assignedUsers={task.assigned_users || []}
              canManage={isMaster}
              onAssignmentChange={loadTask}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Task Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} label="New Status" onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Task Title"
              fullWidth
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={editForm.priority}
                label="Priority"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    priority: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                  })
                }
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editForm.start_date}
              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
            />
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editForm.deadline}
              onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
            />
            <TextField
              label="Estimated Hours"
              type="number"
              fullWidth
              value={editForm.estimated_hours}
              onChange={(e) =>
                setEditForm({ ...editForm, estimated_hours: parseFloat(e.target.value) })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetailPage;
