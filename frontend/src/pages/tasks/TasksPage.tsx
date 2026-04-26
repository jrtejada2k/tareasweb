import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { tasksService } from '../../services/api';
import { toast } from 'react-toastify';
import { useRole } from '../../hooks/useRole';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
}

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateTask } = useRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'not-started',
    priority: 'medium',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksService.getAll();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { projectsService } = await import('../../services/api');
      const response = await projectsService.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      project_id: '',
      title: '',
      description: '',
      status: 'not-started',
      priority: 'medium',
      start_date: '',
      end_date: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await tasksService.create(formData);
      toast.success('Task created successfully!');
      handleCloseDialog();
      loadTasks();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to create task');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        {canCreateTask && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            New Task
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Chip label={task.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={task.priority} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{task.end_date ? new Date(task.end_date).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              select
              label="Project"
              name="project_id"
              value={formData.project_id}
              onChange={handleInputChange}
              required
              fullWidth
              helperText={projects.length === 0 ? 'Please create a project first' : ''}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Task Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              fullWidth
            >
              <MenuItem value="not-started">Not Started</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
            <TextField
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            <TextField
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={projects.length === 0}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TasksPage;
