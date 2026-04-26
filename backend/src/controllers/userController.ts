/**
 * User Controller
 * 
 * Handles HTTP requests for user management
 */

import { Request, Response, NextFunction } from 'express';
import * as userService from '@services/userService';

/**
 * Get all users (master only)
 * GET /api/v1/users
 */
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params['id'];
    if (!id) {
      res.status(400).json({
        success: false,
        error: { message: 'User ID is required' },
      });
      return;
    }

    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
