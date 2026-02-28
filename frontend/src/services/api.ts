export const API_BASE_URL = 'http://localhost:8000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    // We don't throw on error right away because we might want the JSON error body
    return response;
}

export const api = {
    // Auth & Users
    checkClassroomStatus: async (userId: string) => {
        const res = await fetchWithAuth(`/google-classroom/status/${userId}`);
        if (!res.ok) throw new Error('Status check failed');
        return res.json();
    },
    getAuthUrl: async (userId: string) => {
        const res = await fetchWithAuth(`/auth/google-classroom/${userId}`);
        if (!res.ok) throw new Error('Failed to get auth URL');
        return res.json();
    },

    // Classroom Data
    getCourses: async (userId: string) => {
        const res = await fetchWithAuth(`/google-classroom/courses/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch courses');
        return res.json();
    },
    getAssignments: async (userId: string, courseId: string) => {
        const res = await fetchWithAuth(`/google-classroom/assignments/${userId}/${courseId}`);
        if (!res.ok) throw new Error('Failed to fetch assignments');
        return res.json();
    },
    getMaterials: async (userId: string, courseId: string) => {
        const res = await fetchWithAuth(`/google-classroom/materials/${userId}/${courseId}`);
        if (!res.ok) throw new Error('Failed to fetch materials');
        return res.json();
    },

    // Video Generation
    generateVideo: async (topic: string) => {
        const res = await fetchWithAuth('/video/generate', {
            method: 'POST',
            body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error('Failed to start video generation');
        return res.json();
    },
    getVideoStatus: async (jobId: string) => {
        const res = await fetchWithAuth(`/video/status/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch video status');
        return res.json();
    }
};
