import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Chip } from '@mui/material';
import { Logout as LogoutIcon, AccountCircle, AdminPanelSettings, Person } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isMaster = user?.role === 'master';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TasksWeb
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircle />
            <Typography variant="body2">
              {user?.full_name}
            </Typography>
          </Box>
          <Chip
            icon={isMaster ? <AdminPanelSettings /> : <Person />}
            label={isMaster ? 'Administrator' : 'User'}
            color={isMaster ? 'error' : 'default'}
            size="small"
            variant={isMaster ? 'filled' : 'outlined'}
          />
          <NotificationBell />
          <IconButton onClick={handleLogout} color="inherit" title="Logout">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
