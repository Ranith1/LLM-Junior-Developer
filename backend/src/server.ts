import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import conversationRoutes from './routes/conversationRoutes'; 
import helpRequestRoutes from './routes/helpRequestRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/help-requests', helpRequestRoutes);


// 404 Handler
app.use((req, res) => {

  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();