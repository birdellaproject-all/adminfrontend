// src/pages/bus/RoutesStops.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, MapPin, Plus, Loader2, CheckCircle2, ChevronRight, Bus } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function RoutesStops() {
  const location = useLocation();
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    const p = location.pathname;
    if (p.includes('routes')) return 'routes';
    if (p.includes('stops')) return 'stops';
    if (p.includes('boarding')) return 'boarding';
    if (p.includes('drop')) return 'drop';
    return 'routes';
  }, [location.pathname]);

  const title = {
    routes: 'Routes',
    stops: 'Stops',
    boarding: 'Boarding points',
    drop: 'Drop points',
  }[mode];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/bus/list?limit=100`, { headers: getHeaders() });
        if (res.ok) {
          const json = await res.json();
          setBuses(json.data?.items || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Build rows based on mode
  const rows = useMemo(() => {
    const map = new Map();
    buses.forEach(b => {
      if (mode === 'routes' && b.fromCity && b.toCity) {
        const key = `${b.fromCity}→${b.toCity}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            primary: `${b.fromCity} → ${b.toCity}`,
            secondary: b.routeName || 'Standard route',
            count: 1,
          });
        } else {
          map.get(key).count += 1;
        }
      }
      if (mode === 'stops' && b.viaCities?.length) {
        b.viaCities.forEach(city => {
          if (!map.has(city)) {
            map.set(city, { id: city, primary: city, secondary: 'Via city', count: 1 });
          } else {
            map.get(city).count += 1;
          }
        });
      }
      if (mode === 'boarding' && b.boardingPoints) {
        b.boardingPoints.forEach(p => {
          const key = p.location || 'Unnamed';
          if (!map.has(key)) {
            map.set(key, { id: key, primary: key, secondary: p.time || '', count: 1 });
          } else {
            map.get(key).count += 1;
          }
        });
      }
      if (mode === 'drop' && b.droppingPoints) {
        b.droppingPoints.forEach(p => {
          const key = p.location || 'Unnamed';
          if (!map.has(key)) {
            map.set(key, { id: key, primary: key, secondary: p.time || '', count: 1 });
          } else {
            map.get(key).count += 1;
          }
        });
      }
    });
    return Array.from(map.values());
  }, [buses, mode]);

  const filtered = rows.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return r.primary.toLowerCase().includes(q) || r.secondary.toLowerCase().includes(q);
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
            <h2>{title}</h2>
            <p>
              {mode === 'routes' && 'All unique routes across the bus network.'}
              {mode === 'stops' && 'All intermediate stops between origin and destination.'}
              {mode === 'boarding' && 'Boarding points where passengers are picked up.'}
              {mode === 'drop' && 'Drop points where passengers are dropped off.'}
            </p>
          </div>
        </div>
        <div className="bus-ops-banner-actions">
          <button className="bus-btn-primary" onClick={() => showToast('Add new')}>
            <Plus size={14} /> Add {title.slice(0, -1)}
          </button>
        </div>
      </div>

      <div className="bus-panel">
        <div className="bus-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="bus-loading"><Loader2 size={16} className="bus-spin" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <p className="bus-empty-inline">No {title.toLowerCase()} found.</p>
        ) : (
          <div className="bus-booking-list">
            {filtered.map(r => (
              <div key={r.id} className="bus-booking-item">
                <div className="bus-booking-head">
                  <b><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{r.primary}</b>
                  <span className="bus-band-tag tag-blue">{r.count} trips</span>
                </div>
                {r.secondary && <p className="bus-booking-route">{r.secondary}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}