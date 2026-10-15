// src/pages/bus/BusesList.jsx
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function BusesList() {
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/list?limit=30`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setBuses(json.data?.items || []);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/sync-vendor`, {
        method: "POST", headers: getHeaders(),
      });
      const json = await res.json();
      showToast(json.data?.message || 'Synced');
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setSyncing(false); }
  };

  const filtered = buses.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.busNumber || '').toLowerCase().includes(q) ||
      (b.busName || '').toLowerCase().includes(q) ||
      (b.fromCity || '').toLowerCase().includes(q) ||
      (b.toCity || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">PRODUCT SETUP &amp; CONTENT</span>
              <span className="bus-ops-tag-gray">Buses</span>
            </div>
            <h2>Buses</h2>
            <p>All registered bus inventory. Sync pulls latest data from the vendor API.</p>
          </div>
        </div>
        <div className="bus-ops-banner-actions">
          <button className="bus-btn-primary" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <><Loader2 size={14} className="bus-spin" /> Syncing...</>
            ) : (
              <><RefreshCw size={14} /> Sync from vendor</>
            )}
          </button>
        </div>
      </div>

      <div className="bus-panel">
        <div className="bus-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search bus number, name or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="bus-empty-inline">No buses found. Try syncing from the vendor API.</p>
        ) : (
          <div className="bus-booking-list">
            {filtered.map(b => (
              <div key={b.id} className="bus-booking-item">
                <div className="bus-booking-head">
                  <b>{b.busNumber}</b>
                  <span className={`bus-trip-status trip-${(b.status || '').toLowerCase()}`}>{b.status || 'pending'}</span>
                </div>
                <p className="bus-booking-route">{b.busName} · {b.fromCity} → {b.toCity}</p>
                <p className="bus-booking-meta">
                  {b.busType} · {b.totalSeats} seats · ₹{b.price || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}