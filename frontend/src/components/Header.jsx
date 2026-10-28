import React from 'react';
import { Sparkles, Activity, Settings, ShieldCheck, Database } from 'lucide-react';

export default function Header({ health, onOpenSettings }) {
  const isHealthy = health?.status === 'healthy';
  const isLlm = health?.llm_configured;

  return (
    <header className="app-header glass-panel">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Sparkles size={26} />
        </div>
        <div className="brand-info">
          <h1>
            CopyForge AI
            <span className="badge-version">TCS Tech Day 2026</span>
          </h1>
          <p className="tagline">Grounded GenAI Retail Product Copy &amp; 50+ Catalog Batch Studio</p>
        </div>
      </div>

      <div className="header-actions">
        <div 
          className="status-pill" 
          onClick={onOpenSettings}
          title="Click to view backend configuration &amp; model settings"
        >
          <div className={`status-dot ${!isHealthy ? 'offline' : isLlm ? 'active' : 'fallback'}`} />
          <span>
            {!isHealthy ? 'Backend Offline' : isLlm ? 'Gemini 2.0 Flash LLM' : 'Grounded Fallback Engine'}
          </span>
          <Settings size={14} style={{ color: 'var(--text-dim)', marginLeft: 4 }} />
        </div>
      </div>
    </header>
  );
}
