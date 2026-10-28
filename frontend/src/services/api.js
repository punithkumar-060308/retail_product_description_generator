/**
 * API client service for communicating with the FastAPI backend.
 * Includes Product Generation, Catalog Batch, Quality Feedback, and Retailer Authentication endpoints.
 */

const API_BASE_URL = 'https://retail-product-description-generator.onrender.com';

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

/* ==========================================================================
   Retailer Authentication & Profile Services (user_account_creation_implementation.md)
   ========================================================================== */

export async function registerUser(registrationData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Registration failed (${res.status})`);
  }
  return await res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Login failed (${res.status})`);
  }
  return await res.json();
}

export async function fetchUserProfile(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to fetch profile (${res.status})`);
  }
  return await res.json();
}

export async function updateUserProfile(profileUpdates, token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileUpdates),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to update profile (${res.status})`);
  }
  return await res.json();
}

// Session persistence helpers
export function getStoredToken() {
  return localStorage.getItem('retailer_auth_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('retailer_auth_token', token);
  } else {
    localStorage.removeItem('retailer_auth_token');
  }
}

export function getStoredUser() {
  const data = localStorage.getItem('retailer_user_data');
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('retailer_user_data', JSON.stringify(user));
  } else {
    localStorage.removeItem('retailer_user_data');
  }
}

export function clearStoredAuth() {
  localStorage.removeItem('retailer_auth_token');
  localStorage.removeItem('retailer_user_data');
}
