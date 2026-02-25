import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Send message to AI
export const sendAiMessage = async (message, options = {}) => {
    try {
        const response = await axios.post(`${API_URL}/ai/chat`, { message, ...options }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error talking to AI:', error);
        throw error;
    }
};
