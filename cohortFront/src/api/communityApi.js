import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all communities
export const getCommunities = async () => {
    try {
        const response = await axios.get(`${API_URL}/communities`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching communities:', error);
        throw error;
    }
};

// Create a community
export const createCommunity = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/communities`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating community:', error);
        throw error;
    }
};

// Join a community
export const joinCommunity = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/join`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error joining community:', error);
        throw error;
    }
};

// Leave a community
export const leaveCommunity = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/leave`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error leaving community:', error);
        throw error;
    }
};
