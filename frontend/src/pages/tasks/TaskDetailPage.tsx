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
import { tasksService, timeEntriesService, deadlineRequestsService } from '../../services/api';
import { assignmentsService } from '../../services/assignmentsService';
import UserAssignmentPanel from '../../components/assignments/UserAssignmentPanel';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  end_date: string;
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

interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours_worked: number;
  work_date: string;
  description: string | null;
  created_at: string;
}

interface DeadlineRequest {
  id: string;
  task_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'denied';
  current_deadline: string;
  requested_deadline: string;
  reason: string;
  review_notes: string | null;
  created_at: string;
}

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<Array<{id: string; full_name: string; email: string}>>([]);
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
    end_date: '',
    estimated_hours: 0,
  });

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [logTimeDialogOpen, setLogTimeDialogOpen] = useState(false);
  const [logTimeForm, setLogTimeForm] = useState({
    hours_worked: 1,
    work_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [deadlineRequests, setDeadlineRequests] = useState<DeadlineRequest[]>([]);
  const [requestExtensionDialogOpen, setRequestExtensionDialogOpen] = useState(false);
  const [extensionForm, setExtensionForm] = useState({
    requested_deadline: '',
    reason: '',
  });

  const [addSubtaskDialogOpen, setAddSubtaskDialogOpen] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    start_date: '',
    end_date: '',
    estimated_hours: '',
  });

  const isMaster = user?.role === 'master';

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => {
    loadTask();
    loadTimeEntries();
    loadDeadlineRequests();
    loadAssignedUsers();
  }, [id]);

  const loadAssignedUsers = async () => {
    try {
      const response = await assignmentsService.getTaskUsers(id!);
      const users = (response.data || []).map((a: any) => ({
        id: a.user_id,
        full_name: a.user_full_name,
        email: a.user_email,
      }));
      setAssignedUsers(users);
    } catch {
      // non-critical
    }
  };

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await tasksService.getById(id!, true);
      setTask(response.data);
      setNewStatus(response.data.status);
      setEditForm({
        title: response.data.title,
        description: response.data.description,
        priority: response.data.priority,
        start_date: response.data.start_date ? response.data.start_date.split('T')[0] : '',
        end_date: response.data.end_date ? response.data.end_date.split('T')[0] : '',
        estimated_hours: response.data.estimated_hours,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const response = await timeEntriesService.getByTask(id!);
      setTimeEntries(response.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load time entries');
    }
  };

  const loadDeadlineRequests = async () => {
    try {
      const response = await deadlineRequestsService.getAll({ task_id: id! });
      setDeadlineRequests(response.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load deadline requests');
    }
  };

  const handleEditSubmit = async () => {
    try {
      await tasksService.update(id!, {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined,
      });
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

  const handleLogTimeSubmit = async () => {
    try {
      await timeEntriesService.create({
        task_id: id!,
        hours_worked: logTimeForm.hours_worked,
        work_date: logTimeForm.work_date,
        description: logTimeForm.description || undefined,
      });
      toast.success('Time logged successfully');
      setLogTimeDialogOpen(false);
      setLogTimeForm({ hours_worked: 1, work_date: today, description: '' });
      loadTask();
      loadTimeEntries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to log time');
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    try {
      await timeEntriesService.delete(entryId);
      toast.success('Time entry deleted');
      loadTimeEntries();
      loadTask();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete time entry');
    }
  };

  const handleRequestExtensionSubmit = async () => {
    if (extensionForm.reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    try {
      await deadlineRequestsService.create({
        task_id: id!,
        requested_deadline: extensionForm.requested_deadline,
        reason: extensionForm.reason,
      });
      toast.success('Extension request submitted');
      setRequestExtensionDialogOpen(false);
      setExtensionForm({ requested_deadline: '', reason: '' });
      loadDeadlineRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit extension request');
    }
  };

  const handleAddSubtaskSubmit = async () => {
    if (!task) return;
    try {
      await tasksService.create({
        project_id: task.project_id,
        parent_task_id: id!,
        title: subtaskForm.title,
        description: subtaskForm.description || undefined,
        priority: subtaskForm.priority,
        start_date: subtaskForm.start_date || undefined,
        end_date: subtaskForm.end_date || undefined,
      });
      toast.success('Subtask created successfully');
      setAddSubtaskDialogOpen(false);
      setSubtaskForm({ title: '', description: '', priority: 'medium', start_date: '', end_date: '', estimated_hours: '' });
      loadTask();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create subtask');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'iniciada':
        return 'primary';
      case 'en_progreso':
        return 'info';
      case 'blocked':
        return 'warning';
      case 'completada':
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

  const getDeadlineRequestStatusColor = (status: 'pending' | 'approved' | 'denied') => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
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
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => setStatusDialogOpen(true)}>
            Change Status
          </Button>
          {isMaster && (
            <>
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
            </>
          )}
        </Box>
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
                    {task.start_date ? new Date(task.start_date).toLocaleDateString() : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Deadline
                  </Typography>
                  <Typography variant="body1">
                    {task.end_date ? new Date(task.end_date).toLocaleDateString() : '—'}
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
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <TimeIcon />
                <Typography variant="h6">Time Tracking</Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => setLogTimeDialogOpen(true)}>
                Log Time
              </Button>
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
            {timeEntries.length > 0 && (
              <Box mt={2}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.work_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.hours_worked}h</TableCell>
                          <TableCell>{entry.description || '—'}</TableCell>
                          <TableCell>
                            {(user?.id === entry.user_id || isMaster) && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTimeEntry(entry.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>

          {/* Deadline Extension Requests */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Deadline Extension Requests</Typography>
              {!isMaster && task.end_date && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setRequestExtensionDialogOpen(true)}
                >
                  Request Extension
                </Button>
              )}
            </Box>
            {deadlineRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No extension requests
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date Requested</TableCell>
                      <TableCell>Requested Deadline</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deadlineRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(req.requested_deadline).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={req.status}
                            size="small"
                            color={getDeadlineRequestStatusColor(req.status)}
                          />
                        </TableCell>
                        <TableCell>{req.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Subtasks */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" gutterBottom>
                Subtasks {task.subtasks && task.subtasks.length > 0 ? `(${task.subtasks.length})` : ''}
              </Typography>
              {isMaster && (
                <Button variant="outlined" size="small" onClick={() => setAddSubtaskDialogOpen(true)}>
                  Add Sub-task
                </Button>
              )}
            </Box>
            {task.subtasks && task.subtasks.length > 0 ? (
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
            ) : (
              <Typography variant="body2" color="text.secondary">
                No subtasks
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <UserAssignmentPanel
              resourceId={task.id}
              resourceType="task"
              assignedUsers={assignedUsers}
              canManage={isMaster}
              onAssignmentChange={loadAssignedUsers}
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
              <MenuItem value="iniciada">Iniciada</MenuItem>
              <MenuItem value="en_progreso">En Progreso</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
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
              value={editForm.end_date}
              onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
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

      {/* Log Time Dialog */}
      <Dialog open={logTimeDialogOpen} onClose={() => setLogTimeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Hours Worked"
              type="number"
              fullWidth
              inputProps={{ min: 0.01, max: 24, step: 0.01 }}
              value={logTimeForm.hours_worked}
              onChange={(e) =>
                setLogTimeForm({ ...logTimeForm, hours_worked: parseFloat(e.target.value) })
              }
            />
            <TextField
              label="Work Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: today }}
              value={logTimeForm.work_date}
              onChange={(e) => setLogTimeForm({ ...logTimeForm, work_date: e.target.value })}
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              value={logTimeForm.description}
              onChange={(e) => setLogTimeForm({ ...logTimeForm, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogTimeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogTimeSubmit} variant="contained">
            Log Time
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Extension Dialog */}
      <Dialog
        open={requestExtensionDialogOpen}
        onClose={() => setRequestExtensionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Deadline Extension</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Requested Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: tomorrow }}
              value={extensionForm.requested_deadline}
              onChange={(e) =>
                setExtensionForm({ ...extensionForm, requested_deadline: e.target.value })
              }
            />
            <TextField
              label="Reason"
              fullWidth
              multiline
              rows={4}
              required
              value={extensionForm.reason}
              onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
              helperText="Minimum 10 characters"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestExtensionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRequestExtensionSubmit} variant="contained">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Sub-task Dialog */}
      <Dialog open={addSubtaskDialogOpen} onClose={() => setAddSubtaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Sub-task</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              fullWidth
              required
              value={subtaskForm.title}
              onChange={(e) => setSubtaskForm({ ...subtaskForm, title: e.target.value })}
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              value={subtaskForm.description}
              onChange={(e) => setSubtaskForm({ ...subtaskForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={subtaskForm.priority}
                label="Priority"
                onChange={(e) =>
                  setSubtaskForm({
                    ...subtaskForm,
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
              label="Start Date (optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={subtaskForm.start_date}
              onChange={(e) => setSubtaskForm({ ...subtaskForm, start_date: e.target.value })}
            />
            <TextField
              label="End Date (optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={subtaskForm.end_date}
              onChange={(e) => setSubtaskForm({ ...subtaskForm, end_date: e.target.value })}
            />
            <TextField
              label="Estimated Hours (optional)"
              type="number"
              fullWidth
              value={subtaskForm.estimated_hours}
              onChange={(e) => setSubtaskForm({ ...subtaskForm, estimated_hours: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSubtaskDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddSubtaskSubmit}
            variant="contained"
            disabled={!subtaskForm.title.trim()}
          >
            Create Sub-task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetailPage;
