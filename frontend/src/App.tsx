import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopNav from './components/TopNav';
import SplashScreen from './components/SplashScreen';
import { PreviewCardProvider } from './context/PreviewCardContext';
import { useAuth } from './context/AuthContext';
import ChatPage from './pages/Chat';
import ConnectPage from './pages/Connect';
import DirectoryPage from './pages/Directory';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import UserProfilePage from './pages/UserProfile';
import MessagesPage from './pages/Messages';
import AdminPage from './pages/Admin';
import LoginPage from './pages/Login';

export default function App() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  const splash = !splashDone ? <SplashScreen onDone={() => setSplashDone(true)} /> : null;

  if (loading && !currentUser) {
    return (
      <div className="app-loading">
        {splash}
        <div className="spinner" />
      </div>
    );
  }

  // Unauthenticated: only the login screen is available.
  if (!isAuthenticated) {
    return (
      <>
        {splash}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <PreviewCardProvider>
      {splash}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app-shell">
        <TopNav />
        <main className="app-main" id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:threadId" element={<MessagesPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </PreviewCardProvider>
  );
}
