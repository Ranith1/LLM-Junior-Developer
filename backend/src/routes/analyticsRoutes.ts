import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserBasicAnalytics,
  getUserBasicAnalyticsMe,
  getUserBasicAnalyticsByEmail,
} from '../controllers/analyticsController';

const router = Router();

// All analytics endpoints require auth
router.use(authenticate);

// Students: view their own analytics
router.get('/user/me', getUserBasicAnalyticsMe);

// Seniors: look up a student's analytics by email (must come before :id to avoid route collision)
router.get('/user/by-email/:email', getUserBasicAnalyticsByEmail);

// Seniors (or a student viewing themselves): analytics by user id
router.get('/user/:id', getUserBasicAnalytics);

export default router;
