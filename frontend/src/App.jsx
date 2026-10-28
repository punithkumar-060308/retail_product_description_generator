import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, Award, BookOpen } from 'lucide-react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/auth/ProfileModal';
import SingleProductStudio from './components/SingleProductStudio';
import BulkBatchProcessor from './components/BulkBatchProcessor';
import DocsArchitectureView from './components/DocsArchitectureView';
import { 
  fetchHealth, 
  getStoredUser, 
  getStoredToken, 
  fetchUserProfile, 
  setStoredUser, 
  clearStoredAuth 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [health, setHealth] = useState(null);
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Modal dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const checkHealth = async () => {
    const data = await fetchHealth();
    setHealth(data);
  };

  // Sync session on mount
  useEffect(() => {
    checkHealth();
    const token = getStoredToken();
    if (token) {
      fetchUserProfile(token)
        .then((userData) => {
          setCurrentUser(userData);
          setStoredUser(userData);
        })
        .catch(() => {
          // Token invalid or expired
          clearStoredAuth();
          setCurrentUser(null);
        });
    }

    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        health={health}
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Navigation Tabs (Centered via CSS) */}
      <nav className="nav-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          <Sparkles size={16} />
          Single Product Studio
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <Layers size={16} />
          Bulk Catalog Batch (50+ Items)
          <span className="tab-badge">55 Demo Ready</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <BookOpen size={16} />
          System &amp; Grounding Architecture
        </button>
      </nav>

      {/* Main Content Body */}
      <main>
        {activeTab === 'single' && (
          <SingleProductStudio 
            onFeedbackSubmitted={checkHealth}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'bulk' && <BulkBatchProcessor />}
        {activeTab === 'docs' && <DocsArchitectureView />}
      </main>

      {/* Provider & Server Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        onRefreshHealth={checkHealth}
      />

      {/* Retailer Authentication Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Retailer Business Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdateUser={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
      />
    </div>
  );
}
