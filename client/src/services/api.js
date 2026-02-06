import axios from 'axios';

// API Base URL - uses env variable in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============ Auth API ============
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getUser: () => api.get('/auth/user'),
};

// ============ Notes API ============
export const notesAPI = {
    getAll: () => api.get('/notes'),
    getById: (id) => api.get(`/notes/${id}`),
    create: (data) => api.post('/notes', data),
    update: (id, data) => api.put(`/notes/${id}`, data),
    delete: (id) => api.delete(`/notes/${id}`),
    search: (query) => api.get(`/notes/search?q=${encodeURIComponent(query)}`),
    togglePin: (id) => api.put(`/notes/${id}/pin`),
    generateShareLink: (id) => api.post(`/notes/${id}/share`),
    getShared: (token) => api.get(`/notes/shared/${token}`),
    getActivity: (id) => api.get(`/notes/${id}/activity`),
};

// ============ Collaborators API ============
export const collaboratorsAPI = {
    add: (noteId, data) => api.post(`/notes/${noteId}/collaborators`, data),
    remove: (noteId, userId) => api.delete(`/notes/${noteId}/collaborators/${userId}`),
};

export default api;
