import axios from 'axios';

// The proxy in vite.config.js handles routing /api to http://localhost:4000
const axiosInstance = axios.create({
    baseURL: '/api',
    timeout: 30000,
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(
    (config) => {
        console.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ----------------------------------------------------------------------

// File API
export const uploadFiles = async (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await axiosInstance.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
    });
    return response.data;
};

export const getFiles = async (params = {}) => {
    const response = await axiosInstance.get('/files', { params });
    // Handle both old format (array) and new format (object with data)
    if (Array.isArray(response.data)) {
        return { data: response.data, pagination: { total: response.data.length } };
    }
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

export const getRelatedEvents = async (params) => {
    if (!params) return [];
    const { messageId, jobId, recipient, customHeader, from, to } = params;

    if (!messageId && !jobId && !recipient && !customHeader) return [];

    const query = new URLSearchParams();
    if (jobId) query.append('jobId', jobId);
    if (recipient) query.append('recipient', recipient);
    if (customHeader) query.append('customHeader', customHeader);
    if (from) query.append('from', from);
    if (to) query.append('to', to);

    const idPart = encodeURIComponent(messageId ?? 'null');
    const qs = query.toString();

    const response = await axiosInstance.get(`/events/related/${idPart}${qs ? `?${qs}` : ''}`);
    const data = response.data;

    // Backward compatibility: older backend may return plain array
    if (Array.isArray(data)) return data;
    return data.events || [];
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

export const getIncidents = async () => {
    const response = await axiosInstance.get('/analytics/incidents');
    return response.data;
};

export const getExportUrl = (params) => {
    const queryString = new URLSearchParams(params).toString();
    return `/api/analytics/export?${queryString}`;
};

// ----------------------------------------------------------------------

// Health Check
export const checkHealth = async () => {
    const response = await axiosInstance.get('/health');
    return response.data;
};

export default axiosInstance;

