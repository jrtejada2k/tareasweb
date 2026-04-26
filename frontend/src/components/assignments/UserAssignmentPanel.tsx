// components/assignments/UserAssignmentPanel.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { usersService, User } from '../../services/usersService';
import { assignmentsService } from '../../services/assignmentsService';
import { toast } from 'react-toastify';

interface UserAssignmentPanelProps {
  resourceId: string;
  resourceType: 'project' | 'task';
  assignedUsers?: Array<{ id: string; full_name: string; email: string }>;
  canManage: boolean;
  onAssignmentChange?: () => void;
}

const UserAssignmentPanel: React.FC<UserAssignmentPanelProps> = ({
  resourceId,
  resourceType,
  assignedUsers = [],
  canManage,
  onAssignmentChange,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { users } = await usersService.getAll();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      if (resourceType === 'project') {
        await assignmentsService.assignUserToProject(resourceId, selectedUserId);
      } else {
        await assignmentsService.assignUserToTask(resourceId, selectedUserId);
      }

      toast.success('User assigned successfully!');
      setSelectedUserId('');
      onAssignmentChange?.();
    } catch (error: any) {
      console.error('Failed to assign user:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Remove this user assignment?')) {
      return;
    }

    setLoading(true);
    try {
      if (resourceType === 'project') {
        await assignmentsService.removeUserFromProject(resourceId, userId);
      } else {
        await assignmentsService.removeUserFromTask(resourceId, userId);
      }

      toast.success('User removed successfully!');
      onAssignmentChange?.();
    } catch (error: any) {
      console.error('Failed to remove user:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !assignedUsers.some((assigned) => assigned.id === user.id)
  );

  if (loadingUsers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Assigned Users
      </Typography>

      {assignedUsers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No users assigned yet
        </Typography>
      ) : (
        <List dense>
          {assignedUsers.map((user) => (
            <ListItem key={user.id}>
              <ListItemText primary={user.full_name} secondary={user.email} />
              {canManage && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemove(user.id)}
                    disabled={loading}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {canManage && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Select User"
                disabled={loading || availableUsers.length === 0}
              >
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAssign}
              disabled={loading || !selectedUserId}
            >
              Assign
            </Button>
          </Box>
          {availableUsers.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              All users are already assigned
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
};

export default UserAssignmentPanel;
