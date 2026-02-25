import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server from express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO logic with online status and typing indicators
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User comes online
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    // Broadcast to all clients that this user is online
    io.emit('user-status-change', { userId, status: 'online' });
    console.log(`User ${userId} is online`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Send message
  socket.on('send-message', ({ chatId, message }) => {
    socket.to(chatId).emit('receive-message', message);
  });

  // Typing indicators
  socket.on('typing-start', ({ chatId, userId, userName }) => {
    socket.to(chatId).emit('user-typing', { userId, userName, isTyping: true });
  });

  socket.on('typing-stop', ({ chatId, userId }) => {
    socket.to(chatId).emit('user-typing', { userId, isTyping: false });
  });

  // Message Read Status
  socket.on('mark-messages-read', ({ chatId, userId }) => {
    // Broadcast to others in the chat that messages were read by this user
    socket.to(chatId).emit('messages-read', { chatId, userId });
    console.log(`User ${userId} read messages in chat ${chatId}`);
  });

  // User disconnects
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      // Broadcast to all clients that this user is offline
      io.emit('user-status-change', { userId: socket.userId, status: 'offline' });
      console.log(`User ${socket.userId} is offline`);
    }
    console.log('Socket disconnected:', socket.id);
  });
});

// OPTIONAL: better error visibility
mongoose.set("bufferCommands", false);

// MongoDB connection + server start
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
