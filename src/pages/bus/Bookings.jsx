// src/pages/bus/Bookings.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, CheckCircle2 } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/bus/bookings/list?limit=30`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          setBookings(json.data?.items || []);
        }
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  const filtered = bookings.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.bookingId || '').toLowerCase().includes(q) ||
      (b.passengerName || '').toLowerCase().includes(q) ||
      (b.pnr || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">Operational canvas</span>
              <span className="bus-ops-tag-gray">Buses</span>
              <span className="bus-band-tag tag-green">1 · BMT Direct</span>
              <span className="bus-band-tag tag-blue">2 · Third-party API</span>
            </div>
            <h2>Bookings</h2>
            <p>Bookings controls customer order for Buses: customer, supplier confirmation, payment, fulfillment, route, vehicle.</p>
          </div>
        </div>
        <div className="bus-ops-banner-actions">
          <button className="bus-btn-ghost"><Filter size={14}/> Filters</button>
          <button className="bus-btn-primary"><Plus size={14}/> Service order</button>
        </div>
      </div>

      <div className="bus-booking-filters">
        {['Customer','Supplier confirmation','Payment','Fulfillment','Route','Vehicle'].map(tag => (
          <button key={tag} className="bus-chip">{tag}</button>
        ))}
      </div>

      <div className="bus-booking-split">
        <div className="bus-panel">
          <div className="bus-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search bookings by ID, customer or order"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bus-booking-list">
            {filtered.length === 0 ? (
              <p className="bus-empty-inline">No bookings found.</p>
            ) : filtered.map(b => (
              <div key={b.id} className="bus-booking-item">
                <div className="bus-booking-head">
                  <b>{b.busNumber || 'BUS-XXX'}</b>
                  <span className={`bus-trip-status trip-${(b.bookingStatus || '').toLowerCase()}`}>
                    {b.bookingStatus}
                  </span>
                </div>
                <p className="bus-booking-route">{b.fromCity} → {b.toCity} · {b.passengerName}</p>
                <p className="bus-booking-meta">User Web · ₹{b.totalAmount?.toLocaleString() || 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bus-panel">
          {bookings[0] ? (
            <>
              <div className="bus-booking-detail-head">
                <div>
                  <b>BUS-{bookings[0].busNumber}</b>
                  <h3>{bookings[0].fromCity} → {bookings[0].toCity}</h3>
                </div>
                <div className="bus-booking-detail-actions">
                  <button className="bus-btn-secondary">Full record</button>
                  <button className="bus-btn-primary">Service order</button>
                </div>
              </div>

              <div className="bus-timeline">
                {['Created','Paid','Confirmed','Issued','Completed'].map((label, i) => (
                  <div key={label} className={`bus-timeline-row ${i < 2 ? 'done' : ''}`}>
                    <span className={`bus-timeline-dot ${i < 2 ? 'done' : ''}`}>
                      {i < 2 ? <CheckCircle2 size={12} /> : i + 1}
                    </span>
                    <div>
                      <b>{label}</b>
                      <span>Actor, reference and timestamp retained</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bus-money-grid">
                <div className="bus-money-card">
                  <span>GROSS</span>
                  <b>₹{(bookings[0].totalAmount || 12840).toLocaleString()}</b>
                </div>
                <div className="bus-money-card">
                  <span>SUPPLIER NET</span>
                  <b>₹{((bookings[0].totalAmount || 12840) * 0.85).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
                </div>
                <div className="bus-money-card">
                  <span>MARGIN</span>
                  <b>₹{((bookings[0].totalAmount || 12840) * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
                </div>
              </div>
            </>
          ) : (
            <p className="bus-empty-inline">No booking selected.</p>
          )}
        </div>
      </div>
    </>
  );
}