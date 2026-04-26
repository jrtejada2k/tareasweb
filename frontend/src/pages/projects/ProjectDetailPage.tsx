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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService } from '../../services/api';
import { tasksService } from '../../services/api';
import UserAssignmentPanel from '../../components/assignments/UserAssignmentPanel';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_users?: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assigned_users?: Array<{ full_name: string }>;
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'archived' | 'completed',
    start_date: '',
    end_date: '',
  });

  const isMaster = user?.role === 'master';

  useEffect(() => {
    loadProject();
    loadProjectTasks();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getById(id!);
      setProject(response.project);
      setEditForm({
        name: response.project.name,
        description: response.project.description,
        status: response.project.status,
        start_date: response.project.start_date.split('T')[0],
        end_date: response.project.end_date.split('T')[0],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTasks = async () => {
    try {
      const response = await tasksService.getAll({ project_id: id });
      setTasks(response.tasks);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    }
  };

  const handleEditSubmit = async () => {
    try {
      await projectsService.update(id!, editForm);
      toast.success('Project updated successfully');
      setEditDialogOpen(false);
      loadProject();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    try {
      await projectsService.delete(id!);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'archived':
        return 'default';
      case 'completed':
        return 'primary';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box p={3}>
        <Typography>Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/projects')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{project.name}</Typography>
          <Chip label={project.status} color={getStatusColor(project.status)} />
        </Box>
        {isMaster && (
          <Box display="flex" gap={1}>
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
        {/* Project Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {project.description}
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(project.start_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(project.end_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(project.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(project.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Tasks List */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Tasks ({tasks.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/tasks')}
              >
                Add Task
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Assigned To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
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
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(task.deadline).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {task.assigned_users?.map((u) => u.full_name).join(', ') || 'Unassigned'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <UserAssignmentPanel
              resourceId={project.id}
              resourceType="project"
              assignedUsers={project.assigned_users || []}
              canManage={isMaster}
              onAssignmentChange={loadProject}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Project Name"
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as 'active' | 'archived' | 'completed',
                  })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
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
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editForm.end_date}
              onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
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
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this project? This action cannot be undone and will also
            delete all associated tasks.
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

export default ProjectDetailPage;
