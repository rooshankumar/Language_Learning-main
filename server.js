import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store active users (userId -> socketId mapping)
// Make it global so it can be accessed from API routes
global.activeUsers = new Map();
const activeUsers = global.activeUsers;

// Store active socket connections (socketId -> socket object)
global.activeSockets = new Map();
const activeSockets = global.activeSockets;

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);

  // Create Socket.IO server
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // Extract user info from auth data sent with the connection
    const { userId, username } = socket.handshake.auth;

    if (userId) {
      console.log(`User ${username || userId} connected with socket ID: ${socket.id}`);

      // Store user's socket mapping
      activeUsers.set(userId, socket.id);
      activeSockets.set(socket.id, socket);

      // Notify others about online users
      const onlineUsers = Array.from(activeUsers.keys());
      io.emit('users_online', onlineUsers);

      // Handle joining a specific chat room
      socket.on('join_chat', ({ chatId }) => {
        if (chatId) {
          socket.join(chatId);
          console.log(`User ${userId} joined chat room: ${chatId}`);
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, senderId } = data;

          if (!chatId || !content || !senderId) {
            console.error('Invalid message data:', data);
            return;
          }

          console.log(`Message from ${senderId} in chat ${chatId}: ${content.substring(0, 30)}...`);

          // Create a formatted message object
          const message = {
            _id: new Date().getTime().toString(), // Temporary ID, would be replaced by DB
            chatId,
            content,
            sender: {
              _id: senderId,
              name: username || 'User'
            },
            createdAt: new Date()
          };

          // Broadcast message to everyone in the chat room
          io.to(chatId).emit('receive_message', { 
            chatId, 
            message 
          });

          // Also update chat preview for all participants
          io.emit('update_chat_preview', {
            chatId,
            lastMessage: message
          });

        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', ({ chatId, username, isTyping }) => {
        if (chatId) {
          socket.to(chatId).emit('user_typing', {
            chatId,
            username,
            isTyping
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);

        // Remove user from active lists
        activeUsers.delete(userId);
        activeSockets.delete(socket.id);

        // Update online users list for remaining clients
        const onlineUsers = Array.from(activeUsers.keys());
        io.emit('users_online', onlineUsers);
      });
    } else {
      console.warn('Socket connection without user ID:', socket.id);
      socket.disconnect(true);
    }
  });

  // Handle Next.js requests
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${PORT}`);
    console.log(`> WebSocket server ready on path: /api/socket`);
  });
});