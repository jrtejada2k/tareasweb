/**
 * Role-based access control hook
 * 
 * Provides utilities to check user roles and permissions
 */

import { useAuth } from '../contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();

  const isMaster = user?.role === 'master';
  const isUser = user?.role === 'user';
  const isAuthenticated = !!user;

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: 'master' | 'user'): boolean => {
    return user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (...roles: Array<'master' | 'user'>): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  /**
   * Check if user can perform admin actions
   */
  const canManageProjects = isMaster;
  const canManageTasks = isMaster;
  const canManageUsers = isMaster;
  const canViewAllTasks = isMaster;
  const canCreateProject = isMaster;
  const canCreateTask = isMaster;
  const canDeleteProject = isMaster;
  const canDeleteTask = isMaster;

  /**
   * Check if user can edit their own tasks
   */
  const canEditOwnTasks = isAuthenticated;
  const canViewOwnTasks = isAuthenticated;

  return {
    user,
    isMaster,
    isUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    // Permissions
    canManageProjects,
    canManageTasks,
    canManageUsers,
    canViewAllTasks,
    canCreateProject,
    canCreateTask,
    canDeleteProject,
    canDeleteTask,
    canEditOwnTasks,
    canViewOwnTasks,
  };
};
