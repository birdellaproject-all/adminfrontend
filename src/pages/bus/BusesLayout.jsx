// src/pages/bus/BusesLayout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bus, Download, Zap, Search, ChevronRight, X, TrendingUp, Users, DollarSign } from 'lucide-react';
import './BusesLayout.css';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

// ---- Screen navigation map ----
const BUS_SCREENS = [
  { heading: 'Overview', items: [
    { label: 'Command dashboard', path: '/admin/buses' }
  ]},
  { heading: 'Partners & distribution', items: [
    { label: 'Vendor 360° control', path: '/admin/buses/vendor-360' },
    { label: 'Vendor onboarding & KYC', path: '/admin/buses/vendor-onboarding' },
    { label: 'Vendor products & listings', path: '/admin/buses/vendor-products' },
    { label: 'Vendor inventory & rates', path: '/admin/buses/vendor-inventory' },
    { label: 'Vendor bookings & servicing', path: '/admin/buses/vendor-bookings' },
    { label: 'Vendor access & security', path: '/admin/buses/vendor-access' },
    { label: 'Vendor compliance & audit', path: '/admin/buses/vendor-compliance' },
    { label: 'Change approval queue', path: '/admin/buses/change-approval' },
    { label: 'Admin supply override', path: '/admin/buses/admin-supply' },
    { label: 'Commercial & settlement control', path: '/admin/buses/commercial' },
    { label: 'Source mapping & priority', path: '/admin/buses/source-mapping' },
    { label: 'Provider certification', path: '/admin/buses/provider-cert' },
    { label: 'Provider cost & quota', path: '/admin/buses/provider-cost' },
  ]},
  { heading: 'Operations', items: [
    { label: 'Bookings', path: '/admin/buses/bookings' },
    { label: 'Cancellation & refunds', path: '/admin/buses/cancellation' },
    { label: 'Promotions', path: '/admin/buses/promotions' },
    { label: 'Reviews', path: '/admin/buses/reviews' },
    { label: 'API mapping', path: '/admin/buses/api-mapping' },
    { label: 'Webhook replay', path: '/admin/buses/webhook-replay' },
    { label: 'Reports', path: '/admin/buses/reports' },
  ]},
  { heading: 'Product setup & content', items: [
    { label: 'Buses', path: '/admin/buses/list' },
    { label: 'Routes', path: '/admin/buses/routes' },
    { label: 'Stops', path: '/admin/buses/stops' },
    { label: 'Seat pricing', path: '/admin/buses/seat-pricing' },
    { label: 'Seat inventory', path: '/admin/buses/seat-inventory' },
    { label: 'Boarding points', path: '/admin/buses/boarding-points' },
    { label: 'Drop points', path: '/admin/buses/drop-points' },
    { label: 'Product information', path: '/admin/buses/product-information' },
    { label: 'Amenities & inclusions', path: '/admin/buses/amenities' },
    { label: 'Product reviews', path: '/admin/buses/product-reviews' },
    { label: 'Photos & media', path: '/admin/buses/photos-media' },
    { label: 'Policies', path: '/admin/buses/policies' },
    { label: 'Product documents', path: '/admin/buses/product-documents' },
    { label: 'Product change history', path: '/admin/buses/product-change-history' },
  ]},
];

const TOTAL_SCREENS = BUS_SCREENS.reduce((s, g) => s + g.items.length, 0);

export default function BusesLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/bus/stats`, { headers: getHeaders() });
        if (!res.ok) return;
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error("Stats error:", err);
      }
    }
    load();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return BUS_SCREENS;
    const q = searchTerm.toLowerCase();
    return BUS_SCREENS
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [searchTerm]);

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value', 'Detail'],
      ['Trips Today', stats?.tripsToday?.value || 0, stats?.tripsToday?.subValue || ''],
      ['Seat Occupancy', stats?.seatOccupancy?.value || '0%', stats?.seatOccupancy?.subValue || ''],
      ['Crew on Duty', stats?.crewOnDuty?.value || 0, stats?.crewOnDuty?.subValue || ''],
      ['Gross Value', stats?.grossValue?.value || '₹0', stats?.grossValue?.subValue || ''],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buses_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bus-content-area">

      {/* HERO */}
      <div className="bus-hero">
        <div className="bus-hero-left">
          <div className="bus-hero-icon"><Bus size={20} /></div>
          <div>
            <p className="bus-hero-tag">
              VERTICAL COMMAND
              <span className="bus-pill">Direct + API</span>
              <span className="bus-pill-muted">{TOTAL_SCREENS} screens</span>
            </p>
            <h1>Buses · Overview</h1>
            <p className="bus-hero-desc">
              Operators, vehicles, routes, seat inventory, trips, crew and realtime operations
            </p>
          </div>
        </div>
        <div className="bus-hero-actions">
          <button className="bus-btn-secondary" onClick={handleExport}>
            <Download size={14} /> Custom report
          </button>
          <button className="bus-btn-primary" onClick={() => navigate('/admin/buses/live')}>
            <Zap size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="bus-stats-grid">
        <button className="bus-stat-card" onClick={() => navigate('/admin/buses/bookings')}>
          <div className="bus-stat-head"><span>TRIPS TODAY</span><TrendingUp size={16} className="text-orange" /></div>
          <h2>{stats?.tripsToday?.value ?? 486}</h2>
          <p>{stats?.tripsToday?.subValue || '92% on time'}</p>
        </button>
        <button className="bus-stat-card" onClick={() => navigate('/admin/bus/list')}>
          <div className="bus-stat-head"><span>SEAT OCCUPANCY</span><Users size={16} className="text-orange" /></div>
          <h2>{stats?.seatOccupancy?.value || '72%'}</h2>
          <p>{stats?.seatOccupancy?.subValue || '8,942 open'}</p>
        </button>
        <button className="bus-stat-card" onClick={() => navigate('/admin/buses/vendor-compliance')}>
          <div className="bus-stat-head"><span>CREW ON DUTY</span><Users size={16} className="text-orange" /></div>
          <h2>{stats?.crewOnDuty?.value ?? 684}</h2>
          <p>{stats?.crewOnDuty?.subValue || '7 offline'}</p>
        </button>
        <button className="bus-stat-card" onClick={() => navigate('/admin/buses/vendor-inventory')}>
          <div className="bus-stat-head"><span>GROSS VALUE</span><DollarSign size={16} className="text-orange" /></div>
          <h2>{stats?.grossValue?.value || '₹28.6L'}</h2>
          <p>{stats?.grossValue?.subValue || '+14.2% WoW'}</p>
        </button>
      </div>

      {/* MAIN SPLIT */}
      <div className="bus-main-grid">
        {/* Sidebar */}
        <div className="bus-screens-panel">
          <div className="bus-screens-header">
            <h3>Buses screens</h3>
            <span className="bus-screens-count">{TOTAL_SCREENS}</span>
          </div>
          <div className="bus-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="bus-screens-clear" onClick={() => setSearchTerm('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="bus-screens-list">
            {filteredGroups.map(group => (
              <div key={group.heading} className="bus-screens-group">
                <p className="bus-screens-heading">{group.heading}</p>
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <div
                      key={item.label}
                      className={`bus-screen-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="bus-ops-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}