import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/api';
import PendingTasksPanel from './PendingTasksPanel';

interface Statistics {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  total_users: number;
}

interface TaskSummary {
  total: number;
  not_started: number;
  iniciada: number;
  en_progreso: number;
  completada: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  task_summary: TaskSummary;
  assigned_users: number;
}

interface AtRiskTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  end_date: string;
  project_id: string;
  project_name: string;
  assigned_users_count: number;
}

interface DeadlineRequest {
  id: string;
  task_id: string;
  task_title: string;
  project_id: string;
  project_name: string;
  requested_by: string;
  requester_name: string;
  status: 'pending' | 'approved' | 'denied';
  current_deadline: string | null;
  requested_deadline: string | null;
  reason: string;
  created_at: string;
}

interface MasterDashboardData {
  statistics: Statistics;
  projects: Project[];
  at_risk_tasks: AtRiskTask[];
  recent_deadline_requests: DeadlineRequest[];
}

const MasterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardService
      .getMasterDashboard()
      .then((response: { success: boolean; data: MasterDashboardData }) => {
        setData(response.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  const { statistics, projects, at_risk_tasks, recent_deadline_requests } = data;

  const statCards = [
    { label: 'Total Projects', value: statistics.total_projects, icon: <FolderIcon />, color: undefined },
    { label: 'Active Projects', value: statistics.active_projects, icon: <PlayArrowIcon color="success" />, color: 'success.main' },
    { label: 'Total Tasks', value: statistics.total_tasks, icon: <AssignmentIcon />, color: undefined },
    { label: 'Completed Tasks', value: statistics.completed_tasks, icon: <CheckCircleIcon color="success" />, color: 'success.main' },
    { label: 'Total Users', value: statistics.total_users, icon: <GroupIcon />, color: undefined },
  ];

  const projectStatusColor = (status: Project['status']): 'success' | 'default' | 'primary' => {
    if (status === 'active') return 'success';
    if (status === 'completed') return 'primary';
    return 'default';
  };

  const requestStatusColor = (status: DeadlineRequest['status']): 'warning' | 'success' | 'error' => {
    if (status === 'approved') return 'success';
    if (status === 'denied') return 'error';
    return 'warning';
  };

  const formatDate = (str: string | null): string => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString();
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg key={card.label}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: card.color ?? 'text.secondary' }}>{card.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" gutterBottom>
            Projects
          </Typography>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} lg={4} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea
                    onClick={() => navigate(`/projects/${project.id}`)}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1, mr: 1 }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status}
                          color={projectStatusColor(project.status)}
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flexGrow: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 1,
                        }}
                      >
                        {project.description ?? ''}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
                        {project.task_summary.not_started > 0 && (
                          <Chip label={`NS: ${project.task_summary.not_started}`} size="small" />
                        )}
                        {project.task_summary.iniciada > 0 && (
                          <Chip label={`I: ${project.task_summary.iniciada}`} size="small" color="primary" />
                        )}
                        {project.task_summary.en_progreso > 0 && (
                          <Chip label={`EP: ${project.task_summary.en_progreso}`} size="small" color="info" />
                        )}
                        {project.task_summary.completada > 0 && (
                          <Chip label={`C: ${project.task_summary.completada}`} size="small" color="success" />
                        )}
                        <Box display="flex" alignItems="center" gap={0.25} ml="auto">
                          <PersonIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{project.assigned_users}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            ({project.task_summary.total})
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <WarningAmberIcon color="warning" />
              <Typography variant="h6">At-Risk Tasks</Typography>
            </Box>
            {at_risk_tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No at-risk tasks
              </Typography>
            ) : (
              <List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
                {at_risk_tasks.map((task) => (
                  <ListItem
                    key={task.id}
                    button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={task.project_name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Chip
                        label={formatDate(task.end_date)}
                        size="small"
                        sx={{ backgroundColor: 'error.main', color: 'error.contrastText' }}
                      />
                      <Chip label={task.priority} size="small" variant="outlined" />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <PendingTasksPanel />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Recent Deadline Requests
        </Typography>
        {recent_deadline_requests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recent requests
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Original Deadline</TableCell>
                  <TableCell>Requested Deadline</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent_deadline_requests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                        onClick={() => navigate(`/tasks/${req.task_id}`)}
                      >
                        {req.task_title}
                      </Typography>
                    </TableCell>
                    <TableCell>{req.project_name}</TableCell>
                    <TableCell>{req.requester_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        size="small"
                        color={requestStatusColor(req.status)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(req.current_deadline)}</TableCell>
                    <TableCell>{formatDate(req.requested_deadline)}</TableCell>
                    <TableCell>{formatDate(req.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default MasterDashboard;
