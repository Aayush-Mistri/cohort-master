const DEFAULT_API_BASE_URL = 'https://cohort-1-5gxo.onrender.com';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export { DEFAULT_API_BASE_URL };
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
