const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // Set up Socket.IO with CORS
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Apply middleware
  server.use(cors());
  server.use(express.json({ limit: '2mb' }));

  // Connect to MongoDB before starting the server
  async function connectToMongoDB() {
    try {
      // Connect to MongoDB if MONGODB_URI is defined
      if (process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
      } else {
        console.warn('⚠️ MONGODB_URI not defined, skipping MongoDB connection');
      }
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1); // Exit if MongoDB connection fails
    }
  }
  connectToMongoDB();


  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.id} left chat: ${chatId}`);
    });

    socket.on('send-message', (data) => {
      io.to(data.chatId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Let Next.js handle all other routes
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start server
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});