// src/pages/bus/VendorControl.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, RefreshCw, ShieldCheck, Check, X, Loader2, CheckCircle2 } from 'lucide-react';

const VENDOR_API_BASE = "https://bmtvendorfinal.onrender.com/api/vendor";

export default function VendorControl() {
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const title = (() => {
    const p = location.pathname;
    if (p.includes('onboarding')) return 'Vendor Onboarding & KYC';
    if (p.includes('products')) return 'Vendor Products & Listings';
    if (p.includes('inventory')) return 'Vendor Inventory & Rates';
    if (p.includes('access')) return 'Vendor Access & Security';
    if (p.includes('compliance')) return 'Vendor Compliance & Audit';
    if (p.includes('admin-supply')) return 'Admin Supply Override';
    if (p.includes('commercial')) return 'Commercial & Settlement Control';
    return 'Vendor 360° Control';
  })();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${VENDOR_API_BASE}/auth/vendors`);
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.vendors || []).filter(v =>
          v.vertical === 'bus' || (v.services || []).includes('bus')
        );
        setVendors(list);
        setSelected(list[0] || null);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  const filtered = vendors.filter(v => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (v.businessName || '').toLowerCase().includes(q) ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q)
    );
  });

  const handleApprove = async (vendor) => {
    const id = vendor._id || vendor.id;
    const name = vendor.businessName || vendor.name;
    if (!window.confirm(`Approve "${name}"?`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${VENDOR_API_BASE}/auth/approve-vendor/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVendors(prev => prev.map(v => (v._id === id || v.id === id) ? { ...v, status: 'APPROVED' } : v));
      showToast(`✅ ${name} approved`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setActionId(null); }
  };

  const handleReject = async (vendor) => {
    const id = vendor._id || vendor.id;
    const name = vendor.businessName || vendor.name;
    if (!window.confirm(`Reject "${name}"?`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${VENDOR_API_BASE}/auth/reject-vendor/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVendors(prev => prev.map(v => (v._id === id || v.id === id) ? { ...v, status: 'REJECTED' } : v));
      showToast(`Rejected ${name}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setActionId(null); }
  };

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-vendor-banner">
        <div className="bus-vendor-banner-left">
          <div className="bus-vendor-banner-icon"><ShieldCheck size={18} /></div>
          <div>
            <p className="bus-vendor-banner-tag">EXACT PARTNER ADMINISTRATION</p>
            <h2>{title}</h2>
            <p>Search and control one exact bus operator, its profile, products, access, operations and risk.</p>
          </div>
        </div>
        <div className="bus-vendor-banner-right">
          <span className="bus-vendor-chip">Global Platform Administration</span>
          <span className="bus-vendor-chip">Direct + API</span>
          <button className="bus-btn-secondary"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="bus-vendor-split">
        <div className="bus-panel">
          <h3>Partner directory</h3>
          <div className="bus-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search name, ID, city or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bus-vendor-list">
            {filtered.slice(0, 15).map(v => {
              const id = v._id || v.id;
              return (
                <button
                  key={id}
                  className={`bus-vendor-row ${selected?._id === id ? 'active' : ''}`}
                  onClick={() => setSelected(v)}
                >
                  <div className="bus-vendor-row-head">
                    <b>{v.businessName || v.name || 'Unnamed'}</b>
                    <span className={`bus-vendor-dot ${v.status === 'APPROVED' ? 'dot-green' : v.status === 'PENDING' ? 'dot-orange' : 'dot-red'}`} />
                  </div>
                  <p>{id?.slice(-8)} · {v.city || 'N/A'}, {v.country || 'India'}</p>
                  <div className="bus-vendor-tags">
                    <span className="bus-band-tag tag-green">BMT Direct</span>
                    <span className={`bus-band-tag ${v.status === 'PENDING' ? 'tag-orange' : 'tag-green'}`}>{v.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="bus-panel">
            <div className="bus-booking-detail-head">
              <div>
                <b>{selected._id || selected.id}</b>
                <h3>{selected.businessName || selected.name}</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>
                  {selected.city}, {selected.country} · {selected.vertical} operator
                </p>
              </div>
              <div className="bus-booking-detail-actions">
                {selected.status === 'PENDING' && (
                  <>
                    <button
                      className="bus-btn-secondary"
                      onClick={() => handleReject(selected)}
                      disabled={actionId === (selected._id || selected.id)}
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      className="bus-btn-primary"
                      onClick={() => handleApprove(selected)}
                      disabled={actionId === (selected._id || selected.id)}
                    >
                      {actionId === (selected._id || selected.id) ? (
                        <><Loader2 size={14} className="bus-spin" /> Approving...</>
                      ) : (
                        <><Check size={14} /> Approve</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bus-money-grid">
              <div className="bus-money-card">
                <span>ONBOARDING</span>
                <b>{selected.onboardingProgress ?? 100}%</b>
              </div>
              <div className="bus-money-card">
                <span>BUSES</span>
                <b>{selected.busDetails?.totalBuses || 0}</b>
              </div>
              <div className="bus-money-card">
                <span>STATUS</span>
                <b>{selected.status}</b>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, margin: '0 0 8px 0', color: '#0f172a' }}>Business &amp; verification</h4>
              <div className="bus-money-grid">
                <div className="bus-money-card">
                  <span>PUBLIC NAME</span>
                  <b style={{ fontSize: 13 }}>{selected.businessName || '—'}</b>
                </div>
                <div className="bus-money-card">
                  <span>CONTACT</span>
                  <b style={{ fontSize: 13 }}>{selected.name || '—'}</b>
                </div>
                <div className="bus-money-card">
                  <span>BUSINESS EMAIL</span>
                  <b style={{ fontSize: 13 }}>{selected.businessEmail || selected.email || '—'}</b>
                </div>
                <div className="bus-money-card">
                  <span>LICENCE</span>
                  <b style={{ fontSize: 13 }}>Verified</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}