/**
 * API client service for communicating with the FastAPI backend.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      provider: 'Offline / Disconnected',
      model: 'None',
      llm_configured: false,
      error: err.message,
    };
  }
}

export async function generateSingleProduct(productData) {
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error (${res.status})`);
  }
  return await res.json();
}

export async function generateBatchCsv(fileOrBlob, fileName, defaultTone = 'Friendly') {
  const formData = new FormData();
  formData.append('file', fileOrBlob, fileName || 'upload.csv');
  formData.append('default_tone', defaultTone);

  const res = await fetch(`${API_BASE_URL}/generate-batch`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Batch upload error (${res.status})`);
  }
  return await res.json();
}

export async function fetchSampleCatalog() {
  const res = await fetch(`${API_BASE_URL}/sample-catalog`);
  if (!res.ok) throw new Error('Failed to fetch bundled sample catalog.');
  return await res.text();
}

export async function exportCsv(results) {
  const res = await fetch(`${API_BASE_URL}/export-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  });

  if (!res.ok) throw new Error('CSV export failed.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retail_product_descriptions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function submitEvaluation(feedbackData) {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to submit feedback.');
  }
  return await res.json();
}

export async function fetchFeedbackList() {
  try {
    const res = await fetch(`${API_BASE_URL}/feedback`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
