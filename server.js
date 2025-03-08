const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const hostname = '0.0.0.0'; // Enable external access

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    // Connect to MongoDB if MONGODB_URI is defined
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️ MONGODB_URI not defined, skipping MongoDB connection');
    }

    await app.prepare();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(PORT, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${PORT}`);
    });

    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle user joining
      socket.on('join', (userData) => {
        if (userData && userData.userId) {
          onlineUsers.set(userData.userId, {
            socketId: socket.id,
            username: userData.username || 'Unknown User',
          });

          io.emit('userList', Array.from(onlineUsers.entries()).map(([userId, data]) => ({
            id: userId,
            name: data.username
          })));

          console.log('User joined:', userData.userId);
        }
      });

      // Handle joining a specific room or chat
      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from online users
        for (const [userId, data] of onlineUsers.entries()) {
          if (data.socketId === socket.id) {
            onlineUsers.delete(userId);
            break;
          }
        }

        // Broadcast updated user list
        io.emit('userList', Array.from(onlineUsers.entries()).map(([userId, data]) => ({
          id: userId,
          name: data.username
        })));
      });
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

startServer();