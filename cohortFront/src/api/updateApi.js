import axios from 'axios';
import { API_URL } from './config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all active updates
export const getUpdates = async () => {
    try {
        const response = await axios.get(`${API_URL}/updates`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching updates:', error);
        throw error;
    }
};

// Create an update (story)
export const createUpdate = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/updates`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating update:', error);
        throw error;
    }
};
