const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://your-production-domain.com"] 
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ userId, username }) => {
    connectedUsers.set(socket.id, { userId, username });
    io.emit('userList', Array.from(connectedUsers.values()));
  });

  socket.on('message', (data) => {
    const { room, message, sender } = data;
    io.to(room).emit('message', { message, sender, timestamp: Date.now() });
  });

  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.emit('joinedRoom', room);
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userList', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chat server running on port ${PORT}`);
});