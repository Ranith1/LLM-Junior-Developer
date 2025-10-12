import { Request, Response } from 'express';
import HelpRequest from '../models/HelpRequest';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

/**
 * Create a new help request
 * POST /api/help-requests
 */
export const createHelpRequest = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, problemDescription } = req.body;

        // Get student info
        const student = await User.findById(userId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify conversation belongs to student
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user_id: userId
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Get conversation messages for summary
        const messages = await Message.find({ conversation_id: conversationId })
            .sort({ seq: 1 })
            .limit(10);

        const conversationSummary = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');

        // Find a random senior engineer
        const seniors = await User.find({ roles: 'senior' });

        if (seniors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No senior engineers available at the moment'
            });
        }

        // Select random senior
        const randomSenior = seniors[Math.floor(Math.random() * seniors.length)];

        // Create help request
        const helpRequest = new HelpRequest({
            student_id: userId,
            student_name: student.name,
            student_email: student.email,
            conversation_id: conversationId,
            problem_description: problemDescription,
            conversation_summary: conversationSummary,
            assigned_senior_id: randomSenior._id,
            status: 'pending'
        });

        await helpRequest.save();

        return res.status(201).json({
            success: true,
            message: 'Help request created successfully',
            helpRequest: {
                id: helpRequest._id,
                assignedSenior: {
                    name: randomSenior.name,
                    email: randomSenior.email
                }
            }
        });

    } catch (error) {
        console.error('Error creating help request:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error creating help request'
        });
    }
};

/**
 * Get help requests assigned to the logged-in senior engineer
 * GET /api/help-requests/assigned-to-me
 */
export const getMyAssignedRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Verify user is a senior
        const user = await User.findById(userId);
        if (!user || !user.roles.includes('senior')) {
            return res.status(403).json({
                success: false,
                message: 'Only senior engineers can access this endpoint'
            });
        }

        const helpRequests = await HelpRequest.find({
            assigned_senior_id: userId,
            status: { $in: ['pending', 'contacted'] }
          })
          .sort({ created_at: -1 })
          .populate('student_id', 'name email')
          .populate('conversation_id', 'title')
          .lean();  // Returns plain JavaScript objects
      
          // Transform _id to id for frontend compatibility
          const transformedRequests = helpRequests.map(request => ({
            ...request,
            id: request._id.toString(),
          }));
      
          return res.status(200).json({
            success: true,
            helpRequests: transformedRequests
          });

    } catch (error) {
        console.error('Error fetching help requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching help requests'
        });
    }
};

/**
 * Update help request status
 * PUT /api/help-requests/:id/status
 */
export const updateHelpRequestStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'contacted', 'resolved', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const helpRequest = await HelpRequest.findById(id);

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: 'Help request not found'
            });
        }

        // Verify the senior is assigned to this request
        if (helpRequest.assigned_senior_id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this request'
            });
        }

        helpRequest.status = status;

        if (status === 'contacted' && !helpRequest.contacted_at) {
            helpRequest.contacted_at = new Date();
        }

        if (status === 'resolved' && !helpRequest.resolved_at) {
            helpRequest.resolved_at = new Date();
        }

        await helpRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Help request updated successfully',
            helpRequest
        });

    } catch (error: any) {
        console.error('Error updating help request:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error updating help request',
            error: error.message // Add this line to see the actual error
        });
    }
};

/**
 * Get student's own help requests
 * GET /api/help-requests/my-requests
 */
export const getMyRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const helpRequests = await HelpRequest.find({ student_id: userId })
            .sort({ created_at: -1 })
            .populate('assigned_senior_id', 'name email');

        return res.status(200).json({
            success: true,
            helpRequests
        });

    } catch (error) {
        console.error('Error fetching help requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching help requests'
        });
    }
};


/**
 * Check if a conversation has an active help request
 * GET /api/help-requests/conversation/:conversationId
 */
export const getHelpRequestByConversation = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { conversationId } = req.params;
  
      const helpRequest = await HelpRequest.findOne({
        conversation_id: conversationId,
        student_id: userId,
        status: { $in: ['pending', 'contacted', 'resolved'] }
      }).lean();
  
      if (!helpRequest) {
        return res.status(200).json({
          success: true,
          hasHelpRequest: false,
          helpRequest: null
        });
      }
  
      return res.status(200).json({
        success: true,
        hasHelpRequest: true,
        helpRequest: {
          ...helpRequest,
          id: helpRequest._id.toString(),
          status: helpRequest.status
        }
      });
  
    } catch (error: any) {
      console.error('Error checking help request:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error checking help request',
        error: error.message
      });
    }
  };