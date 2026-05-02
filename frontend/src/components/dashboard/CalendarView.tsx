import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Box,
  Paper,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';
import apiClient from '../../services/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  project_name?: string;
}

interface CalendarData {
  calendar: Record<string, Task[]>;
  summary: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
  };
}

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData(selectedDate);
  }, [selectedDate]);

  const loadCalendarData = async (date: Date) => {
    try {
      setLoading(true);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const response = await apiClient.get(`/dashboard/user`, {
        params: { month, year },
      });
      
      setCalendarData(response.data.data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      // Set empty calendar data on error
      setCalendarData({
        calendar: {},
        summary: {
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: Date) => {
    setSelectedDate(value);
  };

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      loadCalendarData(activeStartDate);
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    if (!calendarData) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData.calendar[dateStr] || [];
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const tasks = getTasksForDate(date);
    if (tasks.length === 0) return null;

    const completedCount = tasks.filter((t) => t.status === 'completada').length;
    const pendingCount = tasks.length - completedCount;

    return (
      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {pendingCount > 0 && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'error.main',
            }}
          />
        )}
        {completedCount > 0 && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'success.main',
            }}
          />
        )}
      </Box>
    );
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

  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Calendar
        </Typography>
        
        {calendarData && (
          <Box display="flex" gap={2} mb={2}>
            <Chip
              label={`Total: ${calendarData.summary.total_tasks}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Completed: ${calendarData.summary.completed_tasks}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Pending: ${calendarData.summary.pending_tasks}`}
              color="warning"
              variant="outlined"
            />
          </Box>
        )}

        <Box
          sx={{
            '& .react-calendar': {
              width: '100%',
              border: 'none',
              fontFamily: 'inherit',
            },
            '& .react-calendar__tile': {
              padding: '12px 6px',
              position: 'relative',
            },
            '& .react-calendar__tile--active': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
            '& .react-calendar__tile--now': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            },
          }}
        >
          <Calendar
            value={selectedDate}
            onChange={(value) => handleDateChange(value as Date)}
            onActiveStartDateChange={handleActiveStartDateChange}
            tileContent={getTileContent}
          />
        </Box>
      </Paper>

      {/* Tasks for Selected Date */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tasks for {format(selectedDate, 'MMMM d, yyyy')}
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : selectedDateTasks.length === 0 ? (
          <Typography color="text.secondary">No tasks for this date</Typography>
        ) : (
          <List>
            {selectedDateTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate(`/tasks/${task.id}`)}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">{task.title}</Typography>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority)}
                          />
                          <Chip label={formatStatus(task.status)} size="small" />
                        </Box>
                      }
                      secondary={task.project_name}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default CalendarView;
