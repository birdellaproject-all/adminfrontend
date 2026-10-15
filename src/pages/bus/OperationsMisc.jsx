// src/pages/bus/OperationsMisc.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, FileText, RefreshCw } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

const MODE_INFO = {
  'cancellation': { title: 'Cancellation & refunds', desc: 'Cancelled bookings, refunds issued and pending refunds.' },
  'promotions': { title: 'Promotions', desc: 'Active promo codes and discount campaigns.' },
  'reviews': { title: 'Reviews', desc: 'Customer reviews and ratings.' },
  'webhook-replay': { title: 'Webhook replay', desc: 'Replay webhook events for failed or missed callbacks.' },
  'reports': { title: 'Reports', desc: 'Downloadable operational and financial reports.' },
};

export default function OperationsMisc() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    const p = location.pathname;
    return Object.keys(MODE_INFO).find(k => p.includes(k)) || 'reports';
  }, [location.pathname]);

  const info = MODE_INFO[mode];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    async function load() {
      try {
        if (mode === 'cancellation') {
          const res = await fetch(`${API_BASE_URL}/admin/bus/bookings/list?bookingStatus=CANCELLED&limit=50`, { headers: getHeaders() });
          if (res.ok) {
            const json = await res.json();
            setBookings(json.data?.items || []);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [mode]);

  const filtered = bookings.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.bookingId || '').toLowerCase().includes(q) ||
      (b.passengerName || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">OPERATIONS</span>
              <span className="bus-ops-tag-gray">Buses</span>
            </div>
            <h2>{info.title}</h2>
            <p>{info.desc}</p>
          </div>
        </div>
        {mode === 'webhook-replay' && (
          <div className="bus-ops-banner-actions">
            <button className="bus-btn-primary" onClick={() => showToast('Replaying webhooks...')}>
              <RefreshCw size={14} /> Replay failed
            </button>
          </div>
        )}
        {mode === 'reports' && (
          <div className="bus-ops-banner-actions">
            <button className="bus-btn-primary" onClick={() => showToast('Generating report...')}>
              <FileText size={14} /> Generate report
            </button>
          </div>
        )}
      </div>

      <div className="bus-panel">
        {mode === 'cancellation' ? (
          <>
            <div className="bus-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search cancelled bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="bus-loading"><Loader2 size={16} className="bus-spin" /> Loading...</div>
            ) : filtered.length === 0 ? (
              <p className="bus-empty-inline">No cancelled bookings found.</p>
            ) : (
              <div className="bus-booking-list">
                {filtered.map(b => (
                  <div key={b.id} className="bus-booking-item">
                    <div className="bus-booking-head">
                      <b>{b.bookingId || '—'}</b>
                      <span className="bus-trip-status trip-cancelled">CANCELLED</span>
                    </div>
                    <p className="bus-booking-route">{b.fromCity} → {b.toCity} · {b.passengerName}</p>
                    <p className="bus-booking-meta">₹{b.totalAmount?.toLocaleString() || 0} · {b.cancelReason || 'No reason'}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="bus-empty-inline">
            {info.title} — Ready to be built. All buttons and data will connect to the backend.
          </p>
        )}
      </div>
    </>
  );
}