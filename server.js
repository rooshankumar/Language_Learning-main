
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Firebase Admin (if credentials available)
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn("Firebase Admin SDK not initialized: missing service account");
}

const db = serviceAccount ? admin.firestore() : null;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Authenticate user
  socket.on('authenticate', async (userData) => {
    const { uid, displayName } = userData;
    if (!uid) {
      socket.emit('auth_error', { message: 'Authentication required' });
      return;
    }
    
    // Store user data in socket
    socket.uid = uid;
    socket.displayName = displayName;
    console.log(`User authenticated: ${displayName} (${uid})`);
    
    // Join user to their personal room
    socket.join(uid);
    socket.emit('authenticated', { success: true });
  });
  
  // Handle new message
  socket.on('send_message', async (messageData) => {
    if (!socket.uid) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }
    
    const { recipientId, content, timestamp, chatId } = messageData;
    
    if (!recipientId || !content) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }
    
    // Create message object
    const message = {
      senderId: socket.uid,
      senderName: socket.displayName,
      recipientId,
      content,
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };
    
    try {
      // Save message to Firestore (if available)
      if (db) {
        // Use consistent chatId structure: smaller-uid_larger-uid
        const computedChatId = chatId || createChatId(socket.uid, recipientId);
        await db.collection('chats').doc(computedChatId).collection('messages').add(message);
        
        // Update chat metadata
        await db.collection('chats').doc(computedChatId).set({
          participants: [socket.uid, recipientId],
          lastMessage: content,
          lastMessageTimestamp: message.timestamp,
          lastMessageSenderId: socket.uid
        }, { merge: true });
        
        // For recipient, increment unread count
        await db.collection('users').doc(recipientId).collection('chatMetadata').doc(computedChatId).set({
          withUser: socket.uid,
          withUserName: socket.displayName,
          unreadCount: admin.firestore.FieldValue.increment(1),
          lastMessageTimestamp: message.timestamp
        }, { merge: true });
        
        // For sender, ensure record exists with 0 unread
        await db.collection('users').doc(socket.uid).collection('chatMetadata').doc(computedChatId).set({
          withUser: recipientId,
          unreadCount: 0,
          lastMessageTimestamp: message.timestamp
        }, { merge: true });
        
        message.chatId = computedChatId;
      }
      
      // Emit message to recipient via their personal room
      io.to(recipientId).emit('new_message', message);
      
      // Also emit back to sender for confirmation
      socket.emit('message_sent', message);
      
    } catch (error) {
      console.error('Error saving/sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle reading messages
  socket.on('mark_as_read', async (data) => {
    if (!socket.uid) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }
    
    const { chatId } = data;
    
    try {
      if (db) {
        // Reset unread counter
        await db.collection('users').doc(socket.uid).collection('chatMetadata').doc(chatId).update({
          unreadCount: 0
        });
        
        // Mark all messages as read
        const messagesRef = db.collection('chats').doc(chatId).collection('messages');
        const unreadMessages = await messagesRef
          .where('recipientId', '==', socket.uid)
          .where('read', '==', false)
          .get();
        
        const batch = db.batch();
        unreadMessages.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
      }
      
      socket.emit('messages_marked_read', { chatId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    if (socket.uid && recipientId) {
      io.to(recipientId).emit('user_typing', {
        userId: socket.uid,
        isTyping
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper to create consistent chat IDs
function createChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Chat server is running');
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
