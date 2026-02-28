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

// Persistent cache to prevent repetitive loading across navigation/reloads
const CACHE_KEY_PREFIX = 'ass_api_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getCached(key: string) {
    try {
        const cachedStr = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (!cachedStr) return null;

        const cached = JSON.parse(cachedStr);
        if (Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
            return cached.data;
        }
        // Remove expired cache
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
    } catch (e) {
        console.error("Cache read error", e);
    }
    return null;
}

function setCache(key: string, data: any) {
    try {
        const cacheObj = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheObj));
    } catch (e) {
        console.error("Cache write error", e);
    }
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
    googleLogin: async (credential: string) => {
        const res = await fetchWithAuth('/auth/google-login', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        });
        if (!res.ok) throw new Error('Google login failed');
        return res.json();
    },

    // Classroom Data
    getCourses: async (userId: string, forceRefresh = false) => {
        const cacheKey = `courses_${userId}`;
        if (!forceRefresh) {
            const cached = getCached(cacheKey);
            if (cached) return cached;
        }

        const res = await fetchWithAuth(`/google-classroom/courses/${userId}${forceRefresh ? '?refresh=true' : ''}`);
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    },
    getAssignments: async (userId: string, courseId: string, forceRefresh = false) => {
        const cacheKey = `assignments_${userId}_${courseId}`;
        if (!forceRefresh) {
            const cached = getCached(cacheKey);
            if (cached) return cached;
        }

        const res = await fetchWithAuth(`/google-classroom/assignments/${userId}/${courseId}${forceRefresh ? '?refresh=true' : ''}`);
        if (!res.ok) throw new Error('Failed to fetch assignments');
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    },
    getMaterials: async (userId: string, courseId: string, forceRefresh = false) => {
        const cacheKey = `materials_${userId}_${courseId}`;
        if (!forceRefresh) {
            const cached = getCached(cacheKey);
            if (cached) return cached;
        }

        const res = await fetchWithAuth(`/google-classroom/materials/${userId}/${courseId}${forceRefresh ? '?refresh=true' : ''}`);
        if (!res.ok) throw new Error('Failed to fetch materials');
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    },

    // Video Generation
    generateVideo: async (topic: string, documentIds: string[] = [], userId: string | null = null) => {
        const res = await fetchWithAuth('/video/generate', {
            method: 'POST',
            body: JSON.stringify({ topic, document_ids: documentIds, user_id: userId }),
        });
        if (!res.ok) throw new Error('Failed to start video generation');
        return res.json();
    },
    getVideoStatus: async (jobId: string) => {
        const res = await fetchWithAuth(`/video/status/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch video status');
        return res.json();
    },
    getVideos: async (userId?: string) => {
        const url = userId ? `/video/jobs?user_id=${userId}` : `/video/jobs`;
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Failed to fetch videos');
        return res.json();
    },
    // Document Summarization & Management
    getDocuments: async (userId: string) => {
        const response = await fetch(`${API_BASE_URL}/documents/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
    },

    uploadDocument: async (file: File, userId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);

        const response = await fetch(`${API_BASE_URL}/upload/`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload document');
        return response.json();
    },

    mapSyllabus: async (userId: string, documentId: string | null, syllabusText: string, courseId: string | null = null) => {
        const formData = new FormData();
        formData.append('user_id', userId);
        if (documentId) formData.append('document_id', documentId);
        if (courseId) formData.append('course_id', courseId);
        formData.append('syllabus_text', syllabusText);

        const res = await fetch(`${API_BASE_URL}/syllabus/map`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Mapping failed');
        return res.json();
    },

    search: async (userId: string, query: string, topK: number = 5) => {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('query', query);
        formData.append('top_k', topK.toString());

        const res = await fetch(`${API_BASE_URL}/search/`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Search failed');
        return res.json();
    },

    getProcessingStatus: async (userId: string, courseId: string) => {
        const res = await fetchWithAuth(`/google-classroom/status/${userId}/${courseId}`);
        if (!res.ok) throw new Error('Status check failed');
        return res.json();
    },
    processMaterial: async (userId: string, courseId: string, materialId: string, materialType: 'material' | 'assignment') => {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('course_id', courseId);
        formData.append('material_id', materialId);
        formData.append('material_type', materialType);

        const res = await fetch(`${API_BASE_URL}/google-classroom/process-material`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Material processing failed');
        return res.json();
    },
    API_BASE_URL
};
