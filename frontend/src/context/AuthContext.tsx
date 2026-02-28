import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

interface UserProfile {
    user_id: string;
    name: string;
    email: string;
    created_at: string;
    picture?: string;
}

interface AuthContextType {
    userId: string | null;
    userProfile: UserProfile | null;
    isAuthorized: boolean;
    login: (credential: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('userProfile');
        return saved ? JSON.parse(saved) : null;
    });
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

    const login = async (credential: string) => {
        try {
            setIsLoading(true);
            const response = await api.googleLogin(credential);
            const user = response.user;

            localStorage.setItem('userId', user.user_id);
            localStorage.setItem('userProfile', JSON.stringify(user));

            setUserId(user.user_id);
            setUserProfile(user);

            // Check classroom auth status immediately after login
            const status = await api.checkClassroomStatus(user.user_id);
            setIsAuthorized(status.is_authorized);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userProfile');
        setUserId(null);
        setUserProfile(null);
        setIsAuthorized(false);
    };

    return (
        <AuthContext.Provider value={{ userId, userProfile, isAuthorized, login, logout, checkAuth, isLoading }}>
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
