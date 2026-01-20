import axios from 'axios';

// The proxy in vite.config.js handles routing /api to http://localhost:4000
const axiosInstance = axios.create({
    baseURL: '/api',
});

// ----------------------------------------------------------------------

// File API
export const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await axiosInstance.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getFiles = async () => {
    const response = await axiosInstance.get('/files');
    return response.data;
};

export const getFileById = async (id) => {
    const response = await axiosInstance.get(`/files/${id}`);
    return response.data;
};

export const deleteFile = async (id) => {
    const response = await axiosInstance.delete(`/files/${id}`);
    return response.data;
};

// ----------------------------------------------------------------------

// Events API
export const queryEvents = async (params) => {
    const response = await axiosInstance.get('/events', { params });
    return response.data;
};

// ----------------------------------------------------------------------

// Analytics API
export const getStats = async (params) => {
    const response = await axiosInstance.get('/analytics/stats', { params });
    return response.data;
};

export const getLatencyTrend = async (params) => {
    const response = await axiosInstance.get('/analytics/latency', { params });
    return response.data;
};

export const getVolumeTrend = async (params) => {
    const response = await axiosInstance.get('/analytics/volume', { params });
    return response.data;
};

export const getDomainStats = async (params) => {
    const response = await axiosInstance.get('/analytics/domains', { params });
    return response.data;
};

export const getSenderStats = async (params) => {
    const response = await axiosInstance.get('/analytics/senders', { params });
    return response.data;
};

export const getInsights = async () => {
    const response = await axiosInstance.get('/analytics/insights');
    return response.data;
};

export const getExportUrl = (params) => {
    const queryString = new URLSearchParams(params).toString();
    return `/api/analytics/export?${queryString}`;
};

export default axiosInstance;
