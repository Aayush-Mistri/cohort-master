import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Update user profile (with file upload support)
export const updateUserProfile = async (formData) => {
    try {
        const response = await axios.put(`${API_URL}/user/profile`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const completeOnboarding = async (payload) => {
    try {
        const response = await axios.post(`${API_URL}/user/onboarding`, payload, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error saving onboarding:', error);
        throw error;
    }
};
