// src/pages/cab/Drivers.jsx
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Users } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/cab/drivers`, { headers: getHeaders() });
        if (res.ok) {
          const json = await res.json();
          setDrivers(json.data?.items || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = drivers.filter(d => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (d.driverName || '').toLowerCase().includes(q) ||
      (d.driverPhone || '').toLowerCase().includes(q) ||
      (d.vehicleNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="cab-ops-banner">
        <div className="cab-ops-banner-left">
          <div>
            <div className="cab-ops-banner-tags">
              <span className="cab-ops-tag-green">OPERATIONS</span>
              <span className="cab-ops-tag-gray">Cabs</span>
            </div>
            <h2>Drivers</h2>
            <p>All active drivers, their cab assignments and contact details.</p>
          </div>
        </div>
      </div>

      <div className="cab-panel">
        <div className="cab-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by name, phone or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="cab-loading"><Loader2 size={16} className="cab-spin"/> Loading drivers...</div>
        ) : filtered.length === 0 ? (
          <p className="cab-empty-inline">No drivers found.</p>
        ) : (
          <div className="cab-booking-list">
            {filtered.map(d => (
              <div key={d.id} className="cab-booking-item">
                <div className="cab-booking-head">
                  <b><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{d.driverName}</b>
                  <span className="cab-trip-status trip-confirmed">Active</span>
                </div>
                <p className="cab-booking-route">
                  {d.driverPhone} · {d.vehicleNumber} · {d.cabType}
                </p>
                <p className="cab-booking-meta">
                  License: {d.driverLicense || '—'} · {d.experienceYears} yrs · {d.baseLocation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}