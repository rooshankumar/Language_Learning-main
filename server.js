
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const next = require("next");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  
  // Socket.io server setup
  const io = new Server(server, {
    cors: { 
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  // Track connected users
  const connectedUsers = new Map();

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // User login - track online status
    socket.on("user_login", ({ userId, username }) => {
      connectedUsers.set(userId, {
        socketId: socket.id,
        username,
        lastSeen: new Date()
      });
      
      // Update user's online status in database
      mongoose.model('User').findByIdAndUpdate(
        userId,
        { online: true, lastSeen: new Date() },
        { new: true }
      ).catch(err => console.error('Error updating user status:', err));
      
      // Broadcast updated online users list
      io.emit("online_users", Array.from(connectedUsers.keys()));
    });
    
    // Join a chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });
    
    // Send a message
    socket.on("send_message", async (messageData) => {
      try {
        const { chatId, message, senderId } = messageData;
        
        // Save message to MongoDB
        const Chat = mongoose.model('Chat');
        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          { 
            $push: { 
              messages: {
                sender: senderId,
                text: message,
                createdAt: new Date()
              } 
            },
            lastMessage: {
              text: message,
              sender: senderId,
              createdAt: new Date()
            },
            updatedAt: new Date()
          },
          { new: true }
        ).populate({
          path: 'messages.sender',
          select: 'name image profilePic'
        });
        
        // Broadcast message to all users in the chat room
        io.to(chatId).emit("receive_message", {
          chatId,
          message: updatedChat.messages[updatedChat.messages.length - 1]
        });
        
        // Update last message for all clients
        io.emit("update_chat_preview", {
          chatId,
          lastMessage: updatedChat.lastMessage
        });
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    
    // User typing indicator
    socket.on("typing", ({ chatId, username, isTyping }) => {
      socket.to(chatId).emit("user_typing", { username, isTyping });
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
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
        mongoose.model('User').findByIdAndUpdate(
          disconnectedUserId,
          { online: false, lastSeen: new Date() },
          { new: true }
        ).catch(err => console.error('Error updating offline status:', err));
        
        // Broadcast updated online users list
        io.emit("online_users", Array.from(connectedUsers.keys()));
      }
      
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Handle all other routes with Next.js
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
