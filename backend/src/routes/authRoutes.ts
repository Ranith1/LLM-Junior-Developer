import express from 'express';
import { signup, login, verify, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/verify', authenticate, verify);
router.post('/logout', authenticate, logout);

export default router;