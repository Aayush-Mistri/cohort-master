import axios from 'axios';
import { API_URL } from './config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all events
export const getEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/events`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Create an event
export const createEvent = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/events`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error.response?.data || error);
        throw error;
    }
};

// RSVP to an event
export const rsvpEvent = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/events/${id}/rsvp`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error RSVPing to event:', error);
        throw error;
    }
};
