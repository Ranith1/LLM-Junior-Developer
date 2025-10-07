import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
    // @ts-ignore - TypeScript has issues with jwt.sign types, but this works correctly at runtime
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  };

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields: name, email, password, role' 
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
      return;
    }

    if (!['student', 'senior'].includes(role)) {
      res.status(400).json({ 
        success: false, 
        message: 'Role must be either "student" or "senior"' 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username: email }] 
    });

    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
      return;
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = await User.create({
      name,
      email,
      username: email, // Using email as username for consistency
      password,
      roles: [role]
    });

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.roles[0] // Frontend expects single role
      },
      token
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user', 
      error: error.message 
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
      return;
    }

    // Find user by email or username
    const user = await User.findOne({ 
      $or: [{ email }, { username: email }] 
    });

    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.roles[0] // Frontend expects single role
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging in', 
      error: error.message 
    });
  }
};

/**
 * Verify token and get user data
 * GET /api/auth/verify
 */
export const verify = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // User is already attached by authenticate middleware
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        email: req.user.email,
        role: req.user.roles[0]
      }
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying token', 
      error: error.message 
    });
  }
};

/**
 * Logout user (client-side will remove token)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // With JWT, logout is primarily client-side (remove token from storage)
  // Server-side logout would require token blacklisting, which is optional
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};