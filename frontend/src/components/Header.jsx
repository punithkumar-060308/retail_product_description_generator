import React from 'react';
import { Sparkles, Settings, Store, LogIn, Moon, Sun } from 'lucide-react';

export default function Header({ health, onOpenSettings, currentUser, onOpenAuth, onOpenProfile, theme, onToggleTheme }) {
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
            Descripto AI
          </h1>
          <p className="tagline">Describe Smarter, Sell Better</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Retailer Account Badge / Login Trigger */}
        {currentUser ? (
          <button
            type="button"
            className="status-pill"
            onClick={onOpenProfile}
            title="View retailer profile and shop settings"
            style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.12)' }}
          >
            <Store size={15} color="var(--accent-primary)" />
            <span className="account-shop-name">{currentUser.shop_name}</span>
            <span className="account-user-name">({currentUser.full_name})</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenAuth}
            style={{ borderRadius: 30, padding: '7px 16px', fontSize: 13 }}
          >
            <LogIn size={14} color="var(--accent-primary)" />
            <span>Retailer Portal</span>
          </button>
        )}

        {/* AI Provider & Server Health Pill */}
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
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'night'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'night'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Night mode'}</span>
        </button>
      </div>
    </header>
  );
}
