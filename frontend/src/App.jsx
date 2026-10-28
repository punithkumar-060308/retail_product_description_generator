import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, Award, BookOpen } from 'lucide-react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import SingleProductStudio from './components/SingleProductStudio';
import BulkBatchProcessor from './components/BulkBatchProcessor';
import QualityRubricView from './components/QualityRubricView';
import DocsArchitectureView from './components/DocsArchitectureView';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [health, setHealth] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const checkHealth = async () => {
    const data = await fetchHealth();
    setHealth(data);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        health={health}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Navigation Tabs */}
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
          className={`tab-btn ${activeTab === 'rubric' ? 'active' : ''}`}
          onClick={() => setActiveTab('rubric')}
        >
          <Award size={16} />
          Quality Rubric &amp; Evaluation
          <span className="tab-badge" style={{ background: 'rgba(16,185,129,0.3)', color: '#a7f3d0' }}>
            85% Target
          </span>
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
          <SingleProductStudio onFeedbackSubmitted={checkHealth} />
        )}
        {activeTab === 'bulk' && <BulkBatchProcessor />}
        {activeTab === 'rubric' && <QualityRubricView />}
        {activeTab === 'docs' && <DocsArchitectureView />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        onRefreshHealth={checkHealth}
      />
    </div>
  );
}
