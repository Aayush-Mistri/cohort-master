import axios from 'axios';
import { API_URL } from './config';

// Check username availability
export const checkUsername = async (username) => {
    try {
        const response = await axios.get(`${API_URL}/user/check-username/${username}`);
        return response.data;
    } catch (error) {
        console.error('Error checking username:', error);
        throw error;
    }
};
