import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createHelpRequest,
  getMyAssignedRequests,
  updateHelpRequestStatus,
  getMyRequests,
  getHelpRequestByConversation
} from '../controllers/helpRequestController';

const router = Router();

// Apply authentication to all routes
// This ensures only logged-in users can access these endpoints
router.use(authenticate);

// POST /api/help-requests - Create new help request (student)
router.post('/', createHelpRequest);

// GET /api/help-requests/assigned-to-me - Get requests assigned to me (senior)
router.get('/assigned-to-me', getMyAssignedRequests);

// GET /api/help-requests/my-requests - Get my requests (student)
router.get('/my-requests', getMyRequests);

// PUT /api/help-requests/:id/status - Update request status (senior)
router.put('/:id/status', updateHelpRequestStatus);

// GET /api/help-requests/conversation/:conversationId - Check if conversation has help request
router.get('/conversation/:conversationId', getHelpRequestByConversation);

export default router;