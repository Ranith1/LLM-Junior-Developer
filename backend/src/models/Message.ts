import mongoose, { Document, Schema } from 'mongoose';

// 1. INTERFACE - TypeScript type definition
export interface IMessage extends Document {
  conversation_id: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'mentor' | 'tool' | 'system';
  sender_id?: mongoose.Types.ObjectId;
  content: string;
  seq: number;
  date_created: Date;
  step?: number;
  validation?: boolean;
  notes?: string;
  ai_model?: string;              // ← CHANGED: was 'model', now 'ai_model'
  tool_run_id?: mongoose.Types.ObjectId;
}

// 2. SCHEMA - MongoDB structure definition
const MessageSchema = new Schema<IMessage>({
  conversation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  role: {
    type: String,
    enum: ['user', 'assistant', 'mentor', 'tool', 'system'],
    required: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  seq: {
    type: Number,
    required: true
  },
  
  date_created: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  sender_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  step: {
    type: Number,
    required: false
  },
  
  validation: {
    type: Boolean,
    required: false
  },
  
  notes: {
    type: String,
    required: false
  },
  
  ai_model: {                     // ← CHANGED: was 'model', now 'ai_model'
    type: String,
    required: false
  },
  
  tool_run_id: {
    type: Schema.Types.ObjectId,
    required: false
  }
}, {
  timestamps: false,
  collection: 'messages'
});

// 3. INDEXES
MessageSchema.index(
  { conversation_id: 1, seq: 1 }, 
  { unique: true }
);

MessageSchema.index(
  { conversation_id: 1, date_created: 1 }
);

// 4. EXPORT the model
export default mongoose.model<IMessage>('Message', MessageSchema);