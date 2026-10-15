// src/pages/cab/CommandDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, RefreshCw, ArrowRight, MapPin, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

// Mock zones — will be replaced with live API
const ZONES = [
  { name: 'T1', requests: 8, cabs: 12, active: true },
  { name: 'T2', requests: 11, cabs: 13 },
  { name: 'Railway', requests: 14, cabs: 14 },
  { name: 'City', requests: 17, cabs: 15 },
  { name: 'Gurugram', requests: 20, cabs: 16 },
  { name: 'Noida', requests: 23, cabs: 17 },
  { name: 'Jaipur', requests: 26, cabs: 18 },
  { name: 'Pune', requests: 29, cabs: 19 },
  { name: 'Goa', requests: 32, cabs: 20 },
];

const ACTIVITY = [
  { id: 'CAB-1927', text: 'Jaipur Airport · SOS active', tag: 'Critical', tone: 'critical' },
  { id: 'CAB-1924', text: 'Mumbai T2 · driver arriving', tag: 'Arriving', tone: 'arriving' },
  { id: 'CAB-1918', text: 'Delhi T3 · assignment pending', tag: 'Open', tone: 'open' },
];

export default function CommandDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedZone, setSelectedZone] = useState('T1');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cab/stats`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      {toast && <div className="cab-toast"><CheckCircle2 size={14} /> {toast}</div>}

      {/* Dark banner */}
      <div className="cab-ops-banner">
        <div className="cab-ops-banner-left">
          <div className="cab-ops-banner-icon"><Car size={18} /></div>
          <div>
            <div className="cab-ops-banner-tags">
              <span className="cab-ops-tag-green">Dedicated dashboard</span>
              <span className="cab-ops-tag-gray">Direct + API</span>
              <span className="cab-ops-tag-muted">Saved · Not changed</span>
            </div>
            <h2>Cabs operating command</h2>
            <p>Fleet, owners, drivers, nearby demand, dispatch, live trips and safety</p>
          </div>
        </div>
        <div className="cab-ops-banner-actions">
          <button className="cab-btn-ghost" onClick={load} disabled={loading}>
            {loading ? <><Loader2 size={14} className="cab-spin"/> Refresh</> : <><RefreshCw size={14}/> Refresh</>}
          </button>
          <button className="cab-btn-primary" onClick={() => navigate('/admin/cabs/bookings')}>
            Open priority work <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Band cards */}
      <div className="cab-band-grid">
        <button className="cab-band-card band-green" onClick={() => navigate('/admin/cabs/vendor-onboarding')}>
          <div className="cab-band-head">
            <span className="cab-band-tag tag-green">Band 1</span>
            <span className="cab-band-status status-green">Live</span>
          </div>
          <h4>BMT Direct / Vendor supply</h4>
          <p>BMT Direct Cab · onboarding, KYC, inventory, finance and go-live</p>
        </button>
        <button className="cab-band-card band-blue" onClick={() => navigate('/admin/cabs/vendor-products')}>
          <div className="cab-band-head">
            <span className="cab-band-tag tag-blue">Band 2</span>
            <span className="cab-band-status status-green">Healthy</span>
          </div>
          <h4>Third-party API supply</h4>
          <p>CarTrawler, Amadeus Cars · certification, mapping, quota, fallback and reconciliation</p>
        </button>
        <button className="cab-band-card band-white" onClick={() => navigate('/admin/cabs/admin-supply')}>
          <div className="cab-band-head">
            <span className="cab-band-tag tag-gray">Release gate</span>
            <span className="cab-band-status status-orange">Enforced</span>
          </div>
          <h4>Eligibility before ranking</h4>
          <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
        </button>
      </div>

      {/* Lower grid: zones + safety */}
      <div className="cab-lower-grid">
        {/* Fleet & demand zones */}
        <div className="cab-panel">
          <div className="cab-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Live fleet &amp; demand zones</h3>
            <button className="cab-btn-chip" onClick={() => showToast('Dispatch board opened')}>
              Dispatch
            </button>
          </div>

          <div className="cab-zones-grid">
            {ZONES.map(z => (
              <button
                key={z.name}
                className={`cab-zone-card ${selectedZone === z.name || z.active ? 'active' : ''}`}
                onClick={() => setSelectedZone(z.name)}
              >
                <div className="cab-zone-icon"><MapPin size={12} /></div>
                <div className="cab-zone-name">{z.name}</div>
                <p className="cab-zone-stats">{z.requests} requests · {z.cabs} cars</p>
              </button>
            ))}
          </div>
        </div>

        {/* Driver & safety */}
        <div className="cab-panel">
          <h3>Driver &amp; safety control</h3>

          <div className="cab-panel-mini">
            <h4>DRIVERS ONLINE</h4>
            <div className="cab-side-num">{stats?.driversOnline?.value ?? 684}</div>
            <p className="cab-side-sub">48 completing trips</p>
          </div>

          <div className="cab-panel-mini">
            <h4>ASSIGNMENT SLA</h4>
            <div className="cab-side-num">42 sec</div>
            <p className="cab-side-sub">P95 88 sec</p>
          </div>

          <div className="cab-sos-alert">
            <div className="cab-sos-title">
              <AlertTriangle size={14} /> 1 active SOS
            </div>
            <p className="cab-sos-desc">CAB-1927 · Jaipur Airport</p>
            <button className="cab-sos-btn" onClick={() => showToast('Opening response room...')}>
              Open response room
            </button>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="cab-activity-grid">
        {ACTIVITY.map(a => (
          <button
            key={a.id}
            className="cab-activity-card"
            onClick={() => showToast(`Opening ${a.id}`)}
          >
            <div className="cab-activity-head">
              <span className="cab-activity-id">{a.id}</span>
              <span className={`cab-activity-tag tone-${a.tone}`}>{a.tag}</span>
            </div>
            <p>{a.text}</p>
          </button>
        ))}
      </div>
    </>
  );
}