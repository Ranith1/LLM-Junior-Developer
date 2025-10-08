import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation
} from '../controllers/conversationController';
import {
  createMessage
} from '../controllers/messageController';

// CREATE ROUTER
const router = Router();

// APPLY AUTHENTICATION TO ALL ROUTES
// Every route in this file requires a valid JWT token
router.use(authenticate);

// ============================================
// CONVERSATION ROUTES
// ============================================

// GET /api/conversations
// Get all conversations for logged-in user
router.get('/', getConversations);

// POST /api/conversations
// Create a new conversation
router.post('/', createConversation);

// GET /api/conversations/:id
// Get specific conversation with messages
router.get('/:id', getConversation);

// PUT /api/conversations/:id
// Update conversation (title, step, status)
router.put('/:id', updateConversation);

// DELETE /api/conversations/:id
// Soft delete conversation
router.delete('/:id', deleteConversation);

// ============================================
// MESSAGE ROUTES (nested under conversations)
// ============================================

// POST /api/conversations/:id/messages
// Add a message to a conversation
router.post('/:id/messages', createMessage);

// EXPORT ROUTER
export default router;