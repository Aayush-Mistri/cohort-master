import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// Initialize socket connection
const socket = io(SOCKET_URL, {
    autoConnect: false, // Don't connect automatically, we'll connect when user logs in
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Connect socket (call this after user logs in)
export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

// Disconnect socket (call this when user logs out)
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

// Join a chat room
export const joinChat = (chatId) => {
    socket.emit('join-chat', chatId);
};

// Send a message via socket
export const sendMessageSocket = (chatId, message) => {
    socket.emit('send-message', { chatId, message });
};

// Listen for incoming messages
export const onReceiveMessage = (callback) => {
    socket.on('receive-message', callback);
};

// Remove message listener
export const offReceiveMessage = () => {
    socket.off('receive-message');
};

// Socket connection status listeners
export const onConnect = (callback) => {
    socket.on('connect', callback);
};

export const onDisconnect = (callback) => {
    socket.on('disconnect', callback);
};

// Emit user online status
export const emitUserOnline = (userId) => {
    if (socket) {
        socket.emit('user-online', userId);
    }
};

// Listen for user status changes
export const onUserStatusChange = (callback) => {
    if (socket) {
        socket.on('user-status-change', callback);
    }
};

export const offUserStatusChange = () => {
    if (socket) {
        socket.off('user-status-change');
    }
};

// Typing indicators
export const emitTypingStart = (chatId, userId, userName) => {
    if (socket) {
        socket.emit('typing-start', { chatId, userId, userName });
    }
};

export const emitTypingStop = (chatId, userId) => {
    if (socket) {
        socket.emit('typing-stop', { chatId, userId });
    }
};

export const onUserTyping = (callback) => {
    if (socket) {
        socket.on('user-typing', callback);
    }
};

export const offUserTyping = () => {
    if (socket) {
        socket.off('user-typing');
    }
};

export const emitMessagesRead = (chatId, userId) => {
    if (socket) {
        socket.emit('mark-messages-read', { chatId, userId });
    }
};

export const onMessagesRead = (callback) => {
    if (socket) {
        socket.on('messages-read', callback);
    }
};

export const offMessagesRead = () => {
    if (socket) {
        socket.off('messages-read');
    }
};

export const emitMessageReaction = (chatId, messageId, reactions) => {
    if (socket) {
        socket.emit('message-reaction', { chatId, messageId, reactions });
    }
};

export const onMessageReaction = (callback) => {
    if (socket) {
        socket.on('message-reaction', callback);
    }
};

export const offMessageReaction = () => {
    if (socket) {
        socket.off('message-reaction');
    }
};

export const onNotification = (callback) => {
    if (socket) {
        socket.on('notification', callback);
    }
};

export const offNotification = () => {
    if (socket) {
        socket.off('notification');
    }
};

export default socket;
