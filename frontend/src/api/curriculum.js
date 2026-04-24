import api from './axios';

export const fetchLearningAreas = async () => {
    const response = await api.get('learning-areas/');
    return response.data;
};

export const fetchTracks = async () => {
    const response = await api.get('tracks/');
    return response.data;
};

export const fetchModules = async () => {
    const response = await api.get('modules/');
    return response.data;
};

export const createModule = async (moduleData) => {
    const response = await api.post('modules/', moduleData);
    return response.data;
};

export const uploadContent = async (contentData) => {
    // If it contains a file, use FormData
    let data = contentData;
    let headers = {};
    if (contentData.file) {
        data = new FormData();
        Object.keys(contentData).forEach(key => {
            data.append(key, contentData[key]);
        });
        headers['Content-Type'] = 'multipart/form-data';
    }
    
    const response = await api.post('contents/', data, { headers });
    return response.data;
};

// Phase 2 Endpoints
export const updateProfile = async (profileData) => {
    const response = await api.patch('profile/', profileData);
    return response.data;
};

export const fetchClasses = async () => {
    const response = await api.get('classes/');
    return response.data;
};

export const fetchTimetables = async () => {
    const response = await api.get('timetables/');
    return response.data;
};

export const createTimetable = async (data) => {
    const response = await api.post('timetables/', data);
    return response.data;
};

export const createAssessment = async (data) => {
    const response = await api.post('assessments/', data);
    return response.data;
};
