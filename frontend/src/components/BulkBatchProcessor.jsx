import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Play,
  AlertTriangle,
  Layers,
  Search,
  Eye,
  X,
  Zap,
  Filter,
  Ban
} from 'lucide-react';
import { generateBatchCsv, exportCsv, fetchSampleCatalog } from '../services/api';

const SAMPLE_FILENAME = 'sample_products_55.csv';
const SAMPLE_COUNT = 55;
const META_LIMIT = 160;

export default function BulkBatchProcessor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [defaultTone, setDefaultTone] = useState('Friendly');
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);
  const modalCloseRef = useRef(null);
  // Incremented on every run/cancel so late responses from old runs are ignored.
  const runIdRef = useRef(0);

  // ---------- File selection ----------

  const acceptFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleFileChange = (e) => {
    acceptFile(e.target.files?.[0]);
    // Allow re-selecting the same file (otherwise onChange won't fire again).
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  // ---------- Batch execution ----------

  const runBatch = async (file, name) => {
    const runId = ++runIdRef.current;
    setProcessing(true);
    setError(null);

    try {
      const res = await generateBatchCsv(file, name, defaultTone);
      if (runId !== runIdRef.current) return; // cancelled or superseded
      setBatchResult(res);
      // Reset view state so stale filters/modals never point at old data.
      setCategoryFilter('All');
      setSearchQuery('');
      setSelectedProductModal(null);
    } catch (err) {
      if (runId !== runIdRef.current) return;
      setError(err?.message || 'Batch generation failed.');
    } finally {
      if (runId === runIdRef.current) setProcessing(false);
    }
  };

  const handleLoadSampleCatalog = async () => {
    const runId = runIdRef.current + 1; // the id runBatch will claim
    try {
      setProcessing(true);
      setError(null);
      const csvText = await fetchSampleCatalog();
      if (runIdRef.current + 1 !== runId) return; // cancelled while fetching
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], SAMPLE_FILENAME, { type: 'text/csv' });
      setSelectedFile(file);
      await runBatch(file, SAMPLE_FILENAME);
    } catch (err) {
      setError(err?.message || 'Failed to process sample catalog');
      setProcessing(false);
    }
  };

  const handleStartBatch = () => {
    if (!selectedFile) {
      setError('Please choose or upload a CSV catalog first.');
      return;
    }
    runBatch(selectedFile, selectedFile.name);
  };

  const handleCancel = () => {
    runIdRef.current += 1;
    setProcessing(false);
  };

  const handleExport = async () => {
    if (!batchResult?.results?.length) return;
    try {
      await exportCsv(batchResult.results);
    } catch (err) {
      setError('Export failed: ' + (err?.message || 'unknown error'));
    }
  };

  // ---------- Modal behaviour ----------

  const closeModal = useCallback(() => setSelectedProductModal(null), []);

  useEffect(() => {
    if (!selectedProductModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    modalCloseRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProductModal, closeModal]);

  // ---------- Derived data ----------

  const results = batchResult?.results;

  const categories = useMemo(
    () => ['All', ...new Set((results || []).map((r) => r.category || 'General'))],
    [results]
  );

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (results || []).filter((item) => {
      const category = item.category || 'General';
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        (item.product_id || '').toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'All' || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [results, searchQuery, categoryFilter]);

  const successRate =
    batchResult && batchResult.total_rows > 0
      ? Math.round((100 * batchResult.success_count) / batchResult.total_rows)
      : 0;

  const modalMetaCount = selectedProductModal?.meta_char_count ?? 0;

  return (
    <div className="bulk-container">
      {/* Upload and Configuration Panel */}
      <div className="bulk-actions-card glass-panel">
        <div>
          <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Layers size={22} color="var(--accent-primary)" />
            Bulk Catalog Ingestion &amp; Generation
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
            Upload any CSV product catalog or load the verified {SAMPLE_COUNT}-product e-commerce dataset with a single click.
            All valid rows are processed with strict factual grounding and exported to CSV.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLoadSampleCatalog}
              disabled={processing}
            >
              <Zap size={16} />
              {processing ? 'Processing Catalog...' : `⚡ 1-Click Load & Process ${SAMPLE_COUNT} Products`}
            </button>

            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>or</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="default-tone" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Default Voice:
              </label>
              <select
                id="default-tone"
                className="select-field"
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
                disabled={processing}
                style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
              >
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Premium">Premium</option>
                <option value="Minimal">Minimal</option>
                <option value="Urgent / Persuasive">Urgent / Persuasive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`dropzone${dragging ? ' dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Select a CSV catalog file"
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon">
            <UploadCloud size={36} />
          </div>
          <strong style={{ fontSize: 14, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
            {selectedFile ? selectedFile.name : 'Click or drop a CSV catalog here'}
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {selectedFile
              ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`
              : 'Supports standard UTF-8 CSV with name, features, category'}
          </span>

          {selectedFile && !processing && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartBatch();
                }}
              >
                <Play size={14} /> Process Uploaded File
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="grounding-alert warning" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Progress Skeleton when processing */}
      {processing && (
        <div className="glass-panel" style={{ padding: 36, textAlign: 'center' }} aria-live="polite">
          <div className="pulse-anim" style={{ marginBottom: 16 }}>
            <Layers size={42} color="var(--accent-primary)" />
          </div>
          <h3>Processing catalog...</h3>
          <p style={{ maxWidth: 450, margin: '8px auto 20px' }}>
            Validating row schemas, generating grounded customer copy, and creating SERP meta descriptions.
          </p>
          <div
            style={{
              height: 8,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              overflow: 'hidden',
              maxWidth: 400,
              margin: '0 auto'
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--accent-gradient)',
                width: '100%',
                animation: 'pulseGlow 1.2s infinite'
              }}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>
              <Ban size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Benchmark Summary Metrics */}
      {batchResult && !processing && (
        <>
          <div className="metrics-row">
            <div className="metric-card">
              <span className="metric-label">Total Catalog Rows</span>
              <div className="metric-value" style={{ color: 'var(--accent-primary)' }}>
                {batchResult.total_rows}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Input rows read</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Descriptions Generated</span>
              <div className="metric-value" style={{ color: 'var(--accent-emerald)' }}>
                {batchResult.success_count}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{successRate}% success rate</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Processing Duration</span>
              <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                {batchResult.execution_time_seconds}s
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total batch time</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Invalid Rows Skipped</span>
              <div
                className="metric-value"
                style={{ color: batchResult.error_count > 0 ? 'var(--accent-rose)' : 'var(--text-dim)' }}
              >
                {batchResult.error_count}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {batchResult.error_count > 0 ? 'Rows missing required fields' : 'No rows skipped'}
              </span>
            </div>
          </div>

          {/* Results Action Bar & Filters */}
          <div className="glass-panel" style={{ padding: '16px 22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    className="input-field"
                    aria-label="Search products"
                    placeholder="Search products by title, SKU, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={14} color="var(--text-dim)" />
                  <select
                    className="select-field"
                    aria-label="Filter by category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ width: 'auto', padding: '10px 14px' }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" className="btn btn-success" onClick={handleExport}>
                <Download size={16} /> Export All {batchResult.results?.length ?? 0} to CSV
              </button>
            </div>
          </div>

          {/* Batch Results Table */}
          <div className="table-wrapper glass-panel">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>SKU / ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Voice</th>
                  <th>Short Description Hook</th>
                  <th>SEO Meta Snippet</th>
                  <th>Provenance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((item, idx) => (
                  <tr key={item.product_id ?? `${item.name}-${idx}`}>
                    <td>
                      <code style={{ color: '#818cf8', fontSize: 11 }}>{item.product_id || `P${idx + 1}`}</code>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>{item.name}</strong>
                    </td>
                    <td>
                      <span className="preset-chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.tone}</span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div
                        title={item.short_description}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}
                      >
                        {item.short_description}
                      </div>
                    </td>
                    <td style={{ maxWidth: 240 }}>
                      <div
                        title={item.meta_description}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}
                      >
                        {item.meta_description}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: item.meta_char_count > META_LIMIT ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                        }}
                      >
                        {item.meta_char_count} chars
                      </span>
                    </td>
                    <td>
                      <span
                        className={`provenance-tag ${item.generation_mode === 'gemini-llm' ? 'llm' : 'fallback'}`}
                        style={{ fontSize: 10, padding: '2px 8px' }}
                      >
                        {item.generation_mode === 'gemini-llm' ? 'Gemini' : 'Grounded'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedProductModal(item)}
                        title="View complete description and keywords"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                No products match the filter criteria.
              </div>
            )}
          </div>
        </>
      )}

      {/* Expanded Product Modal */}
      {selectedProductModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-content glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span className="preset-chip" style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}>
                  {selectedProductModal.category || 'General'}
                </span>
                <h3 id="product-modal-title" style={{ fontSize: 18 }}>
                  {selectedProductModal.name}
                </h3>
              </div>
              <button
                type="button"
                ref={modalCloseRef}
                aria-label="Close preview"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="copy-card">
                <span className="copy-card-title">Short Description:</span>
                <p className="short-desc-highlight" style={{ marginTop: 8 }}>
                  {selectedProductModal.short_description}
                </p>
              </div>

              <div className="copy-card">
                <span className="copy-card-title">Full Detailed Description:</span>
                <div className="copy-text" style={{ marginTop: 8 }}>
                  {selectedProductModal.description}
                </div>
              </div>

              <div className="serp-card">
                <div className="serp-title">{selectedProductModal.name}</div>
                <div className="serp-snippet">{selectedProductModal.meta_description}</div>
                <div
                  className={`char-counter ${modalMetaCount > META_LIMIT ? 'invalid' : 'valid'}`}
                  style={{ marginTop: 6 }}
                >
                  {modalMetaCount} / {META_LIMIT} Characters
                </div>
              </div>

              <div>
                <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  SEO Keywords:
                </strong>
                <div className="keyword-tags">
                  {(selectedProductModal.seo_keywords || []).map((kw, i) => (
                    <span key={`${kw}-${i}`} className="keyword-tag">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={closeModal}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}