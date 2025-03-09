const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./lib/mongodb');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();
  const httpServer = createServer(server);

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Store active users
  const activeUsers = new Map();
  const userSockets = new Map();

  io.on('connection', async (socket) => {
    const { userId, username } = socket.handshake.auth;

    console.log(`User connected: ${username} (${userId}), socket ID: ${socket.id}`);

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store user connection
    activeUsers.set(userId, username);
    userSockets.set(userId, socket.id);

    // Send list of online users to everyone
    io.emit('users_online', Array.from(activeUsers.keys()));

    // Handle chat room join
    socket.on('join_chat', async ({ chatId }) => {
      if (!chatId) return;

      socket.join(chatId);
      console.log(`User ${username} joined chat: ${chatId}`);
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, senderId } = data;

        if (!chatId || !content || !senderId) {
          return;
        }

        console.log(`Message from ${username} in chat ${chatId}: ${content}`);

        const { db } = await connectToDatabase();

        // Save message to database
        const message = {
          chatId: new ObjectId(chatId),
          content,
          sender: new ObjectId(senderId),
          createdAt: new Date()
        };

        const result = await db.collection('messages').insertOne(message);

        if (!result.acknowledged) {
          console.error('Failed to save message to database');
          return;
        }

        // Fetch sender details to include in response
        const sender = await db.collection('users').findOne(
          { _id: new ObjectId(senderId) },
          { projection: { name: 1, image: 1, profilePic: 1 } }
        );

        // Format message for clients
        const formattedMessage = {
          _id: result.insertedId.toString(),
          chatId,
          content,
          sender: {
            _id: senderId,
            name: sender?.name || 'Unknown User',
            image: sender?.image,
            profilePic: sender?.profilePic
          },
          createdAt: message.createdAt
        };

        // Emit message to all users in the chat room
        io.to(chatId).emit('receive_message', {
          chatId,
          message: formattedMessage
        });

        // Update the chat's last message
        await db.collection('chats').updateOne(
          { _id: new ObjectId(chatId) },
          { 
            $set: { 
              lastMessage: formattedMessage,
              updatedAt: new Date()
            } 
          }
        );

        // Notify all participants about the chat update
        const chat = await db.collection('chats').findOne(
          { _id: new ObjectId(chatId) },
          { projection: { participants: 1 } }
        );

        if (chat && chat.participants) {
          chat.participants.forEach(participantId => {
            const socketId = userSockets.get(participantId.toString());
            if (socketId) {
              io.to(socketId).emit('update_chat_preview', {
                chatId,
                lastMessage: formattedMessage
              });
            }
          });
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, username, isTyping }) => {
      socket.to(chatId).emit('user_typing', {
        chatId,
        username,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${username} (${userId})`);
      activeUsers.delete(userId);
      userSockets.delete(userId);
      io.emit('users_online', Array.from(activeUsers.keys()));
    });
  });

  // Handle Next.js requests
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`> Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});