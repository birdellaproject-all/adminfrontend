// src/pages/bus/ApiMapping.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, CheckCircle2, Zap } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function ApiMapping() {
  const [offlineBuses, setOfflineBuses] = useState([]);
  const [reconciling, setReconciling] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/list?limit=50`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const all = json.data?.items || [];
        const offline = all.filter(b => b.currentTripStatus === 'OFFLINE');
        setOfflineBuses(offline);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleReconcile = async () => {
    if (!window.confirm(`Reconcile ${offlineBuses.length} offline buses?`)) return;
    setReconciling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/reconcile-offline`, {
        method: "POST", headers: getHeaders(),
      });
      const json = await res.json();
      showToast(json.data?.message || 'Reconciled');
      load();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setReconciling(false); }
  };

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div className="bus-ops-banner-icon"><Zap size={18} /></div>
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">OFFLINE SYNC</span>
              <span className="bus-ops-tag-gray">API Mapping</span>
            </div>
            <h2>Offline sync &amp; reconciliation</h2>
            <p>Reconcile crew devices and buses that have gone offline. All changes are audited.</p>
          </div>
        </div>
        <div className="bus-ops-banner-actions">
          <button className="bus-btn-primary" onClick={handleReconcile} disabled={reconciling}>
            {reconciling ? (
              <><Loader2 size={14} className="bus-spin" /> Reconciling...</>
            ) : (
              <><RefreshCw size={14} /> Reconcile all ({offlineBuses.length})</>
            )}
          </button>
        </div>
      </div>

      <div className="bus-panel">
        <h3 style={{ marginTop: 0 }}>Offline buses</h3>
        {offlineBuses.length === 0 ? (
          <p className="bus-empty-inline">✅ All buses are online and synced.</p>
        ) : (
          <div className="bus-booking-list">
            {offlineBuses.map(b => (
              <div key={b.id} className="bus-booking-item">
                <div className="bus-booking-head">
                  <b>{b.busNumber}</b>
                  <span className="bus-trip-status trip-offline">OFFLINE</span>
                </div>
                <p className="bus-booking-route">{b.busName} · {b.fromCity} → {b.toCity}</p>
                <p className="bus-booking-meta">
                  {b.currentDelay ? `${b.currentDelay} min delay · ` : ''}
                  {b.vendorName || 'BMT Direct'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}