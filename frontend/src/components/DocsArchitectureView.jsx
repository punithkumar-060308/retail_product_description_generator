import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Code2, CheckCircle2 } from 'lucide-react';

export default function DocsArchitectureView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-panel" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={22} color="var(--accent-primary)" />
          System Architecture &amp; Grounding Architecture
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The Retail Product Description Generator solves the key challenge in e-commerce copywriting: 
          generating high-converting, tone-calibrated, and SEO-optimized copy at scale while 
          <strong> strictly preventing hallucinations and unsupported claims</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {/* Grounding Strategy */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-primary)' }}>
            <ShieldCheck size={18} />
            1. Strict Fact-Grounding Guardrails
          </h3>
          <ul style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.8 }}>
            <li><strong>Zero Extrapolation:</strong> LLM prompt explicitly prohibits guessing battery hours, materials, certifications, or warranties.</li>
            <li><strong>Omission over Invention:</strong> If a technical attribute is absent in the input, the copywriter omits it rather than guessing.</li>
            <li><strong>Post-Generation Compliance Audit:</strong> Automated regex and keyword checker scans for unauthorized marketing claims.</li>
            <li><strong>SERP 160-Character Cap:</strong> Enforces Google snippet length to prevent truncation in search result rankings.</li>
          </ul>
        </div>

        {/* Multi-Tone Calibration */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
            <Cpu size={18} />
            2. Multi-Tone Calibration Matrix
          </h3>
          <ul style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.8 }}>
            <li><strong>Friendly:</strong> Warm, conversational, enthusiastic, lifestyle-oriented.</li>
            <li><strong>Professional:</strong> Authoritative, utilitarian, engineered for precision.</li>
            <li><strong>Premium:</strong> Luxurious, evocative, curated, elevated vocabulary.</li>
            <li><strong>Minimal:</strong> Direct, punchy, essential benefits with zero filler.</li>
            <li><strong>Urgent / Persuasive:</strong> Action-driven, motivating, highlighting problem-solving speed.</li>
          </ul>
        </div>
      </div>

      {/* CSV Schema */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={18} color="var(--accent-emerald)" />
          Catalog CSV Schema (Flexible Column Mapping)
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          The CSV Ingestion Service automatically detects and maps column aliases across common retail formats:
        </p>

        <div className="table-wrapper">
          <table className="batch-table">
            <thead>
              <tr>
                <th>Canonical Column</th>
                <th>Requirement</th>
                <th>Accepted Aliases</th>
                <th>Sample Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>name</code></td>
                <td><span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>Required</span></td>
                <td><code>product_name, title, product_title, item_name</code></td>
                <td>AuraWave ANC Headphones</td>
              </tr>
              <tr>
                <td><code>features</code></td>
                <td><span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Recommended</span></td>
                <td><code>key_features, feature_list, highlights, bullets</code></td>
                <td>Hybrid ANC, 45h battery, Bluetooth 5.3</td>
              </tr>
              <tr>
                <td><code>category</code></td>
                <td>Optional</td>
                <td><code>product_category, department, type</code></td>
                <td>Electronics</td>
              </tr>
              <tr>
                <td><code>price</code></td>
                <td>Optional</td>
                <td><code>cost, mrp, retail_price</code></td>
                <td>4999</td>
              </tr>
              <tr>
                <td><code>tone</code></td>
                <td>Optional</td>
                <td><code>brand_voice, style</code></td>
                <td>Premium</td>
              </tr>
              <tr>
                <td><code>keywords</code></td>
                <td>Optional</td>
                <td><code>seo_keywords, search_terms, tags</code></td>
                <td>noise cancelling, wireless bluetooth</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
