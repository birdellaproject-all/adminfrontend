// src/pages/cab/CabsLayout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Car, Download, Zap, Search, ChevronRight, X, TrendingUp, Users, MapPin, DollarSign } from 'lucide-react';
import './CabsLayout.css';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

// ---- Screens from the sidebar screenshots ----
const CAB_SCREENS = [
  { heading: 'Overview', items: [
    { label: 'Command dashboard', path: '/admin/cabs' },
  ]},
  { heading: 'Partners & distribution', items: [
    { label: 'Vendor 360° control', path: '/admin/cabs/vendor-360' },
    { label: 'Vendor onboarding & KYC', path: '/admin/cabs/vendor-onboarding' },
    { label: 'Vendor products & listings', path: '/admin/cabs/vendor-products' },
    { label: 'Vendor inventory & rates', path: '/admin/cabs/vendor-inventory' },
    { label: 'Vendor bookings & servicing', path: '/admin/cabs/vendor-bookings' },
    { label: 'Vendor access & security', path: '/admin/cabs/vendor-access' },
    { label: 'Vendor compliance & audit', path: '/admin/cabs/vendor-compliance' },
    { label: 'Change approval queue', path: '/admin/cabs/change-approval' },
    { label: 'Admin supply override', path: '/admin/cabs/admin-supply' },
    { label: 'Commercial & settlement control', path: '/admin/cabs/commercial' },
    { label: 'Source mapping & priority', path: '/admin/cabs/source-mapping' },
    { label: 'Provider certification', path: '/admin/cabs/provider-cert' },
    { label: 'Provider cost & quota', path: '/admin/cabs/provider-cost' },
  ]},
  { heading: 'Operations', items: [
    { label: 'Owner onboarding', path: '/admin/cabs/owner-onboarding' },
    { label: 'Drivers', path: '/admin/cabs/drivers' },
    { label: 'Nearby requests', path: '/admin/cabs/nearby-requests' },
    { label: 'Dispatch board', path: '/admin/cabs/dispatch' },
    { label: 'Live fleet map', path: '/admin/cabs/live-fleet' },
    { label: 'Live trips', path: '/admin/cabs/live-trips' },
    { label: 'Safety & SOS', path: '/admin/cabs/safety' },
    { label: 'Earnings & payouts', path: '/admin/cabs/earnings' },
    { label: 'Fleet companies', path: '/admin/cabs/fleet-companies' },
    { label: 'Independent owners', path: '/admin/cabs/independent-owners' },
    { label: 'Driver KYC', path: '/admin/cabs/driver-kyc' },
    { label: 'Documents', path: '/admin/cabs/documents' },
    { label: 'Shifts', path: '/admin/cabs/shifts' },
    { label: 'Surge controls', path: '/admin/cabs/surge' },
    { label: 'Zones & airports', path: '/admin/cabs/zones' },
    { label: 'Pickup OTP', path: '/admin/cabs/pickup-otp' },
    { label: 'Driver app control', path: '/admin/cabs/driver-app' },
    { label: 'Bookings', path: '/admin/cabs/bookings' },
    { label: 'Cancellations & refunds', path: '/admin/cabs/cancellation' },
    { label: 'Promotions', path: '/admin/cabs/promotions' },
    { label: 'Reviews', path: '/admin/cabs/reviews' },
    { label: 'API mapping', path: '/admin/cabs/api-mapping' },
    { label: 'Webhook replay', path: '/admin/cabs/webhook-replay' },
    { label: 'Reports', path: '/admin/cabs/reports' },
  ]},
  { heading: 'Product setup & content', items: [
    { label: 'Vehicles', path: '/admin/cabs/vehicles' },
    { label: 'Fare rules', path: '/admin/cabs/fare-rules' },
    { label: 'Product information', path: '/admin/cabs/product-information' },
    { label: 'Product rates', path: '/admin/cabs/product-rates' },
    { label: 'Product availability', path: '/admin/cabs/product-availability' },
    { label: 'Amenities & inclusions', path: '/admin/cabs/amenities' },
    { label: 'Product reviews', path: '/admin/cabs/product-reviews' },
    { label: 'Photos & media', path: '/admin/cabs/photos-media' },
    { label: 'Product documents', path: '/admin/cabs/product-documents' },
    { label: 'Product change history', path: '/admin/cabs/product-change-history' },
  ]},
];

const TOTAL_SCREENS = CAB_SCREENS.reduce((s, g) => s + g.items.length, 0);

export default function CabsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hide hero + stats on some pages for cleaner view
  const hideHeroAndStats = useMemo(() => {
    const p = location.pathname;
    return (
      p.includes('vendor-') ||
      p.includes('change-approval') ||
      p.includes('admin-supply') ||
      p.includes('commercial') ||
      p.includes('source-mapping') ||
      p.includes('provider-')
    );
  }, [location.pathname]);

  useEffect(() => {
    if (hideHeroAndStats) return;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/cab/stats`, { headers: getHeaders() });
        if (!res.ok) return;
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error("Cab stats error:", err);
      }
    }
    load();
  }, [hideHeroAndStats]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return CAB_SCREENS;
    const q = searchTerm.toLowerCase();
    return CAB_SCREENS
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [searchTerm]);

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value', 'Detail'],
      ['Drivers Online', stats?.driversOnline?.value || 0, stats?.driversOnline?.subValue || ''],
      ['Trips Active', stats?.tripsActive?.value || 0, stats?.tripsActive?.subValue || ''],
      ['Nearby Requests', stats?.nearbyRequests?.value || 0, stats?.nearbyRequests?.subValue || ''],
      ['Gross Value', stats?.grossValue?.value || '₹0', stats?.grossValue?.subValue || ''],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cabs_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cab-content-area">

      {!hideHeroAndStats && (
        <>
          <div className="cab-hero">
            <div className="cab-hero-left">
              <div className="cab-hero-icon"><Car size={20} /></div>
              <div>
                <p className="cab-hero-tag">
                  VERTICAL COMMAND
                  <span className="cab-pill">Direct + API</span>
                  <span className="cab-pill-muted">{TOTAL_SCREENS} screens</span>
                </p>
                <h1>Cabs · Overview</h1>
                <p className="cab-hero-desc">
                  Fleet, owners, drivers, nearby demand, dispatch, live trips and safety
                </p>
              </div>
            </div>
            <div className="cab-hero-actions">
              <button className="cab-btn-secondary" onClick={handleExport}>
                <Download size={14} /> Custom report
              </button>
              <button className="cab-btn-primary" onClick={() => navigate('/admin/cabs/live-fleet')}>
                <Zap size={14} /> Open operations
              </button>
            </div>
          </div>

          <div className="cab-stats-grid">
            <button className="cab-stat-card" onClick={() => navigate('/admin/cabs/drivers')}>
              <div className="cab-stat-head"><span>DRIVERS ONLINE</span><Users size={16} className="text-green" /></div>
              <h2>{stats?.driversOnline?.value ?? 684}</h2>
              <p>{stats?.driversOnline?.subValue || '923 verified'}</p>
            </button>
            <button className="cab-stat-card" onClick={() => navigate('/admin/cabs/live-trips')}>
              <div className="cab-stat-head"><span>TRIPS ACTIVE</span><TrendingUp size={16} className="text-green" /></div>
              <h2>{stats?.tripsActive?.value ?? 218}</h2>
              <p>{stats?.tripsActive?.subValue || '94% on time'}</p>
            </button>
            <button className="cab-stat-card" onClick={() => navigate('/admin/cabs/nearby-requests')}>
              <div className="cab-stat-head"><span>NEARBY REQUESTS</span><MapPin size={16} className="text-green" /></div>
              <h2>{stats?.nearbyRequests?.value ?? 36}</h2>
              <p>{stats?.nearbyRequests?.subValue || '50 km radius'}</p>
            </button>
            <button className="cab-stat-card" onClick={() => navigate('/admin/cabs/earnings')}>
              <div className="cab-stat-head"><span>GROSS VALUE</span><DollarSign size={16} className="text-green" /></div>
              <h2>{stats?.grossValue?.value || '₹18.4L'}</h2>
              <p>{stats?.grossValue?.subValue || '+21.6% WoW'}</p>
            </button>
          </div>
        </>
      )}

      <div className="cab-main-grid">
        {/* Sidebar */}
        <div className="cab-screens-panel">
          <div className="cab-screens-header">
            <h3>Cabs screens</h3>
            <span className="cab-screens-count">{TOTAL_SCREENS}</span>
          </div>
          <div className="cab-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="cab-screens-clear" onClick={() => setSearchTerm('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="cab-screens-list">
            {filteredGroups.map(group => (
              <div key={group.heading} className="cab-screens-group">
                <p className="cab-screens-heading">{group.heading}</p>
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <div
                      key={item.label}
                      className={`cab-screen-item ${isActive ? 'active' : ''}`}
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

        <div className="cab-ops-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}