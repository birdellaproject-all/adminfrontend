// src/pages/bus/ChangeApproval.jsx
import React, { useState, useEffect } from 'react';
import { Search, Check, X, Loader2, CheckCircle2 } from 'lucide-react';

const VENDOR_API_BASE = "https://bmtvendorfinal.onrender.com/api/vendor";

export default function ChangeApproval() {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

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
        const pending = (json.vendors || []).filter(v => v.status === 'PENDING');
        setVendors(pending);
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

  const handleApprove = async (v) => {
    const id = v._id || v.id;
    const name = v.businessName || v.name;
    if (!window.confirm(`Approve "${name}"?`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${VENDOR_API_BASE}/auth/approve-vendor/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVendors(prev => prev.filter(x => x._id !== id && x.id !== id));
      showToast(`✅ ${name} approved`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setActionId(null); }
  };

  const handleReject = async (v) => {
    const id = v._id || v.id;
    const name = v.businessName || v.name;
    if (!window.confirm(`Reject "${name}"?`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${VENDOR_API_BASE}/auth/reject-vendor/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVendors(prev => prev.filter(x => x._id !== id && x.id !== id));
      showToast(`Rejected ${name}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setActionId(null); }
  };

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">MAKER-CHECKER GOVERNANCE</span>
              <span className="bus-ops-tag-gray">Buses</span>
            </div>
            <h2>Change approval queue</h2>
            <p>Pending bus vendor applications awaiting approval. Same flow as Approval Center.</p>
          </div>
        </div>
      </div>

      <div className="bus-panel">
        <div className="bus-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="bus-empty-inline">No pending changes.</p>
        ) : (
          <div className="bus-booking-list">
            {filtered.map(v => {
              const id = v._id || v.id;
              return (
                <div key={id} className="bus-booking-item">
                  <div className="bus-booking-head">
                    <b>{v.businessName || v.name || 'Unnamed'}</b>
                    <span className="bus-trip-status trip-pending">{v.status}</span>
                  </div>
                  <p className="bus-booking-route">{v.email}</p>
                  <p className="bus-booking-meta">{v.city}, {v.country} · {v.vertical} operator</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button
                      className="bus-btn-secondary"
                      style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={() => handleReject(v)}
                      disabled={actionId === id}
                    >
                      <X size={12} /> Reject
                    </button>
                    <button
                      className="bus-btn-primary"
                      style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={() => handleApprove(v)}
                      disabled={actionId === id}
                    >
                      {actionId === id ? (
                        <><Loader2 size={12} className="bus-spin" /> Approving...</>
                      ) : (
                        <><Check size={12} /> Approve</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}