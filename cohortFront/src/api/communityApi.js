import axios from 'axios';
import { API_URL } from './config';

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

// Get community details
export const getCommunityDetails = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/communities/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching community details:', error);
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

export const updateCommunity = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/communities/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error updating community:', error);
        throw error;
    }
};

export const deleteCommunity = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/communities/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting community:', error);
        throw error;
    }
};

export const getCommunityInvite = async (id, refresh = false) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/invite`, { refresh }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching community invite:', error);
        throw error;
    }
};

export const joinCommunityByInvite = async (code) => {
    try {
        const response = await axios.post(`${API_URL}/communities/invite/${code}/join`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error joining community by invite:', error);
        throw error;
    }
};

export const addGroupToCommunity = async (id, groupId) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/groups`, { groupId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error adding group to community:', error);
        throw error;
    }
};

export const createGroupInCommunity = async (id, data) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/groups/create`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating community group:', error);
        throw error;
    }
};

export const promoteCommunityAdmin = async (id, memberId) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/admins/promote`, { memberId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error promoting community admin:', error);
        throw error;
    }
};

export const demoteCommunityAdmin = async (id, memberId) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/admins/demote`, { memberId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error demoting community admin:', error);
        throw error;
    }
};

export const updateCommunitySettings = async (id, settings) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/settings`, settings, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error updating community settings:', error);
        throw error;
    }
};

export const approveCommunityJoinRequest = async (id, userId) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/join-requests/${userId}/approve`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error approving community join request:', error);
        throw error;
    }
};

export const rejectCommunityJoinRequest = async (id, userId) => {
    try {
        const response = await axios.post(`${API_URL}/communities/${id}/join-requests/${userId}/reject`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error rejecting community join request:', error);
        throw error;
    }
};
