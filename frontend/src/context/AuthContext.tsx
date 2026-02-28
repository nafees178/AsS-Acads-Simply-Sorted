import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface AuthContextType {
    userId: string | null;
    isAuthorized: boolean;
    login: (id: string) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        if (!userId) {
            setIsAuthorized(false);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const status = await api.checkClassroomStatus(userId);
            setIsAuthorized(status.is_authorized);
        } catch (error) {
            console.error("Failed to check classroom auth status", error);
            setIsAuthorized(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [userId]);

    const login = (id: string) => {
        localStorage.setItem('userId', id);
        setUserId(id);
    };

    const logout = () => {
        localStorage.removeItem('userId');
        setUserId(null);
        setIsAuthorized(false);
    };

    return (
        <AuthContext.Provider value={{ userId, isAuthorized, login, logout, checkAuth, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
