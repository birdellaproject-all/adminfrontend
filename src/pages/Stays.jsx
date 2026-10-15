// src/pages/Stays.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bed, Play, Download, RefreshCw, ChevronRight, Search,
  ChevronDown
} from 'lucide-react';
import './Stays.css';

// ---- Stay screens nav groups (shown INSIDE the page, matching the screenshot) ----
const STAYS_GROUPS = [
  { heading: 'Overview', items: ['Command dashboard', 'Executive summary', 'Live operations'] },
  { heading: 'Partners & distribution', items: [
    'Vendor 360° control', 'Vendor onboarding & KYC',
    'Vendor products & listings', 'Vendor inventory & rates',
    'Vendor bookings & servicing', 'Vendor access & security',
    'Vendor compliance & audit', 'Change approval queue',
    'Admin supply override', 'Commercial & settlement control',
    'Source mapping & priority', 'Vendor applications',
  ]},
  { heading: 'Operations', items: [
    'Property onboarding', 'All properties', 'Reservations',
    'Overbooking recovery', 'Payment & payouts', 'Property groups',
    'Property types', 'Photos & content', 'Housekeeping',
    'Check-in/out', 'Guest messaging', 'Channel mapping',
    'API certification', 'Webhook replay', 'Reviews',
    'Sponsored listings', 'Duplicate resolution', 'Search ranking', 'Reports',
  ]},
  { heading: 'Product setup & content', items: [
    'Rooms & units', 'Rate plans', 'Inventory calendar',
    'Occupancy rules', 'Restrictions', 'Taxes & fees',
    'Amenities', 'Policies', 'Product information',
    'Product reviews', 'Photos & media', 'Product documents',
    'Product change history',
  ]},
];

export default function Stays() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sidebar-in-page state
  const [activeScreen, setActiveScreen] = useState('Command dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isListOpen, setIsListOpen] = useState(true);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  const goToScreen = (screenName) => {
    setActiveScreen(screenName);
  };

  // Filter the screens list by the search box
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return STAYS_GROUPS;
    const q = searchTerm.toLowerCase();
    return STAYS_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [searchTerm]);

  // ---- Download custom report ----
  const handleCustomReport = () => {
    const rows = [
      ['BirdMyTrip · Stays Overview'],
      ['Generated', new Date().toISOString()],
      [''],
      ['Metric', 'Value', 'Detail'],
      ['Live properties', '1,284', '46 awaiting go-live'],
      ['Bookings today', '642', '94.8% confirmed'],
      ['Sellable units', '28,642', '86% available'],
      ['Gross value', '₹72.4L', '+18.2% WoW'],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stays_overview_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="st-content-area">

      {/* Header banner */}
      <div className="st-banner">
        <div className="st-banner-left">
          <div className="st-banner-icon"><Bed size={20} /></div>
          <div>
            <div className="st-banner-tag-row">
              <span className="st-banner-tag">VERTICAL COMMAND</span>
              <span className="st-banner-chip">Direct + API</span>
              <span className="st-banner-chip gray">45 screens</span>
            </div>
            <h1>Stays · Overview</h1>
            <p>Every accommodation type, property, room, rate, reservation and payout operation</p>
          </div>
        </div>
        <div className="st-banner-actions">
          <button className="st-btn-secondary" onClick={handleCustomReport}>
            <Download size={14} /> Custom report
          </button>
          <button className="st-btn-primary" onClick={() => goToScreen('Vendor bookings & servicing')}>
            <Play size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* Category banner */}
      <div className="st-category-banner">
        <div className="st-category-image" />
        <div className="st-category-content">
          <p className="st-category-eyebrow">STAYS OPERATIONS</p>
          <h2>One vertical. Its own workflow.</h2>
          <p>Every accommodation type, property, room, rate, reservation and payout operation. Open a workspace below to manage its records.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="st-stats-grid">
        <div className="st-stat-card">
          <div className="st-stat-header"><span>LIVE PROPERTIES</span><div className="st-stat-icon"><Bed size={16} /></div></div>
          <h3>1,284</h3><p>46 awaiting go-live</p>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-header"><span>BOOKINGS TODAY</span><div className="st-stat-icon"><Bed size={16} /></div></div>
          <h3>642</h3><p>94.8% confirmed</p>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-header"><span>SELLABLE UNITS</span><div className="st-stat-icon"><Bed size={16} /></div></div>
          <h3>28,642</h3><p>86% available</p>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-header"><span>GROSS VALUE</span><div className="st-stat-icon"><Bed size={16} /></div></div>
          <h3>₹72.4L</h3><p>+18.2% WoW</p>
        </div>
      </div>

      {/* ============ Main two-column: Screens panel + Dashboard ============ */}
      <div className="st-main-grid">

        {/* LEFT: Stays screens panel */}
        <div className="st-screens-panel">
          <div className="st-screens-header">
            <h3>Stays screens</h3>
            <span className="st-screens-count">45</span>
          </div>

          <div className="st-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="st-screens-toggle"
            onClick={() => setIsListOpen(!isListOpen)}
          >
            <ChevronDown
              size={14}
              className={`st-chevron ${isListOpen ? 'open' : ''}`}
            />
            <span>{isListOpen ? 'Collapse screens' : 'Expand screens'}</span>
          </button>

          {isListOpen && (
            <div className="st-screens-list">
              {filteredGroups.length === 0 ? (
                <p className="st-screens-empty">No matches</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.heading} className="st-screens-group">
                    <p className="st-screens-heading">{group.heading}</p>
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className={`st-screens-item ${activeScreen === item ? 'active' : ''}`}
                        onClick={() => setActiveScreen(item)}
                      >
                        <span>{item}</span>
                        {activeScreen === item && <ChevronRight size={14} />}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Dashboard */}
        <div className="st-dashboard">

          {/* Operating command banner */}
          <div className="st-op-banner">
            <div className="st-op-banner-left">
              <div className="st-op-icon"><Bed size={22} /></div>
              <div>
                <div className="st-op-tags">
                  <span className="st-op-tag-cyan">Dedicated dashboard</span>
                  <span className="st-op-tag-dark">Direct + API</span>
                  <span className="st-op-tag-muted">Saved · Not changed</span>
                </div>
                <h2>Stays operating command</h2>
                <p>Every accommodation type, property, room, rate, reservation and payout operation</p>
              </div>
            </div>
            <div className="st-op-banner-actions">
              <button className="st-op-btn-secondary" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh
              </button>
              <button className="st-op-btn-primary" onClick={() => goToScreen('Property onboarding')}>
                Open priority work <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 3 supply cards */}
          <div className="st-supply-grid">
            <div className="st-supply-card">
              <div className="st-supply-top">
                <span className="st-band-tag band-1">Band 1</span>
                <span className="st-band-status live">Live</span>
              </div>
              <h4>BMT Direct / Vendor supply</h4>
              <p>BMT Direct Stay · onboarding, KYC, inventory, finance and go-live</p>
            </div>
            <div className="st-supply-card">
              <div className="st-supply-top">
                <span className="st-band-tag band-2">Band 2</span>
                <span className="st-band-status healthy">Healthy</span>
              </div>
              <h4>Third-party API supply</h4>
              <p>Hotelbeds, TBO Holidays, Expedia Rapid · certification, mapping, quota, fallback and reconciliation</p>
            </div>
            <div className="st-supply-card">
              <div className="st-supply-top">
                <span className="st-band-tag gate">Release gate</span>
                <span className="st-band-status enforced">Enforced</span>
              </div>
              <h4>Eligibility before ranking</h4>
              <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
            </div>
          </div>

          {/* Funnel + Sellability */}
          <div className="st-two-col">
            <div className="st-panel">
              <h3>Property activation funnel</h3>
              <div className="st-funnel">
                <div className="st-funnel-row" onClick={() => goToScreen('Vendor applications')}>
                  <div className="st-funnel-num">128</div>
                  <div className="st-funnel-label">Application</div>
                  <ChevronRight size={14} className="st-chevron" />
                </div>
                <div className="st-funnel-row" onClick={() => goToScreen('Vendor onboarding & KYC')}>
                  <div className="st-funnel-num">82</div>
                  <div className="st-funnel-label">KYC / bank</div>
                  <ChevronRight size={14} className="st-chevron" />
                </div>
                <div className="st-funnel-row" onClick={() => goToScreen('Photos & content')}>
                  <div className="st-funnel-num">64</div>
                  <div className="st-funnel-label">Content &amp; rooms</div>
                  <ChevronRight size={14} className="st-chevron" />
                </div>
                <div className="st-funnel-row" onClick={() => goToScreen('Property onboarding')}>
                  <div className="st-funnel-num">46</div>
                  <div className="st-funnel-label">Go-live review</div>
                  <ChevronRight size={14} className="st-chevron" />
                </div>
              </div>
            </div>

            <div className="st-panel">
              <div className="st-panel-header">
                <h3>7-day room sellability</h3>
                <button className="st-btn-calendar" onClick={() => goToScreen('Inventory calendar')}>
                  Open calendar
                </button>
              </div>
              <div className="st-sellability-grid">
                <div className="st-sellability-cell"><span className="st-day">M</span><b>86%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell"><span className="st-day">T</span><b>82%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell"><span className="st-day">W</span><b>78%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell"><span className="st-day">T</span><b>74%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell"><span className="st-day">F</span><b>70%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell weekend"><span className="st-day">S</span><b>66%</b><span className="st-sellable-label">sellable</span></div>
                <div className="st-sellability-cell weekend"><span className="st-day">S</span><b>62%</b><span className="st-sellable-label">sellable</span></div>
              </div>

              <div className="st-ops-flags">
                <div className="st-ops-flag"><span className="st-ops-label">ARRIVALS</span><b>184</b><span className="st-ops-sub">12 attention</span></div>
                <div className="st-ops-flag"><span className="st-ops-label">HOUSEKEEPING</span><b>92%</b><span className="st-ops-sub">38 rooms open</span></div>
                <div className="st-ops-flag"><span className="st-ops-label">UNMAPPED</span><b>17</b><span className="st-ops-sub">rooms / rates</span></div>
              </div>
            </div>
          </div>

          {/* Queue items */}
          <div className="st-queue-grid">
            <div className="st-queue-item arriving" onClick={() => goToScreen('Reservations')}>
              <div className="st-queue-top">
                <span className="st-queue-id">STY-4182</span>
                <span className="st-queue-tag arriving">Arriving</span>
              </div>
              <p>Lake View Palace · 2 arrivals</p>
            </div>
            <div className="st-queue-item review" onClick={() => goToScreen('Channel mapping')}>
              <div className="st-queue-top">
                <span className="st-queue-id">MAP-881</span>
                <span className="st-queue-tag review">Review</span>
              </div>
              <p>Saffron Houseboat · room mapping</p>
            </div>
            <div className="st-queue-item warning" onClick={() => goToScreen('Inventory calendar')}>
              <div className="st-queue-top">
                <span className="st-queue-id">INV-219</span>
                <span className="st-queue-tag warning">Warning</span>
              </div>
              <p>Aravali Heritage · stale inventory</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}