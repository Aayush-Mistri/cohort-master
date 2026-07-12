import axios from 'axios';
import { API_URL } from './config';

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all chats for the logged-in user
export const getChats = async () => {
    try {
        const response = await axios.get(`${API_URL}/chat`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
    }
};

// Create a 1-on-1 chat
export const createChat = async (userId) => {
    try {
        const response = await axios.post(
            `${API_URL}/chat`,
            { userId },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
    }
};

// Create a group chat
export const createGroupChat = async (name, users) => {
    try {
        const response = await axios.post(
            `${API_URL}/chat/group`,
            { name, users },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating group chat:', error);
        throw error;
    }
};

// Get messages for a specific chat
export const getMessages = async (chatId) => {
    try {
        const response = await axios.get(`${API_URL}/message/${chatId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

// Send a message
export const sendMessage = async (chatId, payload) => {
    try {
        const body = typeof payload === 'string'
            ? { chatId, content: payload }
            : { chatId, ...(payload || {}) };
        const response = await axios.post(
            `${API_URL}/message`,
            body,
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Schedule a message (one-time or recurring)
export const scheduleMessage = async (payload) => {
    try {
        const response = await axios.post(
            `${API_URL}/message/schedule`,
            payload,
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error scheduling message:', error);
        throw error;
    }
};

export const getScheduledMessages = async (chatId) => {
    try {
        const response = await axios.get(`${API_URL}/message/schedule/${chatId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching scheduled messages:', error);
        throw error;
    }
};

export const cancelScheduledMessage = async (scheduleId) => {
    try {
        const response = await axios.delete(`${API_URL}/message/schedule/${scheduleId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error canceling scheduled message:', error);
        throw error;
    }
};

// Toggle reaction on a message
export const toggleMessageReaction = async (messageId, emoji) => {
    try {
        const response = await axios.post(
            `${API_URL}/message/${messageId}/reactions`,
            { emoji },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error toggling reaction:', error);
        throw error;
    }
};

// Get all users (for creating new chats)
export const getUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/user`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Search discoverable users by query
export const searchUsers = async (q = '') => {
    try {
        const response = await axios.get(`${API_URL}/user`, {
            params: { q, limit: 50, scope: 'discover' },
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

export const getFriends = async () => {
    try {
        const response = await axios.get(`${API_URL}/user/friends`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching friends:', error);
        throw error;
    }
};

export const getFriendRequests = async () => {
    try {
        const response = await axios.get(`${API_URL}/user/friend-requests`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        throw error;
    }
};

export const sendFriendRequest = async (username) => {
    try {
        const response = await axios.post(`${API_URL}/user/friend-request/${encodeURIComponent(username)}`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
};

export const acceptFriendRequest = async (userId) => {
    try {
        const response = await axios.post(`${API_URL}/user/friend-request/${userId}/accept`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
    }
};

export const rejectFriendRequest = async (userId) => {
    try {
        const response = await axios.post(`${API_URL}/user/friend-request/${userId}/reject`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        throw error;
    }
};

// Get current user profile
export const getUserProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/user/profile`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const getPublicUserProfile = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/user/public/${userId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching public user profile:', error);
        throw error;
    }
};
// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
    try {
        const response = await axios.put(`${API_URL}/message/${chatId}/read`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
};

// Upload file
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/message/upload`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const editMessage = async (messageId, content) => {
    try {
        const response = await axios.put(
            `${API_URL}/message/${messageId}`,
            { content },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error editing message:', error);
        throw error;
    }
};

export const deleteMessage = async (messageId) => {
    try {
        const response = await axios.delete(`${API_URL}/message/${messageId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

export const votePoll = async (messageId, optionIndex) => {
    try {
        const response = await axios.post(
            `${API_URL}/message/${messageId}/poll/vote`,
            { optionIndex },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error('Error voting on poll:', error);
        throw error;
    }
};

export const searchMessages = async (chatId, q) => {
    try {
        const response = await axios.get(`${API_URL}/message/search`, {
            params: { chatId, q },
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error searching messages:', error);
        throw error;
    }
};
