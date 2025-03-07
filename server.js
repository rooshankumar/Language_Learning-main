
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
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

    // Handle leaving a room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle messages
    socket.on('message', (data) => {
      console.log('Message received:', data);
      
      if (data.room) {
        // Broadcast to everyone in the room including sender
        io.to(data.room).emit('message', {
          id: data.id || Date.now().toString(),
          message: data.message,
          sender: data.sender,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle starting a chat
    socket.on('startChat', async (data) => {
      if (!data.userId || !data.recipientId) {
        return;
      }
      
      try {
        // Generate a room ID for the chat (could be stored in DB in a real app)
        const chatId = `chat_${[data.userId, data.recipientId].sort().join('_')}`;
        
        // Join both users to the room
        socket.join(chatId);
        
        // If recipient is online, add them to the room too
        const recipientSocketData = onlineUsers.get(data.recipientId);
        if (recipientSocketData) {
          const recipientSocket = io.sockets.sockets.get(recipientSocketData.socketId);
          if (recipientSocket) {
            recipientSocket.join(chatId);
          }
        }
        
        // Notify the client that the chat has been started
        socket.emit('chatStarted', chatId);
        
        console.log(`Chat started between ${data.userId} and ${data.recipientId}: ${chatId}`);
      } catch (error) {
        console.error('Error starting chat:', error);
        socket.emit('error', { message: 'Failed to start chat' });
      }
    });

    // Handle marking messages as read
    socket.on('markMessagesAsRead', (data) => {
      // In a real app, you'd update the messages in the database
      console.log('Marking messages as read:', data);
    });

    // Handle subscribing to chat messages
    socket.on('subscribeToChatMessages', (chatId) => {
      socket.join(chatId);
      
      // In a real app, you'd fetch messages from the database and emit them
      console.log(`Socket ${socket.id} subscribed to chat ${chatId}`);
      
      // Example message data
      const exampleMessages = [];
      socket.emit(`chatMessages:${chatId}`, exampleMessages);
    });

    // Handle unsubscribing from chat messages
    socket.on('unsubscribeFromChatMessages', (chatId) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} unsubscribed from chat ${chatId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and remove the disconnected user
      for (const [userId, data] of onlineUsers.entries()) {
        if (data.socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      
      // Update the user list for all clients
      io.emit('userList', Array.from(onlineUsers.entries()).map(([userId, data]) => ({
        id: userId,
        name: data.username
      })));
      
      console.log('Client disconnected:', socket.id);
    });
  });
});
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

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
    
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(PORT, '0.0.0.0', (err) => {
      if (err) throw err;
      console.log(`> Ready on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

startServer();
