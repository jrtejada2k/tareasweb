import React, { useEffect, useState, useCallback } from 'react';
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
  Collapse,
  Grid,
  FormControlLabel,
  Switch,
  Pagination,
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';
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
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
}

type StatusColor = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
type PriorityColor = 'default' | 'info' | 'warning' | 'error';

const statusColorMap: Record<string, StatusColor> = {
  not_started: 'default',
  iniciada: 'primary',
  en_progreso: 'info',
  completada: 'success',
  blocked: 'warning',
  cancelled: 'error',
};

const priorityColorMap: Record<string, PriorityColor> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatPriority = (priority: string): string =>
  priority.charAt(0).toUpperCase() + priority.slice(1);

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMaster, canCreateTask } = useRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEndDateFrom, setFilterEndDateFrom] = useState('');
  const [filterEndDateTo, setFilterEndDateTo] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    start_date: '',
    end_date: '',
  });

  const loadTasks = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterProjectId) params.project_id = filterProjectId;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterEndDateFrom) params.end_date_from = filterEndDateFrom;
      if (filterEndDateTo) params.end_date_to = filterEndDateTo;
      if (!isMaster && assignedToMe) params.assigned_to_me = 'true';

      const response = await tasksService.getAll(params);
      setTasks(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages ?? 1);
        setCurrentPage(response.pagination.page ?? page);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, filterProjectId, filterStatus, filterPriority, filterEndDateFrom, filterEndDateTo, assignedToMe, isMaster]);

  const loadProjects = async () => {
    try {
      const { projectsService } = await import('../../services/api');
      const response = await projectsService.getAll();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadTasks(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filterProjectId, filterStatus, filterPriority, filterEndDateFrom, filterEndDateTo, assignedToMe]);

  const handleClearFilters = () => {
    setSearch('');
    setFilterProjectId('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterEndDateFrom('');
    setFilterEndDateTo('');
    setAssignedToMe(false);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    loadTasks(page);
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
      status: 'not_started',
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
      const payload = {
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        description: formData.description || undefined,
      };
      await tasksService.create(payload);
      toast.success('Task created successfully!');
      handleCloseDialog();
      loadTasks(currentPage);
    } catch (error: unknown) {
      console.error('Failed to create task:', error);
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create task');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters((prev) => !prev)}
            size="small"
          >
            Filters
          </Button>
        </Box>
        {canCreateTask && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            New Task
          </Button>
        )}
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Project"
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="iniciada">Iniciada</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="End Date From"
                type="date"
                value={filterEndDateFrom}
                onChange={(e) => setFilterEndDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="End Date To"
                type="date"
                value={filterEndDateTo}
                onChange={(e) => setFilterEndDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            {!isMaster && (
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={assignedToMe}
                      onChange={(e) => setAssignedToMe(e.target.checked)}
                    />
                  }
                  label="Assigned to Me"
                />
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button variant="contained" onClick={() => { setCurrentPage(1); loadTasks(1); }}>
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
                  <TableCell>{task.project_name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(task.status)}
                      size="small"
                      color={statusColorMap[task.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatPriority(task.priority)}
                      size="small"
                      color={priorityColorMap[task.priority] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{task.end_date ? new Date(task.end_date).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

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
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="iniciada">Iniciada</MenuItem>
              <MenuItem value="en_progreso">En Progreso</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
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
