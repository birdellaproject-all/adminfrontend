// src/pages/bus/CommandDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, RefreshCw, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function CommandDashboard() {
  const navigate = useNavigate();
  const [departures, setDepartures] = useState([]);
  const [crew, setCrew] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try {
      const [depRes, crewRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/bus/live-departures`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/admin/bus/crew-status`, { headers: getHeaders() }),
      ]);
      if (depRes.ok) {
        const json = await depRes.json();
        setDepartures(json.data?.items || []);
      }
      if (crewRes.ok) {
        const json = await crewRes.json();
        setCrew(json.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleReconcile = async () => {
    if (!window.confirm("Reconcile all offline buses?")) return;
    setActionId('reconcile');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/reconcile-offline`, {
        method: "POST", headers: getHeaders(),
      });
      const json = await res.json();
      showToast(json.data?.message || 'Reconciled');
      // Redirect to Offline sync (mapped to api-mapping page)
      navigate('/admin/buses/api-mapping');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setActionId(null); }
  };

  const handlePriorityWork = () => {
    navigate('/admin/buses/bookings');
  };

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      {/* Dark banner */}
      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div className="bus-ops-banner-icon"><Bus size={18} /></div>
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">Dedicated dashboard</span>
              <span className="bus-ops-tag-gray">Direct + API</span>
              <span className="bus-ops-tag-muted">Saved · Not changed</span>
            </div>
            <h2>Buses operating command</h2>
            <p>Operators, vehicles, routes, seat inventory, trips, crew and realtime operations</p>
          </div>
        </div>
        <div className="bus-ops-banner-actions">
          <button className="bus-btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="bus-btn-primary" onClick={handlePriorityWork}>
            Open priority work <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Band cards */}
      <div className="bus-band-grid">
        <button className="bus-band-card band-green" onClick={() => navigate('/admin/buses/vendor-onboarding')}>
          <div className="bus-band-head">
            <span className="bus-band-tag tag-green">Band 1</span>
            <span className="bus-band-status status-green">Live</span>
          </div>
          <h4>BMT Direct / Vendor supply</h4>
          <p>BMT Direct Bus · onboarding, KYC, inventory, finance and go-live</p>
        </button>
        <button className="bus-band-card band-blue" onClick={() => navigate('/admin/buses/vendor-products')}>
          <div className="bus-band-head">
            <span className="bus-band-tag tag-blue">Band 2</span>
            <span className="bus-band-status status-green">Healthy</span>
          </div>
          <h4>Third-party API supply</h4>
          <p>RedBus, AbhiBus · certification, mapping, quota, fallback and reconciliation</p>
        </button>
        <button className="bus-band-card band-white" onClick={() => navigate('/admin/buses/admin-supply')}>
          <div className="bus-band-head">
            <span className="bus-band-tag tag-gray">Release gate</span>
            <span className="bus-band-status status-orange">Enforced</span>
          </div>
          <h4>Eligibility before ranking</h4>
          <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
        </button>
      </div>

      {/* Live departures + side column */}
      <div className="bus-lower-grid">
        <div className="bus-panel">
          <div className="bus-panel-header">
            <h3>Live departure control</h3>
            <button className="bus-btn-chip">All trips</button>
          </div>
          <div className="bus-departures">
            {departures.length === 0 ? (
              <p className="bus-empty-inline">No active departures.</p>
            ) : departures.map(d => (
              <div key={d.id} className="bus-departure-row">
                <div className="bus-departure-main">
                  <b>{d.busNumber}</b>
                  <span>{d.route}</span>
                </div>
                <div className="bus-departure-time">{d.departureTime}</div>
                <span className={`bus-trip-status trip-${(d.status || '').toLowerCase()}`}>{d.status}</span>
                <div className="bus-departure-seats">{d.occupancy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bus-side-col">
          <div className="bus-panel">
            <h3>CREW ON DUTY</h3>
            <h2 className="bus-side-num">{crew?.total ?? 684}</h2>
            <p className="bus-side-sub">{crew?.offline || 7} devices offline</p>
          </div>
          <div className="bus-panel">
            <h3>QR VERIFIED</h3>
            <h2 className="bus-side-num">96.8%</h2>
            <p className="bus-side-sub">18 manual checks</p>
          </div>
          <button className="bus-btn-reconcile" onClick={handleReconcile} disabled={actionId === 'reconcile'}>
            {actionId === 'reconcile' ? (
              <><Loader2 size={14} className="bus-spin" /> Reconciling...</>
            ) : (
              <><RefreshCw size={14} /> Reconcile offline events</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}