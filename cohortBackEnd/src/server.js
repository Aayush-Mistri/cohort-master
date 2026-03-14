import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Message from './models/message-model.js';
import Chat from './models/chat-model.js';
import ScheduledMessage from './models/scheduled-message-model.js';

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

app.set('io', io);
app.set('onlineUsers', onlineUsers);

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

  // Message reaction updates
  socket.on('message-reaction', ({ chatId, messageId, reactions }) => {
    socket.to(chatId).emit('message-reaction', { messageId, reactions });
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

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addWeeks = (date, weeks) => addDays(date, weeks * 7);

const addMonths = (date, months) => {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) {
    next.setDate(0);
  }
  return next;
};

const getNextScheduledFor = (schedule) => {
  switch (schedule.scheduleType) {
    case 'daily':
      return addDays(schedule.scheduledFor, 1);
    case 'weekly':
      return addWeeks(schedule.scheduledFor, 1);
    case 'monthly':
      return addMonths(schedule.scheduledFor, 1);
    case 'custom': {
      const interval = Number(schedule.customInterval || 1);
      if (!Number.isFinite(interval) || interval < 1) return null;
      if (schedule.customUnit === 'weeks') return addWeeks(schedule.scheduledFor, interval);
      if (schedule.customUnit === 'months') return addMonths(schedule.scheduledFor, interval);
      return addDays(schedule.scheduledFor, interval);
    }
    default:
      return null;
  }
};

let isSchedulerRunning = false;
const runScheduledMessages = async () => {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;
  try {
    const now = new Date();
    const dueSchedules = await ScheduledMessage.find({
      active: true,
      scheduledFor: { $lte: now }
    }).limit(100);

    for (const schedule of dueSchedules) {
      const message = await Message.create({
        sender: schedule.sender,
        chat: schedule.chat,
        content: schedule.content,
        delivered: true,
        status: 'delivered',
        readBy: [schedule.sender]
      });

      await Chat.findByIdAndUpdate(schedule.chat, { lastMessage: message._id });

      const populated = await message.populate('sender', 'name username profilePic');
      io.to(schedule.chat.toString()).emit('receive-message', populated);

      if (schedule.scheduleType === 'once') {
        schedule.active = false;
      } else {
        const nextRun = getNextScheduledFor(schedule);
        if (!nextRun || (schedule.endsAt && nextRun > schedule.endsAt)) {
          schedule.active = false;
        } else {
          schedule.scheduledFor = nextRun;
        }
      }

      await schedule.save();
    }
  } catch (error) {
    console.error('Scheduled message runner failed:', error.message);
  } finally {
    isSchedulerRunning = false;
  }
};

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

    runScheduledMessages();
    setInterval(runScheduledMessages, 60 * 1000);

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
