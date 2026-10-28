import React, { useState } from 'react';
import { 
  X, 
  Store, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Zap 
} from 'lucide-react';
import { registerUser, loginUser, setStoredToken, setStoredUser } from '../../services/api';

const BUSINESS_TYPES = [
  'Retail shop',
  'Grocery / supermarket',
  'Clothing / fashion',
  'Electronics',
  'Pharmacy',
  'Home / furniture',
  'Beauty / personal care',
  'Wholesale / distributor',
  'Online store',
  'Other',
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Registration Form State
  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
    shop_name: '',
    business_type: 'Clothing / fashion',
    gst_number: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirm_password: '',
    preferred_tone: 'Friendly',
  });

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  if (!isOpen) return null;

  const handleDemoFillRegister = () => {
    setRegisterData({
      full_name: 'Asha Kumar',
      email: `asha.retailer_${Math.floor(Math.random() * 9000 + 1000)}@example.com`,
      phone: '+919876543210',
      organization: 'Asha Retail Pvt Ltd',
      shop_name: 'Asha Fashion Studio',
      business_type: 'Clothing / fashion',
      gst_number: '29ABCDE1234F1Z5',
      address_line: '12 Market Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      password: 'StrongPassword123!',
      confirm_password: 'StrongPassword123!',
      preferred_tone: 'Premium',
    });
    setError(null);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validation checks
    if (!registerData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!registerData.shop_name.trim()) {
      setError('Shop / business name is required.');
      return;
    }
    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (registerData.password !== registerData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register Account
      await registerUser(registerData);
      setSuccessMsg('Account created successfully! Logging you in...');

      // 2. Automatically log in after registration
      const loginRes = await loginUser({
        email: registerData.email,
        password: registerData.password,
      });

      setStoredToken(loginRes.access_token);
      setStoredUser(loginRes.user);

      if (onAuthSuccess) onAuthSuccess(loginRes.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginData.email || !loginData.password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(loginData);
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      setSuccessMsg(`Welcome back, ${res.user.full_name}!`);

      if (onAuthSuccess) onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: mode === 'register' ? 760 : 460 }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 40, height: 40 }}>
              <Store size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 19 }}>
                {mode === 'register' ? 'Retailer Account & Business Profile' : 'Retailer Portal Sign In'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {mode === 'register' ? 'Create your shop profile and activate AI copywriting' : 'Access your personalized shop catalog and preferences'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.8)', padding: 4, borderRadius: 10, marginBottom: 20 }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
            }}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              flex: 1,
              background: mode === 'register' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
            }}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="grounding-alert warning" style={{ marginBottom: 16 }}>
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="grounding-alert ok" style={{ marginBottom: 16 }}>
            <CheckCircle size={18} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* ---------------- LOGIN FORM ---------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">
                <span>Email Address <span className="req">*</span></span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="retailer@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Password <span className="req">*</span></span>
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              <LogIn size={16} />
              {loading ? 'Authenticating...' : 'Sign In to Studio'}
            </button>
          </form>
        )}

        {/* ---------------- REGISTRATION FORM ---------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDemoFillRegister}
                style={{ fontSize: 11 }}
              >
                <Zap size={13} color="var(--accent-primary)" /> 1-Click Demo Fill
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* Section 1: Retailer Details */}
              <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} /> 1. Retailer Personal Details
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Full Name <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Asha Kumar"
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Email Address <span className="req">*</span></span>
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="asha@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Phone Number <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. +919876543210"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Company / Organization Name</span>
                  <span className="label-hint">Optional</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Asha Retail Pvt Ltd"
                  value={registerData.organization}
                  onChange={(e) => setRegisterData({ ...registerData, organization: e.target.value })}
                />
              </div>

              {/* Section 2: Store & Business Profile */}
              <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginTop: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Store size={15} /> 2. Shop &amp; Business Profile
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Shop / Business Name <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Asha Fashion Studio"
                  value={registerData.shop_name}
                  onChange={(e) => setRegisterData({ ...registerData, shop_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Business Type <span className="req">*</span></span>
                </label>
                <select
                  className="select-field"
                  value={registerData.business_type}
                  onChange={(e) => setRegisterData({ ...registerData, business_type: e.target.value })}
                  required
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>GSTIN</span>
                  <span className="label-hint">Optional format check</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={registerData.gst_number}
                  onChange={(e) => setRegisterData({ ...registerData, gst_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Default Copywriting Tone</span>
                </label>
                <select
                  className="select-field"
                  value={registerData.preferred_tone}
                  onChange={(e) => setRegisterData({ ...registerData, preferred_tone: e.target.value })}
                >
                  <option value="Friendly">Friendly</option>
                  <option value="Professional">Professional</option>
                  <option value="Premium">Premium</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Urgent / Persuasive">Urgent / Persuasive</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  <span>Address Line</span>
                  <span className="label-hint">Street / Building</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 12 Market Road, Indiranagar"
                  value={registerData.address_line}
                  onChange={(e) => setRegisterData({ ...registerData, address_line: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City &amp; State</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="City (e.g. Bengaluru)"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="State (e.g. Karnataka)"
                    value={registerData.state}
                    onChange={(e) => setRegisterData({ ...registerData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>PIN Code</span>
                  <span className="label-hint">6-digit format</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 560001"
                  value={registerData.pincode}
                  onChange={(e) => setRegisterData({ ...registerData, pincode: e.target.value })}
                />
              </div>

              {/* Section 3: Credentials */}
              <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginTop: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={15} /> 3. Security (Argon2 Hashed)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Password <span className="req">*</span></span>
                  <span className="label-hint">Min 8 characters</span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Confirm Password <span className="req">*</span></span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={registerData.confirm_password}
                  onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                <UserPlus size={16} />
                {loading ? 'Creating Account & Argon2 Hashing...' : 'Register Retailer Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
