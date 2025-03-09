
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MongoDB setup
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please add MongoDB URI to .env file');
}

async function startServer() {
  try {
    await app.prepare();
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Initialize Socket.io
    const io = new Server(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // MongoDB Client
    const client = new MongoClient(MONGODB_URI, {});
    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB');

    // Socket.io events
    io.on('connection', async (socket) => {
      const { userId, username } = socket.handshake.auth;
      if (!userId) {
        return socket.disconnect();
      }

      console.log(`User connected: ${username} (${userId})`);

      try {
        // Update user's status in database
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { online: true, lastSeen: new Date() } }
        );
      } catch (error) {
        console.error('Error updating user status:', error);
      }

      // Join user's rooms
      socket.join(userId); // Personal room

      // Send online users to all clients
      const onlineUsers = await db.collection('users')
        .find({ online: true })
        .project({ _id: 1 })
        .toArray();
      
      io.emit('users_online', onlineUsers.map(user => user._id.toString()));

      // Handle joining a chat
      socket.on('join_chat', ({ chatId }) => {
        if (chatId) {
          socket.join(chatId);
          console.log(`User ${userId} joined chat ${chatId}`);
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, senderId } = data;
          
          if (!chatId || !content || !senderId) {
            return;
          }

          // Get sender info
          const sender = await db.collection('users').findOne(
            { _id: new ObjectId(senderId) },
            { projection: { name: 1, image: 1, profilePic: 1 } }
          );

          if (!sender) {
            return;
          }

          // Create new message
          const newMessage = {
            chatId,
            content,
            sender: {
              _id: senderId,
              name: sender.name,
              image: sender.image || sender.profilePic || null
            },
            createdAt: new Date(),
            _id: new ObjectId()
          };

          // Save to database
          await db.collection('messages').insertOne(newMessage);

          // Update last message in chat
          await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            { 
              $set: { 
                lastMessage: newMessage,
                updatedAt: new Date()
              } 
            }
          );

          // Send to all clients in the room
          io.to(chatId).emit('receive_message', {
            chatId,
            message: newMessage
          });

          // Update chat preview for all participants
          const chat = await db.collection('chats').findOne(
            { _id: new ObjectId(chatId) },
            { projection: { participants: 1 } }
          );

          if (chat?.participants) {
            chat.participants.forEach(participantId => {
              io.to(participantId.toString()).emit('update_chat_preview', {
                chatId,
                lastMessage: newMessage
              });
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing', async (data) => {
        const { chatId, username, isTyping } = data;
        socket.to(chatId).emit('user_typing', {
          chatId,
          username,
          isTyping
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${userId}`);
        try {
          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { online: false, lastSeen: new Date() } }
          );
          
          // Update online users list
          const onlineUsers = await db.collection('users')
            .find({ online: true })
            .project({ _id: 1 })
            .toArray();
          
          io.emit('users_online', onlineUsers.map(user => user._id.toString()));
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      });
    });

    server.listen(port, hostname, () => {
      console.log(`Ready on http://${hostname}:${port}`);
    });

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer();
