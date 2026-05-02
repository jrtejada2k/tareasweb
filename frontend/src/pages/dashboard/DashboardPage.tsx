import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import CalendarView from '../../components/dashboard/CalendarView';
import UpcomingTasksPanel from '../../components/dashboard/UpcomingTasksPanel';
import MasterDashboard from '../../components/dashboard/MasterDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isMaster } = useRole();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.full_name}!
        </Typography>
      </Box>

      {isMaster ? (
        <MasterDashboard />
      ) : (
        // User Dashboard - Show calendar and upcoming tasks
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <CalendarView />
          </Grid>
          <Grid item xs={12} lg={4}>
            <UpcomingTasksPanel />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardPage;
