import React from 'react';
import { X, Cpu, Key, Server, Database } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, health, onRefreshHealth }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={22} color="var(--accent-primary)" />
            AI Provider &amp; System Configuration
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Server size={18} color="var(--accent-primary)" />
              <strong style={{ fontSize: 14 }}>Backend Status:</strong>
              <span style={{ 
                color: health?.status === 'healthy' ? 'var(--accent-emerald)' : 'var(--accent-rose)', 
                fontWeight: 600, 
                fontSize: 13 
              }}>
                {health?.status === 'healthy' ? 'Healthy & Connected (Port 8000)' : 'Disconnected / Not running'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              FastAPI backend running locally with CORS enabled, Pydantic validation, and CSV batch processing.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Database size={18} color="var(--accent-emerald)" />
              <strong style={{ fontSize: 14 }}>Database Storage:</strong>
              <span style={{ 
                color: health?.database?.connected !== false ? 'var(--accent-emerald)' : 'var(--accent-rose)', 
                fontWeight: 600, 
                fontSize: 13 
              }}>
                {health?.database?.connected ? 'MongoDB (Connected & Active)' : 'MongoDB (Connection Degraded)'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              All retailer accounts, shop profiles, and evaluations are stored in MongoDB.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Key size={18} color="var(--accent-purple)" />
              <strong style={{ fontSize: 14 }}>Generative AI Engine:</strong>
              <span className={`provenance-tag ${health?.llm_configured ? 'llm' : 'fallback'}`}>
                {health?.llm_configured ? 'Google Gemini 2.0 Flash' : 'Grounded Fallback Engine'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {health?.llm_configured ? (
                'Live Google Gemini API key is configured. Outputs are generated using the live LLM with strict factual grounding.'
              ) : (
                'Running in transparent Deterministic Grounded Mode. Factual copy is constructed strictly from input attributes and selected voice without external API dependency.'
              )}
            </p>
          </div>

        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={onRefreshHealth}>
            Recheck Connection
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
