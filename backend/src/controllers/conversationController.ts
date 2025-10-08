import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Conversation, { IConversation } from '../models/Conversation';
import Message from '../models/Message';
import mongoose from 'mongoose';

/**
 * Get all conversations for the authenticated user
 * GET /api/conversations
 * 
 * This is called when:
 * - User logs in (load conversation history)
 * - User clicks refresh
 * - Sidebar needs to show conversation list
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. GET USER ID from the authenticated request
        // Remember: auth middleware already verified the token
        // and attached user info to req.userId
        const userId = req.userId;

        // 2. QUERY DATABASE for conversations
        // Find conversations where:
        // - user_id matches the logged-in user
        // - status is NOT 'deleted' (we do soft deletes)
        const conversations = await Conversation.find({
            user_id: userId,
            status: { $ne: 'deleted' }  // $ne = "not equal"
        })
            .sort({ last_activity_at: -1 })  // Sort by most recent activity first
            .select('-__v')
            .lean()                 // Don't send __v (Mongoose version field)

        // 3. TRANSFORM DATA for frontend
        // Convert MongoDB format to frontend format
        const formattedConversations = conversations.map(conv => ({
            id: conv._id.toString(),              // MongoDB ObjectId → string
            user_id: conv.user_id.toString(),     // MongoDB ObjectId → string
            title: conv.title,
            createdAt: conv.started_at.toISOString(),     // Date → ISO string
            updatedAt: conv.last_activity_at.toISOString(),
            currentStep: conv.current_step,
            messageCount: conv.message_count,
            status: conv.status
        }));

        // 4. SEND RESPONSE
        res.json({
            success: true,
            conversations: formattedConversations
        });

    } catch (error: any) {
        // 5. ERROR HANDLING
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message
        });
    }
};



/**
 * Create a new conversation
 * POST /api/conversations
 * Body: { title?: string }
 * 
 * This is called when:
 * - User clicks "New Chat" button
 * - User sends first message (auto-creates conversation)
 */
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. GET USER ID and request data
        const userId = req.userId;
        const { title } = req.body;

        // 2. CREATE CONVERSATION in database
        const conversation = await Conversation.create({
            user_id: userId,              // Who owns this conversation
            title: title || 'New Chat',   // Use provided title or default
            status: 'active',              // New conversations are active
            started_at: new Date(),        // Current timestamp
            last_activity_at: new Date(),  // Same as started_at initially
            current_step: 1,               // Socratic method starts at step 1
            message_count: 0               // No messages yet
        });

        // 3. FORMAT RESPONSE for frontend
        const formattedConversation = {
            id: (conversation._id as mongoose.Types.ObjectId).toString(),
            user_id: (conversation.user_id as mongoose.Types.ObjectId).toString(),
            title: conversation.title,
            createdAt: conversation.started_at.toISOString(),
            updatedAt: conversation.last_activity_at.toISOString(),
            currentStep: conversation.current_step,
            messageCount: conversation.message_count,
            status: conversation.status
        };

        // 4. SEND RESPONSE with 201 Created status
        res.status(201).json({
            success: true,
            conversation: formattedConversation
        });

    } catch (error: any) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create conversation',
            error: error.message
        });
    }
};


/**
 * Get a specific conversation with its messages
 * GET /api/conversations/:id
 * 
 * This is called when:
 * - User clicks on a conversation in sidebar
 * - Page loads with a conversation ID in URL
 * - User refreshes while viewing a conversation
 */
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. GET CONVERSATION ID from URL parameter
        const { id } = req.params;  // From /api/conversations/:id
        const userId = req.userId;

        // 2. VALIDATE the ID format
        // MongoDB ObjectIds have specific format (24 hex characters)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid conversation ID'
            });
            return;
        }

        // 3. FIND THE CONVERSATION
        // Must belong to user AND not be deleted
        const conversation = await Conversation.findOne({
            _id: id,
            user_id: userId,              // SECURITY: Only owner can access
            status: { $ne: 'deleted' }    // Can't access deleted conversations
        }).lean();

        // 4. CHECK IF FOUND
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
            return;
        }

        // 5. FETCH MESSAGES for this conversation
        // Get all messages, sorted by sequence number
        const messages = await Message.find({
            conversation_id: id
        })
            .sort({ seq: 1 })  // Sort by sequence: 1, 2, 3, 4...
            .select('-__v')
            .lean();

        // 6. FORMAT MESSAGES for frontend
        const formattedMessages = messages.map(msg => ({
            id: msg._id.toString(),
            type: msg.role === 'user' ? 'user' : 'assistant',  // Convert role to type
            content: msg.content,
            timestamp: msg.date_created.toISOString(),
            step: msg.step,
            validation: msg.validation,
            notes: msg.notes
        }));

        // 7. FORMAT CONVERSATION
        const formattedConversation = {
            id: conversation._id.toString(),
            user_id: conversation.user_id.toString(),
            title: conversation.title,
            createdAt: conversation.started_at.toISOString(),
            updatedAt: conversation.last_activity_at.toISOString(),
            currentStep: conversation.current_step,
            messageCount: conversation.message_count,
            status: conversation.status
        };

        // 8. SEND RESPONSE with conversation AND messages
        res.json({
            success: true,
            conversation: formattedConversation,
            messages: formattedMessages  // ← Real messages now!
        });

    } catch (error: any) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation',
            error: error.message
        });
    }
};


/**
 * Update a conversation
 * PUT /api/conversations/:id
 * Body: { title?, currentStep?, status? }
 * 
 * This is called when:
 * - User renames a conversation
 * - System updates current step
 * - User archives a conversation
 */
export const updateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { title, currentStep, status } = req.body;
  
      // 1. VALIDATE ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID'
        });
        return;
      }
  
      // 2. BUILD UPDATE OBJECT
      // Only include fields that were provided
      const updateData: any = {
        last_activity_at: new Date()  // Always update last activity
      };
  
      if (title !== undefined) updateData.title = title;
      if (currentStep !== undefined) updateData.current_step = currentStep;
      if (status !== undefined) updateData.status = status;
  
      // 3. UPDATE CONVERSATION
      // findOneAndUpdate: find + update in one operation
      const conversation = await Conversation.findOneAndUpdate(
        { 
          _id: id, 
          user_id: userId  // SECURITY: Only update if user owns it
        },
        updateData,
        { 
          new: true,          // Return updated document (not old one)
          runValidators: true // Run schema validations
        }
      ).lean();
  
      // 4. CHECK IF FOUND
      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
        return;
      }
  
      // 5. FORMAT AND SEND RESPONSE
      const formattedConversation = {
        id: conversation._id.toString(),
        user_id: conversation.user_id.toString(),
        title: conversation.title,
        createdAt: conversation.started_at.toISOString(),
        updatedAt: conversation.last_activity_at.toISOString(),
        currentStep: conversation.current_step,
        messageCount: conversation.message_count,
        status: conversation.status
      };
  
      res.json({
        success: true,
        conversation: formattedConversation
      });
  
    } catch (error: any) {
      console.error('Error updating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update conversation',
        error: error.message
      });
    }
  };
  
/**
* Delete a conversation (soft delete)
* DELETE /api/conversations/:id
* 
* This is called when:
* - User clicks delete button on a conversation
* - User wants to remove a conversation from their list
* 
* Note: This is a SOFT DELETE - we mark it as deleted, not actually remove it
* This allows for potential recovery and maintains data integrity
*/
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId;
  
      // 1. VALIDATE ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID'
        });
        return;
      }
  
      // 2. SOFT DELETE
      // Set status to 'deleted' instead of actually removing
      const conversation = await Conversation.findOneAndUpdate(
        { 
          _id: id, 
          user_id: userId  // SECURITY: Only delete if user owns it
        },
        { 
          status: 'deleted',
          last_activity_at: new Date()
        },
        { new: true }
      );
  
      // 3. CHECK IF FOUND
      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
        return;
      }
  
      // 4. SEND SUCCESS RESPONSE
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
  
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete conversation',
        error: error.message
      });
    }
};