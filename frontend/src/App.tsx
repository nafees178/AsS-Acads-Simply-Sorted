import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from './components/shared/Navbar';
import { LoginModal } from './components/shared/LoginModal';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import AIStudio from './pages/AIStudio';
import Notifications from './pages/Notifications';
import Syllabus from './pages/Syllabus';

const GOOGLE_CLIENT_ID = "399544299210-ti4n00e2nvv5vepms6f2th9vfs71vhco.apps.googleusercontent.com";

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <div className="min-h-screen bg-obsidian">
          <LoginModal />
          <Navbar />
          <main className="pt-20 pb-24 px-4 sm:px-6 mx-auto max-w-[1440px]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/ai-studio" element={<AIStudio />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/syllabus-map" element={<Syllabus />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;
