// src/pages/Trains.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Train, Search, Download, ArrowRight, RefreshCw, Shield,
  AlertTriangle, CheckCircle2, Activity, TrendingUp, Clock,
  Zap, FileText, ChevronRight, Train as TrainIcon, Loader2,
  Bell, BarChart3, Users, Play, X
} from 'lucide-react';
import './Trains.css';

// ---- Train screens grouped like the screenshot ----
const TRAIN_GROUPS = [
  {
    heading: 'Overview',
    items: ['Command dashboard', 'Executive summary', 'Live operations'],
  },
  {
    heading: 'Partners & distribution',
    items: [
      'Provider 360° control', 'Provider onboarding & KYC',
      'Provider products & listings', 'Provider inventory & rates',
      'Provider bookings & servicing', 'Provider access & security',
      'Provider compliance & audit', 'Change approval queue',
      'Admin supply override', 'Commercial & settlement control',
      'Source mapping & priority', 'Provider certification',
      'Provider cost & quota',
    ],
  },
  {
    heading: 'Operations',
    items: [
      'Trains & schedules', 'Availability', 'Booking creation',
      'PNR monitoring', 'Waitlist & RAC', 'Refunds',
      'Payment reconciliation', 'Passenger rules', 'Search requests',
      'Journey alerts', 'Cancellation', 'Failover',
      'Webhook replay', 'API logs', 'Reports',
    ],
  },
  {
    heading: 'Product setup & content',
    items: [
      'Classes & quotas', 'Stations', 'Fare rules',
      'Product information', 'Product rates', 'Product availability',
      'Amenities & inclusions', 'Product reviews', 'Photos & media',
      'Product documents', 'Product change history',
    ],
  },
];

// ---- Mock dashboard data ----
const TRAIN_STATS = {
  bookingsToday: { value: 228, sub: '96.4% confirmed' },
  grossValue: { value: '₹12.8L', sub: '+8.4% WoW' },
  pnrWatch: { value: 42, sub: '11 waitlisted' },
  apiLatency: { value: '720 ms', sub: 'Backup armed' },
};

const TIMETABLE_ROWS = [
  { id: '12951', name: 'Mumbai Rajdhani', delay: '4 min', rac: 'RAC 8', status: 'On time' },
  { id: '12002', name: 'Shatabdi Express', delay: '16 min', rac: 'RAC 11', status: 'Watch' },
  { id: '22436', name: 'Vande Bharat', delay: '28 min', rac: 'RAC 14', status: 'On time' },
];

const ACTIVITY_ITEMS = [
  { id: 'TRN-9284', text: '12951 · WL moved to RAC', tag: 'Updated', tone: 'info' },
  { id: 'API-294', text: 'Primary latency above SLA', tag: 'Warning', tone: 'warn' },
  { id: 'REF-182', text: 'Cancelled train refunds', tag: 'Action', tone: 'action' },
];

export default function Trains() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeScreen, setActiveScreen] = useState('Command dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [failoverArmed, setFailoverArmed] = useState(false);
  const [stats, setStats] = useState(TRAIN_STATS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [toast, setToast] = useState(null);

  // Small toast helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Sync active screen from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const screen = params.get('screen');
    if (screen) setActiveScreen(screen);
  }, [location.search]);

  // Search filter
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return TRAIN_GROUPS;
    const q = searchTerm.toLowerCase();
    return TRAIN_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [searchTerm]);

  const totalScreens = TRAIN_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

  const handleScreenClick = (screen) => {
    setActiveScreen(screen);
    navigate(`/admin/trains?screen=${encodeURIComponent(screen)}`);
    showToast(`Opened: ${screen}`);
  };

  // ---- Working buttons ----
  const handleCustomReport = () => {
    // Generate a small CSV with the current stats
    const rows = [
      ['Metric', 'Value', 'Detail'],
      ['Bookings Today', stats.bookingsToday.value, stats.bookingsToday.sub],
      ['Gross Value', stats.grossValue.value, stats.grossValue.sub],
      ['PNR Watch', stats.pnrWatch.value, stats.pnrWatch.sub],
      ['API Latency', stats.apiLatency.value, stats.apiLatency.sub],
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trains_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Custom report downloaded');
  };

  const handleOpenOperations = () => {
    navigate('/admin/trains?screen=Live operations');
    setActiveScreen('Live operations');
    showToast('Opened Live operations');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate a refresh with new values
    await new Promise((r) => setTimeout(r, 800));
    setStats({
      bookingsToday: {
        value: 228 + Math.floor(Math.random() * 20 - 10),
        sub: '96.4% confirmed',
      },
      grossValue: {
        value: `₹${(12.8 + (Math.random() * 0.6 - 0.3)).toFixed(1)}L`,
        sub: '+8.4% WoW',
      },
      pnrWatch: {
        value: 42 + Math.floor(Math.random() * 6 - 3),
        sub: '11 waitlisted',
      },
      apiLatency: {
        value: `${700 + Math.floor(Math.random() * 50)} ms`,
        sub: 'Backup armed',
      },
    });
    setLastRefresh(new Date());
    setRefreshing(false);
    showToast('Stats refreshed');
  };

  const handleOpenPriorityWork = () => {
    // Take user to approvals as the priority work queue
    navigate('/admin/approvals');
  };

  const handleArmFailover = () => {
    const next = !failoverArmed;
    setFailoverArmed(next);
    showToast(next ? '✅ Failover armed — backup ready' : 'Failover disarmed');
  };

  const handleActivityClick = (a) => {
    if (a.id.startsWith('TRN-')) navigate('/admin/trains?screen=PNR monitoring');
    else if (a.id.startsWith('API-')) navigate('/admin/service-health');
    else if (a.id.startsWith('REF-')) navigate('/admin/trains?screen=Refunds');
    showToast(`Opening ${a.id}...`);
  };

  const handlePnrWatchChip = () => {
    navigate('/admin/trains?screen=PNR monitoring');
    showToast('Viewing PNR monitoring');
  };

  const handleTimetableRow = (row) => {
    showToast(`Opened train ${row.id} · ${row.name}`);
  };

  const statusClass = (status) => {
    if (status === 'On time') return 'trains-status-ontime';
    if (status === 'Watch') return 'trains-status-watch';
    return 'trains-status-default';
  };

  return (
    <div className="trains-content-area">

      {/* Toast */}
      {toast && (
        <div className="trains-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}

      {/* HERO */}
      <div className="trains-hero">
        <div className="trains-hero-left">
          <div className="trains-hero-icon"><Train size={20} /></div>
          <div>
            <p className="trains-hero-tag">
              VERTICAL COMMAND
              <span className="trains-pill">API</span>
              <span className="trains-pill-muted">{totalScreens} screens</span>
            </p>
            <h1>Trains · Overview</h1>
            <p className="trains-hero-desc">
              Rail search, schedules, quotes, PNR monitoring, cancellation and provider health
            </p>
          </div>
        </div>
        <div className="trains-hero-actions">
          <button className="trains-btn-secondary" onClick={handleCustomReport}>
            <Download size={14} /> Custom report
          </button>
          <button className="trains-btn-primary" onClick={handleOpenOperations}>
            <Zap size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* PREVIEW BANNER */}
      <div className="trains-preview-banner">
        <div className="trains-preview-image">
          <div className="trains-preview-image-inner">
            <TrainIcon size={40} />
          </div>
          <span className="trains-preview-image-tag">Category preview</span>
        </div>
        <div className="trains-preview-text">
          <p className="trains-preview-tag">TRAINS OPERATIONS</p>
          <h2>One vertical. Its own workflow.</h2>
          <p>
            Rail search, schedules, quotes, PNR monitoring, cancellation and provider health.
            Open a workspace below to manage its records.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="trains-stats-grid">
        <button className="trains-stat-card" onClick={() => navigate('/admin/trains?screen=Booking creation')}>
          <div className="trains-stat-head">
            <span>BOOKINGS TODAY</span>
            <Activity size={16} className="text-blue" />
          </div>
          <h2>{stats.bookingsToday.value}</h2>
          <p>{stats.bookingsToday.sub}</p>
        </button>
        <button className="trains-stat-card" onClick={() => navigate('/admin/trains?screen=Payment reconciliation')}>
          <div className="trains-stat-head">
            <span>GROSS VALUE</span>
            <TrendingUp size={16} className="text-purple" />
          </div>
          <h2>{stats.grossValue.value}</h2>
          <p>{stats.grossValue.sub}</p>
        </button>
        <button className="trains-stat-card" onClick={() => navigate('/admin/trains?screen=PNR monitoring')}>
          <div className="trains-stat-head">
            <span>PNR WATCH</span>
            <Clock size={16} className="text-purple" />
          </div>
          <h2>{stats.pnrWatch.value}</h2>
          <p>{stats.pnrWatch.sub}</p>
        </button>
        <button className="trains-stat-card" onClick={() => navigate('/admin/service-health')}>
          <div className="trains-stat-head">
            <span>API LATENCY</span>
            <Zap size={16} className="text-purple" />
          </div>
          <h2>{stats.apiLatency.value}</h2>
          <p>{stats.apiLatency.sub}</p>
        </button>
      </div>

      {/* MAIN SPLIT */}
      <div className="trains-main-grid">

        {/* LEFT: Screens */}
        <div className="trains-screens-panel">
          <div className="trains-screens-header">
            <h3>Trains screens</h3>
            <span className="trains-screens-count">{totalScreens}</span>
          </div>

          <div className="trains-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="trains-screens-clear" onClick={() => setSearchTerm('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="trains-screens-list">
            {filteredGroups.length === 0 ? (
              <p className="trains-screens-empty">No matches</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.heading} className="trains-screens-group">
                  <p className="trains-screens-heading">{group.heading}</p>
                  {group.items.map((screen) => (
                    <div
                      key={screen}
                      className={`trains-screen-item ${activeScreen === screen ? 'active' : ''}`}
                      onClick={() => handleScreenClick(screen)}
                    >
                      <span>{screen}</span>
                      {activeScreen === screen && <ChevronRight size={14} />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Operations */}
        <div className="trains-ops-col">

          {/* Dark banner */}
          <div className="trains-ops-banner">
            <div className="trains-ops-banner-left">
              <div className="trains-ops-banner-icon">
                <TrainIcon size={18} />
              </div>
              <div>
                <div className="trains-ops-banner-tags">
                  <span className="trains-ops-tag-green">Dedicated dashboard</span>
                  <span className="trains-ops-tag-gray">API</span>
                  <span className="trains-ops-tag-muted">
                    Saved · Not changed
                  </span>
                </div>
                <h2>Trains operating command</h2>
                <p>
                  Rail search, schedules, quotes, PNR monitoring, cancellation and provider health
                </p>
              </div>
            </div>
            <div className="trains-ops-banner-actions">
              <button
                className="trains-btn-ghost"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <><Loader2 size={14} className="trains-spin" /> Refreshing...</>
                ) : (
                  <><RefreshCw size={14} /> Refresh</>
                )}
              </button>
              <button className="trains-btn-primary" onClick={handleOpenPriorityWork}>
                Open priority work <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Band cards */}
          <div className="trains-band-grid">
            <button
              className="trains-band-card band-green"
              onClick={() => navigate('/admin/trains?screen=Provider onboarding & KYC')}
            >
              <div className="trains-band-head">
                <span className="trains-band-tag tag-green">Band 1</span>
                <span className="trains-band-status status-orange">Not applicable</span>
              </div>
              <h4>BMT Direct / Vendor supply</h4>
              <p>External-supply vertical; vendor registration is disabled.</p>
            </button>

            <button
              className="trains-band-card band-blue"
              onClick={() => navigate('/admin/trains?screen=Provider APIs')}
            >
              <div className="trains-band-head">
                <span className="trains-band-tag tag-blue">Band 2</span>
                <span className="trains-band-status status-green">Healthy</span>
              </div>
              <h4>Third-party API supply</h4>
              <p>Rail Primary, Rail Backup · certification, mapping, quota, fallback and reconciliation</p>
            </button>

            <button
              className="trains-band-card band-white"
              onClick={() => navigate('/admin/trains?screen=Release center')}
            >
              <div className="trains-band-head">
                <span className="trains-band-tag tag-gray">Release gate</span>
                <span className="trains-band-status status-orange">Enforced</span>
              </div>
              <h4>Eligibility before ranking</h4>
              <p>
                Compliance, sellable availability, canonical deduplication and user sort apply
                before BMT Direct-first ranking.
              </p>
            </button>
          </div>

          {/* Timetable + failover */}
          <div className="trains-lower-grid">
            <div className="trains-panel">
              <div className="trains-panel-header">
                <h3>Timetable, quota &amp; PNR watch</h3>
                <button className="trains-btn-chip" onClick={handlePnrWatchChip}>
                  PNR watch
                </button>
              </div>

              <div className="trains-timetable">
                {TIMETABLE_ROWS.map((row) => (
                  <button
                    key={row.id}
                    className="trains-timetable-row"
                    onClick={() => handleTimetableRow(row)}
                  >
                    <div className="trains-timetable-main">
                      <b>{row.id}</b>
                      <span>· {row.name}</span>
                    </div>
                    <div className="trains-timetable-mid">{row.delay}</div>
                    <div className="trains-timetable-rac">{row.rac}</div>
                    <span className={`trains-timetable-status ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="trains-failover">
              <h3>Provider failover</h3>

              <div className="trains-failover-row">
                <span>Primary success</span>
                <b>96.8%</b>
              </div>
              <div className="trains-progress">
                <div className="trains-progress-fill" style={{ width: '96.8%' }} />
              </div>

              <div className="trains-failover-row">
                <span>Backup readiness</span>
                <b>100%</b>
              </div>
              <div className="trains-progress">
                <div className="trains-progress-fill" style={{ width: '100%' }} />
              </div>

              <button
                className={`trains-btn-arm ${failoverArmed ? 'armed' : ''}`}
                onClick={handleArmFailover}
              >
                {failoverArmed ? (
                  <><CheckCircle2 size={14} /> Failover armed</>
                ) : (
                  <><Play size={14} /> Arm failover</>
                )}
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="trains-activity-grid">
            {ACTIVITY_ITEMS.map((a) => (
              <button
                key={a.id}
                className={`trains-activity-card tone-${a.tone}`}
                onClick={() => handleActivityClick(a)}
              >
                <div className="trains-activity-head">
                  <span className="trains-activity-id">{a.id}</span>
                  <span className={`trains-activity-tag tone-${a.tone}`}>{a.tag}</span>
                </div>
                <p>{a.text}</p>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}