import { Navigate, Route, Routes } from 'react-router-dom';
import TopNav from './components/TopNav';
import { PreviewCardProvider } from './context/PreviewCardContext';
import { useAuth } from './context/AuthContext';
import ChatPage from './pages/Chat';
import DirectoryPage from './pages/Directory';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import UserProfilePage from './pages/UserProfile';
import MessagesPage from './pages/Messages';
import LoginPage from './pages/Login';

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading && !currentUser) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <PreviewCardProvider>
      <div className="app-shell">
        <TopNav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:threadId" element={<MessagesPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </PreviewCardProvider>
  );
}
