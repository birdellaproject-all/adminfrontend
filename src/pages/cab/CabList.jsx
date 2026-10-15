// src/pages/cab/CabList.jsx
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Loader2, Car as CarIcon } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function CabList() {
  const [cabs, setCabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cab/list?limit=50`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCabs(json.data?.items || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = cabs.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.vehicleNumber || '').toLowerCase().includes(q) ||
      (c.carName || '').toLowerCase().includes(q) ||
      (c.brand || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="cab-ops-banner">
        <div className="cab-ops-banner-left">
          <div>
            <div className="cab-ops-banner-tags">
              <span className="cab-ops-tag-green">PRODUCT SETUP</span>
              <span className="cab-ops-tag-gray">Cabs</span>
            </div>
            <h2>Cabs</h2>
            <p>All registered cabs across the network.</p>
          </div>
        </div>
        <div className="cab-ops-banner-actions">
          <button className="cab-btn-primary" onClick={load} disabled={loading}>
            {loading ? <><Loader2 size={14} className="cab-spin"/> Refreshing</> : <><RefreshCw size={14}/> Refresh</>}
          </button>
        </div>
      </div>

      <div className="cab-panel">
        <div className="cab-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by vehicle number, name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="cab-loading"><Loader2 size={16} className="cab-spin"/> Loading...</div>
        ) : filtered.length === 0 ? (
          <p className="cab-empty-inline">No cabs found.</p>
        ) : (
          <div className="cab-booking-list">
            {filtered.map(c => (
              <div key={c.id} className="cab-booking-item">
                <div className="cab-booking-head">
                  <b><CarIcon size={12} style={{ display: 'inline', marginRight: 4 }} />{c.vehicleNumber}</b>
                  <span className={`cab-trip-status trip-${(c.status || '').toLowerCase()}`}>
                    {c.status || 'pending'}
                  </span>
                </div>
                <p className="cab-booking-route">{c.carName} · {c.brand} {c.model}</p>
                <p className="cab-booking-meta">
                  {c.cabType} · Driver: {c.driverName || '—'} · ₹{c.price || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}