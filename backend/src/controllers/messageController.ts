import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import mongoose from 'mongoose';

/**
 * Add a new message to a conversation
 * POST /api/conversations/:id/messages
 * Body: { type, content, step?, validation?, notes? }
 * 
 * This is called when:
 * - User sends a message
 * - AI responds with a message
 * 
 * CRITICAL: This function updates BOTH collections:
 * - Creates message in messages collection
 * - Updates conversation metadata (count, timestamp, step)
 */
export const createMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. GET DATA from request
    const { id } = req.params;  // conversation_id from URL
    const userId = req.userId;
    const { type, content, step, validation, notes } = req.body;

    // 2. VALIDATE INPUTS
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
      return;
    }

    if (!content || !type) {
      res.status(400).json({
        success: false,
        message: 'Message content and type are required'
      });
      return;
    }

    // 3. VERIFY CONVERSATION EXISTS and user owns it
    const conversation = await Conversation.findOne({
      _id: id,
      user_id: userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
      return;
    }

    // 4. GET NEXT SEQUENCE NUMBER
    // Find the last message to determine next seq
    const lastMessage = await Message.findOne({ 
      conversation_id: id 
    })
      .sort({ seq: -1 })  // Sort descending (highest seq first)
      .select('seq')       // Only need the seq field
      .lean();
    
    const nextSeq = lastMessage ? lastMessage.seq + 1 : 1;

    // 5. CREATE THE MESSAGE
    const message = await Message.create({
      conversation_id: id,
      role: type === 'user' ? 'user' : 'assistant',
      sender_id: type === 'user' ? userId : undefined,  // Only users have sender_id
      content,
      seq: nextSeq,
      date_created: new Date(),
      step,
      validation,
      notes
    });

    // 6. UPDATE CONVERSATION (CRITICAL!)
    // This keeps conversation metadata in sync
    const updateData: any = {
      last_activity_at: new Date(),
      $inc: { message_count: 1 }  // Atomically increment count
    };
    
    if (step !== undefined) {
      updateData.current_step = step;
    }

    await Conversation.findByIdAndUpdate(id, updateData);

    // 7. FORMAT RESPONSE
    const formattedMessage = {
      id: (message._id as mongoose.Types.ObjectId).toString(),
      type: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
      timestamp: message.date_created.toISOString(),
      step: message.step,
      validation: message.validation,
      notes: message.notes
    };

    // 8. SEND RESPONSE with 201 Created
    res.status(201).json({
      success: true,
      message: formattedMessage
    });

  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error.message
    });
  }
};