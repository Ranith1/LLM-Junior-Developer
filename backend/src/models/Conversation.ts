import mongoose, { Document, Schema } from 'mongoose';

// 1. INTERFACE - TypeScript type definition
// This tells TypeScript what fields a Conversation document has
export interface IConversation extends Document {
  user_id: mongoose.Types.ObjectId;  // Reference to the User who owns this
  title: string;                      // "New Chat", "Help with React", etc.
  status: 'active' | 'archived' | 'deleted';  // Conversation state
  started_at: Date;                   // When conversation was created
  last_activity_at: Date;             // When last message was sent
  current_step: number;               // Current step in Socratic method
  message_count: number;              // How many messages in this conversation
}

// 2. SCHEMA - MongoDB structure definition
// This defines how data is stored in MongoDB
const ConversationSchema = new Schema<IConversation>({
  user_id: {
    type: Schema.Types.ObjectId,      // MongoDB ObjectId type
    ref: 'User',                       // This references the User model
    required: true,                    // Must have a user
    index: true                        // Create index for fast queries
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat',               // Default value if not provided
    trim: true                         // Remove whitespace from ends
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],  // Only allow these values
    default: 'active',
    index: true                        // Index for filtering by status
  },
  started_at: {
    type: Date,
    default: Date.now                  // Auto-set to current time
  },
  last_activity_at: {
    type: Date,
    default: Date.now,
    index: true                        // Index for sorting by recent activity
  },
  current_step: {
    type: Number,
    default: 1                         // Start at step 1
  },
  message_count: {
    type: Number,
    default: 0                         // No messages initially
  }
}, {
  timestamps: true,                    // Auto-create createdAt/updatedAt fields
  collection: 'conversations'          // Explicit collection name in MongoDB
});

// 3. COMPOUND INDEXES - These match your db_setup.py indexes
// Compound indexes speed up queries that filter/sort by multiple fields
ConversationSchema.index({ user_id: 1, started_at: -1 });        // Get user's conversations sorted by start time
ConversationSchema.index({ user_id: 1, last_activity_at: -1 });  // Get user's conversations sorted by recent activity
ConversationSchema.index({ status: 1, last_activity_at: -1 });   // Get conversations by status, sorted by activity

// 4. EXPORT - Create and export the model
export default mongoose.model<IConversation>('Conversation', ConversationSchema);