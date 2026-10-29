import React, { useState } from 'react';
import { 
  X, 
  Store, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Edit3, 
  Save, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Sparkles,
  Database
} from 'lucide-react';
import { updateUserProfile, setStoredUser, clearStoredAuth, getStoredToken } from '../../services/api';

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

export default function ProfileModal({ isOpen, onClose, user, onUpdateUser, onLogout }) {
  if (!isOpen || !user) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    organization: user.organization || '',
    shop_name: user.shop_name || '',
    business_type: user.business_type || 'Retail shop',
    gst_number: user.gst_number || '',
    address_line: user.address_line || '',
    city: user.city || '',
    state: user.state || '',
    pincode: user.pincode || '',
    preferred_tone: user.preferred_tone || 'Friendly',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const token = getStoredToken();
    if (!token) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const updatedUser = await updateUserProfile(formData, token);
      setStoredUser(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      setSuccessMsg('Shop profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearStoredAuth();
    if (onLogout) onLogout();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 44, height: 44 }}>
              <Store size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 19 }}>{user.shop_name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span>{user.business_type}</span>
                <span>•</span>
                <span>Retailer ID: #{user.id}</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Database size={12} /> MongoDB
                </span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isEditing && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={13} /> Edit Profile
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

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

        {/* View Mode */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              background: 'var(--bg-input)', 
              borderRadius: 12, 
              padding: 18, 
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16
            }}>
              <div>
                <span className="label-hint">Retailer Name</span>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-main)' }}>{user.full_name}</strong>
              </div>
              <div>
                <span className="label-hint">Login Email</span>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)' }}>{user.email}</strong>
              </div>
              <div>
                <span className="label-hint">Contact Phone</span>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)' }}>{user.phone}</strong>
              </div>
              <div>
                <span className="label-hint">Organization</span>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)' }}>{user.organization || 'Individual Retailer'}</strong>
              </div>
              <div>
                <span className="label-hint">GSTIN</span>
                <strong style={{ display: 'block', fontSize: 14, color: user.gst_number ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                  {user.gst_number || 'Not Registered'}
                </strong>
              </div>
              <div>
                <span className="label-hint">Default Copywriting Tone</span>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--accent-primary)' }}>
                  {user.preferred_tone || 'Friendly'}
                </strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span className="label-hint">Store Location &amp; Address</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)' }}>
                  {[user.address_line, user.city, user.state, user.pincode].filter(Boolean).join(', ') || 'No address specified'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> Account registered: {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSignOut}
                style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Retailer Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shop / Business Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Type</label>
                <select
                  className="select-field"
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Copy Tone</label>
                <select
                  className="select-field"
                  value={formData.preferred_tone}
                  onChange={(e) => setFormData({ ...formData, preferred_tone: e.target.value })}
                >
                  <option value="Friendly">Friendly</option>
                  <option value="Professional">Professional</option>
                  <option value="Premium">Premium</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Urgent / Persuasive">Urgent / Persuasive</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Address Line</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City &amp; State</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="6 digits"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                <Save size={14} />
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
