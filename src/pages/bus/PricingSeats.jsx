// src/pages/bus/PricingSeats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Save, Bus as BusIcon } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function PricingSeats() {
  const location = useLocation();
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState(null);

  const mode = location.pathname.includes('seat-pricing') ? 'pricing' : 'inventory';
  const title = mode === 'pricing' ? 'Seat pricing' : 'Seat inventory';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/list?limit=100`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setBuses(json.data?.items || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = buses.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.busNumber || '').toLowerCase().includes(q) ||
      (b.fromCity || '').toLowerCase().includes(q) ||
      (b.toCity || '').toLowerCase().includes(q)
    );
  });

  const handleSave = async (bus) => {
    setEditId(null);
    try {
      const endpoint = mode === 'pricing' ? 'price' : 'availableSeats';
      const value = mode === 'pricing' ? parseFloat(editValue) : parseInt(editValue);
      const res = await fetch(`${API_BASE_URL}/admin/bus/${bus.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ [endpoint]: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBuses(prev => prev.map(b => b.id === bus.id ? { ...b, [endpoint]: value } : b));
      showToast(`✅ Saved`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

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
            <h2>{title}</h2>
            <p>
              {mode === 'pricing'
                ? 'Set and update seat pricing for each bus in the fleet.'
                : 'Manage seat inventory — available, booked, and blocked seats.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bus-panel">
        <div className="bus-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search bus number or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="bus-loading"><Loader2 size={16} className="bus-spin" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <p className="bus-empty-inline">No buses found.</p>
        ) : (
          <div className="bus-booking-list">
            {filtered.map(bus => (
              <div key={bus.id} className="bus-booking-item">
                <div className="bus-booking-head">
                  <b><BusIcon size={12} style={{ display: 'inline', marginRight: 4 }} />{bus.busNumber}</b>
                  <span className={`bus-trip-status trip-${(bus.status || '').toLowerCase()}`}>
                    {bus.status || 'pending'}
                  </span>
                </div>
                <p className="bus-booking-route">{bus.fromCity} → {bus.toCity}</p>

                {mode === 'pricing' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748b', minWidth: 90 }}>
                      Price: ₹{bus.price || 0}
                    </span>
                    {editId === bus.id ? (
                      <>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            padding: '4px 8px', borderRadius: 6,
                            border: '1px solid #cbd5e1', fontSize: 12, width: 100,
                          }}
                          autoFocus
                        />
                        <button
                          className="bus-btn-primary"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleSave(bus)}
                        >
                          <Save size={11} /> Save
                        </button>
                        <button
                          className="bus-btn-secondary"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="bus-btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => { setEditId(bus.id); setEditValue(bus.price || 0); }}
                      >
                        Edit price
                      </button>
                    )}
                  </div>
                )}

                {mode === 'inventory' && (
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Total: <b style={{ color: '#0f172a' }}>{bus.totalSeats || 0}</b>
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Available: <b style={{ color: '#166534' }}>{bus.availableSeats || 0}</b>
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Booked: <b style={{ color: '#b45309' }}>
                        {(bus.totalSeats || 0) - (bus.availableSeats || 0)}
                      </b>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}