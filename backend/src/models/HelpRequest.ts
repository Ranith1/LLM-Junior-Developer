import mongoose, { Document, Schema } from 'mongoose';

export interface IHelpRequest extends Document {
  student_id: mongoose.Types.ObjectId;
  student_name: string;
  student_email: string;
  conversation_id: mongoose.Types.ObjectId;
  problem_description: string;
  conversation_summary: string;
  assigned_senior_id: mongoose.Types.ObjectId;
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled';
  created_at: Date;
  contacted_at?: Date;
  resolved_at?: Date;
}

const HelpRequestSchema = new Schema<IHelpRequest>({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  student_name: {
    type: String,
    required: true
  },
  student_email: {
    type: String,
    required: true
  },
  conversation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  problem_description: {
    type: String,
    required: true
  },
  conversation_summary: {
    type: String,
    required: true
  },
  assigned_senior_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'resolved', 'cancelled'],
    default: 'pending',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  contacted_at: {
    type: Date,
    required: false
  },
  resolved_at: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'help_requests'
});

// Compound indexes for efficient queries
HelpRequestSchema.index({ assigned_senior_id: 1, status: 1, created_at: -1 });
HelpRequestSchema.index({ student_id: 1, created_at: -1 });
HelpRequestSchema.index({ status: 1, created_at: -1 });

export default mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);