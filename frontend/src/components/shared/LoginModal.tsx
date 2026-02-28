import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink, Loader2, LogIn } from 'lucide-react';
import { api } from '../../services/api';
import { GoogleLogin } from '@react-oauth/google';

export const LoginModal: React.FC = () => {
    const { userId, userProfile, isAuthorized, login, checkAuth, isLoading } = useAuth();
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState('');

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

                <h2 className="text-2xl font-bold font-[Outfit] text-pure mb-2">Simply Sorted</h2>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-teal animate-spin mb-4" />
                        <p className="text-slate">Initialising session...</p>
                    </div>
                ) : !userId ? (
                    <>
                        <p className="text-silver mb-8 text-sm">
                            Your personalized study assistant. Please sign in with your Google account to continue.
                        </p>

                        <div className="flex justify-center mb-4">
                            <GoogleLogin
                                onSuccess={(credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        login(credentialResponse.credential);
                                    }
                                }}
                                onError={() => {
                                    setError('Sign in failed. Please try again.');
                                }}
                                useOneTap
                                theme="filled_black"
                                shape="pill"
                            />
                        </div>

                        {error && (
                            <p className="text-scarlet text-xs text-center mt-4">
                                {error}
                            </p>
                        )}
                    </>
                ) : !isAuthorized ? (
                    <>
                        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-teal/5 border border-teal/10">
                            {userProfile?.picture ? (
                                <img src={userProfile.picture} alt="" className="w-10 h-10 rounded-full border border-teal/20" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                                    <LogIn className="w-5 h-5 text-teal" />
                                </div>
                            )}
                            <div>
                                <p className="text-pure text-sm font-semibold">{userProfile?.name}</p>
                                <p className="text-slate text-xs">{userProfile?.email}</p>
                            </div>
                        </div>

                        <p className="text-silver mb-8 text-sm">
                            You're signed in! Now, authorize <strong>Google Classroom</strong> to sync your courses and study materials.
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
                                className="w-full flex items-center justify-center gap-2 bg-teal text-obsidian font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                                Authorize Classroom
                            </button>

                            <button
                                onClick={checkAuth}
                                className="w-full text-sm text-slate hover:text-pure transition-colors"
                            >
                                I've already authorized
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};
