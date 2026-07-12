import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

// Initialize socket connection
const socket = io(SOCKET_URL, {
    autoConnect: false, // Don't connect automatically, we'll connect when user logs in
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000
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

export const offConnect = (callback) => {
    socket.off('connect', callback);
};

export const onDisconnect = (callback) => {
    socket.on('disconnect', callback);
};

export const offDisconnect = (callback) => {
    socket.off('disconnect', callback);
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

export const onAppRefresh = (callback) => {
    if (socket) {
        socket.on('app-refresh', callback);
    }
};

export const offAppRefresh = (callback) => {
    if (socket) {
        socket.off('app-refresh', callback);
    }
};

export const emitCallRing = ({ chatId, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:ring', { chatId, fromUserId, fromUserName });
    }
};

export const emitCallAccept = ({ chatId, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:accept', { chatId, fromUserId, fromUserName });
    }
};

export const emitCallDecline = ({ chatId, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:decline', { chatId, fromUserId, fromUserName });
    }
};

export const emitCallBusy = ({ chatId, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:busy', { chatId, fromUserId, fromUserName });
    }
};

export const emitCallOffer = ({ chatId, offer, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:offer', { chatId, offer, fromUserId, fromUserName });
    }
};

export const emitCallAnswer = ({ chatId, answer, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:answer', { chatId, answer, fromUserId, fromUserName });
    }
};

export const emitCallIceCandidate = ({ chatId, candidate, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:ice-candidate', { chatId, candidate, fromUserId, fromUserName });
    }
};

export const emitCallEnd = ({ chatId, fromUserId, fromUserName }) => {
    if (socket) {
        socket.emit('call:end', { chatId, fromUserId, fromUserName });
    }
};

export const onIncomingCall = (callback) => {
    if (socket) {
        socket.on('call:incoming', callback);
    }
};

export const offIncomingCall = (callback) => {
    if (socket) {
        socket.off('call:incoming', callback);
    }
};

export const onCallAccepted = (callback) => {
    if (socket) {
        socket.on('call:accepted', callback);
    }
};

export const offCallAccepted = (callback) => {
    if (socket) {
        socket.off('call:accepted', callback);
    }
};

export const onCallDeclined = (callback) => {
    if (socket) {
        socket.on('call:declined', callback);
    }
};

export const offCallDeclined = (callback) => {
    if (socket) {
        socket.off('call:declined', callback);
    }
};

export const onCallBusy = (callback) => {
    if (socket) {
        socket.on('call:busy', callback);
    }
};

export const offCallBusy = (callback) => {
    if (socket) {
        socket.off('call:busy', callback);
    }
};

export const onCallOffer = (callback) => {
    if (socket) {
        socket.on('call:offer', callback);
    }
};

export const offCallOffer = (callback) => {
    if (socket) {
        socket.off('call:offer', callback);
    }
};

export const onCallAnswer = (callback) => {
    if (socket) {
        socket.on('call:answer', callback);
    }
};

export const offCallAnswer = (callback) => {
    if (socket) {
        socket.off('call:answer', callback);
    }
};

export const onCallIceCandidate = (callback) => {
    if (socket) {
        socket.on('call:ice-candidate', callback);
    }
};

export const offCallIceCandidate = (callback) => {
    if (socket) {
        socket.off('call:ice-candidate', callback);
    }
};

export const onCallEnded = (callback) => {
    if (socket) {
        socket.on('call:ended', callback);
    }
};

export const offCallEnded = (callback) => {
    if (socket) {
        socket.off('call:ended', callback);
    }
};

export default socket;
