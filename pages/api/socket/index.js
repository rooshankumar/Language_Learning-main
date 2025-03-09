import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Use this function to get MongoDB connection
async function connectToDatabase() {
  return await clientPromise;
}

export default async function handler(req, res) {
  if (res.socket.server.io) {
    // Socket.io server is already running
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });
  res.socket.server.io = io;

  // Store connected users
  const connectedUsers = new Map(); // userId -> { socketId, username }

  // Set up socket.io connection handler
  io.on('connection', async (socket) => {
    // Get user data from auth
    const userId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username;

    if (!userId) {
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${username} (${userId})`);

    // Store user connection info
    connectedUsers.set(userId, {
      socketId: socket.id,
      username
    });

    try {
      // Update user's status in database
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { online: true, lastSeen: new Date() } }
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }

    // Broadcast online users
    const onlineUsers = Array.from(connectedUsers.keys());
    io.emit('users_online', onlineUsers);

    // Handle joining chat rooms
    socket.on('join_chat', ({ chatId }) => {
      socket.join(chatId);
      console.log(`User ${userId} joined chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', async ({ chatId, content, senderId }) => {
      try {
        const { db } = await connectToDatabase();

        // Create new message
        const messageData = {
          chatId: new ObjectId(chatId),
          content,
          senderId,
          createdAt: new Date()
        };

        const result = await db.collection('messages').insertOne(messageData);

        // Add message ID to the message
        const message = {
          ...messageData,
          _id: result.insertedId.toString()
        };

        // Get sender information
        const sender = await db.collection('users').findOne(
          { _id: new ObjectId(senderId) },
          { projection: { name: 1, image: 1, profilePic: 1 } }
        );

        // Update last message in chat
        await db.collection('chats').updateOne(
          { _id: new ObjectId(chatId) },
          { 
            $set: { 
              lastMessage: content,
              updatedAt: new Date()
            } 
          }
        );

        // Broadcast message to all users in the chat room
        io.to(chatId).emit('receive_message', {
          chatId,
          message: {
            ...message,
            sender: {
              _id: senderId,
              ...sender
            }
          }
        });

        // Update last message for all clients
        io.emit('update_chat_preview', {
          chatId,
          lastMessage: content
        });
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // User typing indicator
    socket.on('typing', ({ chatId, username, isTyping }) => {
      socket.to(chatId).emit('user_typing', { username, isTyping });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      // Find the disconnected user
      let disconnectedUserId = null;

      for (const [userId, userData] of connectedUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        // Remove from connected users map
        connectedUsers.delete(disconnectedUserId);

        // Update user's status in database
        try {
          const { db } = await connectToDatabase();
          await db.collection('users').updateOne(
            { _id: new ObjectId(disconnectedUserId) },
            { $set: { online: false, lastSeen: new Date() } }
          );
        } catch (error) {
          console.error('Error updating user status:', error);
        }

        // Broadcast updated online users
        const onlineUsers = Array.from(connectedUsers.keys());
        io.emit('users_online', onlineUsers);

        console.log(`User disconnected: ${disconnectedUserId}`);
      }
    });
  });

  res.end();
}