const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lost & Found Backend is running'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Attempt DB connection if valid URI provided
  if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string') {
    await connectDB();
  } else {
    console.log('MongoDB URI not set or using placeholder. Skipping MongoDB connection on startup.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
