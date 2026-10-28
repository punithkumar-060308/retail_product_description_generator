import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Search, 
  Tag, 
  AlertCircle, 
  ShieldCheck, 
  RotateCcw, 
  Sliders, 
  Star, 
  Send,
  Zap,
  Globe
} from 'lucide-react';
import { generateSingleProduct, submitEvaluation } from '../services/api';

const SAMPLE_PRESETS = [
  {
    label: '🎧 ANC Headphones',
    data: {
      name: 'AuraWave Active Noise Cancelling Headphones',
      category: 'Electronics',
      features: 'Hybrid Active Noise Cancellation, 45-hour battery life, Bluetooth 5.3, Plush memory foam earcups, Fast USB-C charging',
      specifications: 'Battery: 45h, Weight: 260g, Drivers: 40mm',
      price: '4999',
      currency: 'INR',
      audience: 'Commuters and music enthusiasts',
      keywords: 'noise cancelling headphones, wireless bluetooth headset, over ear headphones',
      brand: 'AuraAudio',
      tone: 'Premium',
    },
  },
  {
    label: '⌚ Fitness Smartwatch',
    data: {
      name: 'PulseFit Pro Smartwatch',
      category: 'Electronics',
      features: 'Heart rate & SpO2 tracking, 1.4-inch AMOLED display, 14-day battery life, 5ATM water resistance, Sleep analysis',
      specifications: 'Display: 1.4 AMOLED, Water Resistance: 5ATM',
      price: '3499',
      currency: 'INR',
      audience: 'Fitness tracking athletes and tech lovers',
      keywords: 'smartwatch fitness tracker, heart rate monitor, waterproof smartwatch',
      brand: 'PulseFit',
      tone: 'Professional',
    },
  },
  {
    label: '☕ Pour-Over Kettle',
    data: {
      name: 'Zenith Pour-Over Gooseneck Kettle',
      category: 'Kitchen',
      features: 'Precision flow spout, Built-in analog thermometer, 1.2L capacity, Ergonomic wooden handle, Food-grade 304 stainless steel',
      specifications: 'Capacity: 1.2L, Material: Stainless Steel 304',
      price: '2199',
      currency: 'INR',
      audience: 'Specialty coffee lovers and home baristas',
      keywords: 'pour over kettle, gooseneck coffee kettle, barista drip kettle',
      brand: 'Zenith Brew',
      tone: 'Friendly',
    },
  },
  {
    label: '🎒 Waterproof Backpack',
    data: {
      name: 'UrbanTrail Waterproof Hiking Backpack',
      category: 'Outdoor',
      features: '40L storage capacity, Tear-resistant nylon, Integrated rain cover, Ergonomic ventilated shoulder straps, Hydration bladder compartment',
      specifications: 'Capacity: 40L, Weight: 850g',
      price: '2899',
      currency: 'INR',
      audience: 'Hikers, campers and weekend adventurers',
      keywords: 'hiking backpack, waterproof travel daypack, outdoor trekking bag',
      brand: 'UrbanTrail',
      tone: 'Urgent / Persuasive',
    },
  },
  {
    label: '🪑 Ergonomic Desk Chair',
    data: {
      name: 'Lumix Pro Ergonomic Office Chair',
      category: 'Furniture',
      features: 'Adjustable lumbar support, Breathable mesh back, 3D armrests, Heavy-duty nylon base, 135-degree recline',
      specifications: 'Max weight: 150kg, Material: Mesh & Alloy',
      price: '11999',
      currency: 'INR',
      audience: 'Remote workers and office executives',
      keywords: 'ergonomic desk chair, lumbar support chair, mesh computer chair',
      brand: 'ErgoMaster',
      tone: 'Professional',
    },
  },
];

const TONES = [
  { id: 'Friendly', name: 'Friendly', desc: 'Warm, conversational & inviting' },
  { id: 'Professional', name: 'Professional', desc: 'Authoritative, precise & informative' },
  { id: 'Premium', name: 'Premium', desc: 'Luxurious, evocative & sophisticated' },
  { id: 'Minimal', name: 'Minimal', desc: 'Punchy, direct & essential benefits' },
  { id: 'Urgent / Persuasive', name: 'Urgent', desc: 'High-energy, action-driven & compelling' },
];

export default function SingleProductStudio({ onFeedbackSubmitted, currentUser }) {
  const [formData, setFormData] = useState({
    name: 'AuraWave Active Noise Cancelling Headphones',
    category: 'Electronics',
    features: 'Hybrid Active Noise Cancellation, 45-hour battery life, Bluetooth 5.3, Plush memory foam earcups, Fast USB-C charging',
    specifications: 'Battery: 45h, Weight: 260g, Drivers: 40mm',
    price: '4999',
    currency: 'INR',
    audience: 'Commuters and music enthusiasts',
    keywords: 'noise cancelling headphones, wireless bluetooth headset, over ear headphones',
    brand: 'AuraAudio',
    tone: 'Premium',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState(null);

  // Quality Rubric Rating State (1-5 scale)
  const [ratings, setRatings] = useState({
    factual: 5,
    relevance: 5,
    creativity: 5,
    readability: 5,
    seo: 5,
    tone: 5,
  });
  const [reviewerComment, setReviewerComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePresetSelect = (preset) => {
    setFormData(preset.data);
    setError(null);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      category: 'General',
      features: '',
      specifications: '',
      price: '',
      currency: 'INR',
      audience: '',
      keywords: '',
      brand: '',
      tone: 'Friendly',
    });
    setResult(null);
    setError(null);
    setFeedbackSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!formData.features.trim()) {
      setError('Product features are required to ground the description.');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedbackSent(false);

    try {
      const output = await generateSingleProduct(formData);
      setResult(output);
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (dimension, value) => {
    setRatings((prev) => ({ ...prev, [dimension]: value }));
  };

  // Calculate composite percentage
  const totalScore = Object.values(ratings).reduce((a, b) => a + b, 0);
  const compositePercentage = Math.round((totalScore / 30) * 100 * 10) / 10;

  const handleFeedbackSubmit = async () => {
    if (!result) return;
    setSubmittingFeedback(true);
    try {
      await submitEvaluation({
        product_name: result.name,
        tone: result.tone,
        rating_factual_accuracy: ratings.factual,
        rating_relevance: ratings.relevance,
        rating_creativity: ratings.creativity,
        rating_readability: ratings.readability,
        rating_seo_quality: ratings.seo,
        rating_tone_consistency: ratings.tone,
        comments: reviewerComment,
        generation_mode: result.generation_mode,
      });
      setFeedbackSent(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      alert('Failed to save evaluation: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="studio-grid">
      {/* Left Column: Form Studio */}
      <div className="form-panel glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={20} color="var(--accent-primary)" />
            <h3>Product Specification Studio</h3>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={handleReset}
            title="Reset form"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Quick Presets */}
        <div className="preset-strip">
          <span className="preset-label">
            <Zap size={14} /> Quick Demo:
          </span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="grounding-alert warning" style={{ marginBottom: 18 }}>
            <AlertCircle size={18} />
            <div>
              <strong>Validation Error:</strong> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">
              <span>Product Name <span className="req">*</span></span>
              <span className="label-hint">Official commercial title</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. AuraWave Active Noise Cancelling Headphones"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Category & Price */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Electronics, Kitchen, Outdoor"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price &amp; Currency</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 4999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  className="input-field"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="form-group">
            <label className="form-label">
              <span>Brand Voice &amp; Tone <span className="req">*</span></span>
              <span className="label-hint">Guides style and vocabulary</span>
            </label>
            <div className="tone-grid">
              {TONES.map((t) => (
                <div
                  key={t.id}
                  className={`tone-card ${formData.tone === t.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, tone: t.id })}
                >
                  <span className="tone-name">{t.name}</span>
                  <span className="tone-desc">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="form-group">
            <label className="form-label">
              <span>Key Features &amp; Verified Facts <span className="req">*</span></span>
              <span className="label-hint">Strictly grounded: AI will not invent facts</span>
            </label>
            <textarea
              className="textarea-field"
              rows={4}
              placeholder="List verified facts, materials, capabilities, e.g. 45-hour battery life, Bluetooth 5.3, Memory foam earcups"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              required
            />
          </div>

          {/* Target Audience */}
          <div className="form-group">
            <label className="form-label">
              <span>Target Customer Audience</span>
              <span className="label-hint">Shopper profile</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Commuters, students, remote workers, athletes"
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            />
          </div>

          {/* Collapsible Advanced Options */}
          <button
            type="button"
            className="collapsible-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>{showAdvanced ? '▼ Hide Advanced Details' : '▶ Show Advanced Details (Specs, Brand, SEO)'}</span>
          </button>

          {showAdvanced && (
            <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--border-color)' }}>
              <div className="form-group">
                <label className="form-label">Brand Identifier</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. AuraAudio, ErgoMaster"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Structured Technical Specifications</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Battery: 45h, Weight: 260g, Dimensions: 18x15cm"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Seed SEO Keywords (Comma-separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. noise cancelling headphones, over ear wireless"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              <Sparkles size={18} />
              {loading ? 'Synthesizing Grounded Copy...' : 'Generate Product Description'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Output Showcase & Evaluation */}
      <div className="results-panel glass-panel">
        {!result && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sparkles size={48} color="#4f46e5" />
            </div>
            <h3 style={{ marginBottom: 8 }}>Ready to Generate Product Copy</h3>
            <p style={{ maxWidth: 420, margin: '0 auto' }}>
              Select a quick demo preset or enter your product details on the left, then click{' '}
              <strong style={{ color: '#818cf8' }}>Generate Product Description</strong> to preview grounded, multi-tone e-commerce copy.
            </p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="pulse-anim" style={{ marginBottom: 16 }}>
              <Sparkles size={48} color="#a855f7" />
            </div>
            <h3>Generating Grounded Copy...</h3>
            <p>Enforcing strict factual constraints and {formData.tone} voice calibration.</p>
          </div>
        )}

        {result && (
          <>
            {/* Header Provenance Bar */}
            <div className="results-header-bar">
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generated for: </span>
                <strong style={{ fontSize: 16, color: '#fff' }}>{result.name}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge-version" style={{ textTransform: 'capitalize' }}>
                  {result.tone} Voice
                </span>
                <span className={`provenance-tag ${result.generation_mode === 'gemini-llm' ? 'llm' : 'fallback'}`}>
                  {result.generation_mode === 'gemini-llm' ? '✨ Gemini 2.0 Flash' : '⚡ Grounded Engine'}
                </span>
              </div>
            </div>

            {/* Grounding Audit Banner */}
            <div className={`grounding-alert ${result.warnings.length > 0 ? 'warning' : 'ok'}`}>
              <ShieldCheck size={20} />
              <div>
                <strong>Grounding Audit Status: </strong>
                {result.warnings.length === 0 ? (
                  <span>All claims strictly verified against supplied facts. No hallucinations detected.</span>
                ) : (
                  <span>{result.warnings.join(' • ')}</span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <div className="copy-card">
              <div className="copy-card-header">
                <span className="copy-card-title">
                  <Sparkles size={16} color="var(--accent-primary)" />
                  Short Customer Summary (Punchy Hook)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(result.short_description, 'short')}
                >
                  {copiedField === 'short' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedField === 'short' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="short-desc-highlight">{result.short_description}</p>
            </div>

            {/* Detailed Description */}
            <div className="copy-card">
              <div className="copy-card-header">
                <span className="copy-card-title">
                  <Tag size={16} color="var(--accent-cyan)" />
                  Detailed Product Story &amp; Merchandising Copy
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(result.description, 'full')}
                >
                  {copiedField === 'full' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedField === 'full' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="copy-text">{result.description}</div>
            </div>

            {/* Google SERP Card & Character Length */}
            <div className="copy-card">
              <div className="copy-card-header">
                <span className="copy-card-title">
                  <Search size={16} color="var(--accent-emerald)" />
                  Search Engine Snippet (Google SERP Preview)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(result.meta_description, 'meta')}
                >
                  {copiedField === 'meta' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedField === 'meta' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="serp-card">
                <div className="serp-url">
                  <Globe size={12} /> https://retail-store.com/products/{result.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                </div>
                <div className="serp-title">{result.name} | Official Store</div>
                <div className="serp-snippet">{result.meta_description}</div>
                <div className={`char-counter ${result.meta_char_count <= 160 ? 'valid' : 'warning'}`}>
                  {result.meta_char_count} / 160 Characters {result.meta_char_count <= 160 ? '✓ Ideal for SEO' : '⚠ Near limit'}
                </div>
              </div>
            </div>

            {/* SEO Keywords */}
            <div className="copy-card">
              <div className="copy-card-header">
                <span className="copy-card-title">
                  <Tag size={16} color="var(--accent-amber)" />
                  High-Intent SEO Keywords ({result.seo_keywords.length})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(result.seo_keywords.join(', '), 'keywords')}
                >
                  {copiedField === 'keywords' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedField === 'keywords' ? 'Copied All' : 'Copy All'}
                </button>
              </div>
              <div className="keyword-tags">
                {result.seo_keywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Human Quality Evaluation Widget (Section 12.2) */}
            <div className="feedback-widget">
              <div className="score-banner">
                <div>
                  <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>
                    TCS Evaluation Rubric &amp; Human Rating
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Target: ≥ 85% Composite Quality Score
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="score-num">{compositePercentage}%</div>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: compositePercentage >= 85 ? 'var(--accent-emerald)' : 'var(--accent-amber)' 
                  }}>
                    {compositePercentage >= 85 ? '✓ Exceeds 85% Target' : 'Needs Optimization'}
                  </span>
                </div>
              </div>

              <div className="rating-grid">
                {[
                  { key: 'factual', label: '1. Factual Accuracy' },
                  { key: 'relevance', label: '2. Product Relevance' },
                  { key: 'creativity', label: '3. Copy Creativity' },
                  { key: 'readability', label: '4. Prose Readability' },
                  { key: 'seo', label: '5. SEO & Meta Quality' },
                  { key: 'tone', label: '6. Tone Consistency' },
                ].map((dim) => (
                  <div key={dim.key} className="rating-item">
                    <span className="rating-title">{dim.label}</span>
                    <div className="stars-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${ratings[dim.key] >= star ? 'active' : ''}`}
                          onClick={() => handleRatingChange(dim.key, star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional evaluator review notes (e.g. Factual grounding was strictly verified)"
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  style={{ marginBottom: 12, fontSize: 13 }}
                />
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback || feedbackSent}
                  style={{ width: '100%' }}
                >
                  <Send size={14} />
                  {feedbackSent ? '✓ Evaluation Saved to History' : submittingFeedback ? 'Recording...' : 'Submit Evaluation Score'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
