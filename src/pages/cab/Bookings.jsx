// src/pages/cab/Bookings.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [listRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/cab/bookings/list?limit=50`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/admin/cab/bookings/stats`, { headers: getHeaders() }),
        ]);

        if (!listRes.ok) throw new Error(`List failed (${listRes.status})`);
        if (!statsRes.ok) throw new Error(`Stats failed (${statsRes.status})`);

        const listJson = await listRes.json();
        const statsJson = await statsRes.json();

        const items = listJson.data?.items || [];
        setBookings(items);
        setStats(statsJson.data);
        setSelected(items[0] || null);
      } catch (err) {
        console.error("[Cab Bookings] load error:", err);
        setError(err.message);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = bookings.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.bookingId || '').toLowerCase().includes(q) ||
      (b.customer?.name || '').toLowerCase().includes(q) ||
      (b.customer?.phone || '').toLowerCase().includes(q) ||
      (b.vehicleNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="cab-ops-banner">
        <div className="cab-ops-banner-left">
          <div>
            <div className="cab-ops-banner-tags">
              <span className="cab-ops-tag-green">Operational canvas</span>
              <span className="cab-ops-tag-gray">Cabs</span>
              <span className="cab-band-tag tag-green">1 · BMT Direct</span>
              <span className="cab-band-tag tag-blue">2 · Third-party API</span>
            </div>
            <h2>Bookings</h2>
            <p>Customer bookings, supplier confirmation, payment, fulfillment, route and vehicle.</p>
          </div>
        </div>
        <div className="cab-ops-banner-actions">
          <button className="cab-btn-ghost"><Filter size={14}/> Filters</button>
          <button className="cab-btn-primary"><Plus size={14}/> Service order</button>
        </div>
      </div>

      {/* Stats */}
      <div className="cab-stats-grid">
        <div className="cab-stat-card" style={{ cursor: 'default' }}>
          <div className="cab-stat-head"><span>TOTAL BOOKINGS</span></div>
          <h2>{stats?.total ?? 0}</h2>
          <p>All time</p>
        </div>
        <div className="cab-stat-card" style={{ cursor: 'default' }}>
          <div className="cab-stat-head"><span>CONFIRMED</span></div>
          <h2>{stats?.byStatus?.confirmed ?? 0}</h2>
          <p>Active</p>
        </div>
        <div className="cab-stat-card" style={{ cursor: 'default' }}>
          <div className="cab-stat-head"><span>PENDING</span></div>
          <h2>{stats?.byStatus?.pending ?? 0}</h2>
          <p>Awaiting action</p>
        </div>
        <div className="cab-stat-card" style={{ cursor: 'default' }}>
          <div className="cab-stat-head"><span>REVENUE</span></div>
          <h2>{stats?.revenue?.totalFormatted || '₹0'}</h2>
          <p>From confirmed/completed</p>
        </div>
      </div>

      {error && (
        <div className="cab-panel" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c' }}>
            <AlertTriangle size={16} />
            <div>
              <b style={{ display: 'block', fontSize: 13 }}>Could not load bookings</b>
              <span style={{ fontSize: 12 }}>{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="cab-booking-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Left: list */}
        <div className="cab-panel">
          <div className="cab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search bookings by ID, customer, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="cab-loading"><Loader2 size={16} className="cab-spin"/> Loading...</div>
          ) : filtered.length === 0 ? (
            <p className="cab-empty-inline">No bookings found.</p>
          ) : (
            <div className="cab-booking-list">
              {filtered.map(b => (
                <div
                  key={b.id}
                  className="cab-booking-item"
                  onClick={() => setSelected(b)}
                  style={{
                    borderColor: selected?.id === b.id ? '#a7f3d0' : undefined,
                    background: selected?.id === b.id ? '#ecfdf5' : undefined,
                  }}
                >
                  <div className="cab-booking-head">
                    <b>{b.bookingId || 'BOOKING'}</b>
                    <span className={`cab-trip-status trip-${(b.bookingStatus || '').toLowerCase()}`}>
                      {b.bookingStatus || 'PENDING'}
                    </span>
                  </div>
                  <p className="cab-booking-route">
                    {b.fromCity} → {b.toCity} · {b.customer?.name || 'Guest'}
                  </p>
                  <p className="cab-booking-meta">
                    {b.vehicleNumber || 'CAB'} · ₹{(b.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div className="cab-panel">
          {selected ? (
            <>
              <h3 style={{ marginBottom: 4 }}>{selected.bookingId}</h3>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                {selected.customer?.name} · {selected.customer?.phone}
              </p>

              <div className="cab-money-grid">
                <div className="cab-money-card">
                  <span>TRIP</span>
                  <b style={{ fontSize: 13 }}>{selected.fromCity} → {selected.toCity}</b>
                </div>
                <div className="cab-money-card">
                  <span>VEHICLE</span>
                  <b style={{ fontSize: 13 }}>{selected.vehicleNumber || '—'}</b>
                </div>
                <div className="cab-money-card">
                  <span>DRIVER</span>
                  <b style={{ fontSize: 13 }}>{selected.driverDetails?.name || '—'}</b>
                </div>
              </div>

              <div className="cab-money-grid" style={{ marginTop: 10 }}>
                <div className="cab-money-card">
                  <span>GROSS</span>
                  <b>₹{(selected.totalAmount || 0).toLocaleString()}</b>
                </div>
                <div className="cab-money-card">
                  <span>SUPPLIER</span>
                  <b>₹{((selected.totalAmount || 0) * 0.85).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
                </div>
                <div className="cab-money-card">
                  <span>MARGIN</span>
                  <b>₹{((selected.totalAmount || 0) * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
                </div>
              </div>
            </>
          ) : (
            <p className="cab-empty-inline">Select a booking to view details.</p>
          )}
        </div>
      </div>
    </>
  );
}