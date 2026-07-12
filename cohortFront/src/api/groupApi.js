import axios from 'axios';
import { API_URL } from './config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all groups
export const getGroups = async () => {
    try {
        const response = await axios.get(`${API_URL}/groups`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
};

// Get group details
export const getGroupDetails = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/groups/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching group details:', error);
        throw error;
    }
};

// Create a group
export const createGroup = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/groups`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

// Join a group
export const joinGroup = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/join`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error joining group:', error);
        throw error;
    }
};

// Leave a group
export const leaveGroup = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/leave`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error leaving group:', error);
        throw error;
    }
};

export const updateGroup = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/groups/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error updating group:', error);
        throw error;
    }
};

export const deleteGroup = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/groups/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting group:', error);
        throw error;
    }
};

export const getGroupInvite = async (id, refresh = false) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/invite`, { refresh }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching group invite:', error);
        throw error;
    }
};

export const joinGroupByInvite = async (code) => {
    try {
        const response = await axios.post(`${API_URL}/groups/invite/${code}/join`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error joining group by invite:', error);
        throw error;
    }
};

export const addGroupMembers = async (id, members) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/members`, { members }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error adding group members:', error);
        throw error;
    }
};

export const removeGroupMember = async (id, memberId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/members/remove`, { memberId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error removing group member:', error);
        throw error;
    }
};

export const promoteGroupAdmin = async (id, memberId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/admins/promote`, { memberId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error promoting group admin:', error);
        throw error;
    }
};

export const demoteGroupAdmin = async (id, memberId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/admins/demote`, { memberId }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error demoting group admin:', error);
        throw error;
    }
};

export const updateGroupSettings = async (id, settings) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/settings`, settings, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error updating group settings:', error);
        throw error;
    }
};

export const approveGroupJoinRequest = async (id, userId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/join-requests/${userId}/approve`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error approving group join request:', error);
        throw error;
    }
};

export const rejectGroupJoinRequest = async (id, userId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/join-requests/${userId}/reject`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error rejecting group join request:', error);
        throw error;
    }
};

export const pinGroupMessage = async (id, messageId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/pins`, { messageId, action: 'pin' }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error pinning message:', error);
        throw error;
    }
};

export const unpinGroupMessage = async (id, messageId) => {
    try {
        const response = await axios.post(`${API_URL}/groups/${id}/pins`, { messageId, action: 'unpin' }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error unpinning message:', error);
        throw error;
    }
};
