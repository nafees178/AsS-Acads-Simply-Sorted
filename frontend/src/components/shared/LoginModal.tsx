import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const LoginModal: React.FC = () => {
    const { userId, isAuthorized, login, checkAuth, isLoading } = useAuth();
    const [inputId, setInputId] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputId.trim()) {
            login(inputId.trim());
        }
    };

    const handleAuthorize = async () => {
        if (!userId) return;
        try {
            setAuthLoading(true);
            setError('');
            const res = await api.getAuthUrl(userId);
            if (res.auth_url) {
                window.location.href = res.auth_url;
            }
        } catch (err: any) {
            setError('Failed to generate authorization link. Is the backend running?');
        } finally {
            setAuthLoading(false);
        }
    };

    // If fully loaded and authorized, don't show the modal
    if (!isLoading && userId && isAuthorized) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
            <div className="bg-elevated border border-edge rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal via-indigo to-purple" />

                <h2 className="text-2xl font-bold font-[Outfit] text-pure mb-2">Welcome to Simply Sorted</h2>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-teal animate-spin mb-4" />
                        <p className="text-slate">Checking authorization...</p>
                    </div>
                ) : !userId ? (
                    <>
                        <p className="text-silver mb-6 text-sm">
                            Please enter your user ID to access your dashboard.
                        </p>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate mb-1">User ID</label>
                                <div className="relative">
                                    <KeyRound className="absolute w-5 h-5 text-silver left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={inputId}
                                        onChange={(e) => setInputId(e.target.value)}
                                        placeholder="e.g. nafees_123"
                                        className="w-full bg-[#1A1A1A] border border-edge rounded-lg py-2.5 pl-10 pr-4 text-pure focus:outline-none focus:border-teal transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-teal text-obsidian font-semibold py-2.5 rounded-lg hover:bg-teal/90 transition-colors"
                            >
                                Continue
                            </button>
                        </form>
                    </>
                ) : !isAuthorized ? (
                    <>
                        <p className="text-silver mb-6 text-sm">
                            You are logged in as <strong className="text-pure">{userId}</strong>, but you need to authorize Google Classroom to sync your courses.
                        </p>

                        {error && (
                            <div className="p-3 mb-4 rounded-lg bg-scarlet/10 border border-scarlet/20 text-scarlet text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleAuthorize}
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo text-pure font-semibold py-2.5 rounded-lg hover:bg-indigo/90 transition-colors disabled:opacity-50"
                            >
                                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                                Authorize Google Classroom
                            </button>
                            <button
                                onClick={checkAuth}
                                className="w-full text-sm text-silver hover:text-pure transition-colors"
                            >
                                I've already authorized
                            </button>
                            <button
                                onClick={() => login('')} // Clear user ID to go back
                                className="w-full text-sm text-scarlet hover:text-scarlet/80 transition-colors pt-2 border-t border-edge"
                            >
                                Use a different ID
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};
