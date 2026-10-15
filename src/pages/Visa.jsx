// src/pages/Visa.jsx
import React, { useState, useMemo } from 'react';
import { FileText, Play, Download, RefreshCw, ChevronRight, ChevronDown, Search } from 'lucide-react';
import './Visa.css';

// ---- Visa screens nav groups (shown INSIDE the page) ----
const VISA_GROUPS = [
  { heading: 'Overview', items: ['Command dashboard', 'Executive summary', 'Live operations'] },
  { heading: 'Partners & distribution', items: [
    'Provider 360° control', 'Provider onboarding & KYC',
    'Provider products & listings', 'Provider inventory & rates',
    'Provider bookings & servicing', 'Provider access & security',
    'Provider compliance & audit', 'Change approval queue',
    'Admin supply override', 'Commercial & settlement control',
    'Source mapping & priority',
  ]},
  { heading: 'Operations', items: [
    'Country rules', 'Service partners', 'Eligibility checks',
    'Document checklists', 'Appointments', 'Status tracking',
    'Cancellation & refunds', 'Rule provider certification',
    'Requirements', 'Fee tables', 'Case stages',
    'Embassy submission', 'Customer notifications',
    'Payment reconciliation', 'Webhook replay', 'API logs', 'Reports',
  ]},
  { heading: 'Product setup & content', items: [
    'Applications', 'Document review', 'Product information',
    'Product units', 'Photos & media', 'Policies',
    'Product documents', 'Product change history',
  ]},
];

export default function Visa() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-page screens panel
  const [activeScreen, setActiveScreen] = useState('Command dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isListOpen, setIsListOpen] = useState(true);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  const goToScreen = (screenName) => setActiveScreen(screenName);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return VISA_GROUPS;
    const q = searchTerm.toLowerCase();
    return VISA_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [searchTerm]);

  // ---- Custom report ----
  const handleCustomReport = () => {
    const rows = [
      ['BirdMyTrip · Visa Overview'],
      ['Generated', new Date().toISOString()],
      [''],
      ['Metric', 'Value', 'Detail'],
      ['Active cases', '842', '48 countries'],
      ['Submitted today', '118', '96% complete'],
      ['Appointments', '64', 'Next 7 days'],
      ['Service value', '₹6.8L', '+9.2% WoW'],
      [''],
      ['Application case pipeline'],
      ['Intake', '184', ''],
      ['Documents', '128', ''],
      ['Submitted', '82', ''],
      ['Embassy', '46', ''],
      ['Decision', '28', ''],
      [''],
      ['Appointment & SLA'],
      ['Appointments', '64', 'next 7 days'],
      ['Rules freshness', '99.8%', '48 countries'],
      [''],
      ['Queue items'],
      ['VIS-8421', 'Ready', 'UAE · ready to submit'],
      ['VIS-8392', 'Action', 'France · document re-upload'],
      ['APT-182', 'Upcoming', 'UK biometrics · tomorrow'],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `visa_overview_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vs-content-area">

      {/* Header banner */}
      <div className="vs-banner">
        <div className="vs-banner-left">
          <div className="vs-banner-icon"><FileText size={20} /></div>
          <div>
            <div className="vs-banner-tag-row">
              <span className="vs-banner-tag">VERTICAL COMMAND</span>
              <span className="vs-banner-chip">API</span>
              <span className="vs-banner-chip gray">37 screens</span>
            </div>
            <h1>Visa · Overview</h1>
            <p>Rules, eligibility, document packets, applications, appointments and submission tracking</p>
          </div>
        </div>
        <div className="vs-banner-actions">
          <button className="vs-btn-secondary" onClick={handleCustomReport}>
            <Download size={14} /> Custom report
          </button>
          <button className="vs-btn-primary" onClick={() => goToScreen('Applications')}>
            <Play size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* Category banner */}
      <div className="vs-category-banner">
        <div className="vs-category-image" />
        <div className="vs-category-content">
          <p className="vs-category-eyebrow">VISA OPERATIONS</p>
          <h2>One vertical. Its own workflow.</h2>
          <p>Rules, eligibility, document packets, applications, appointments and submission tracking. Open a workspace below to manage its records.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="vs-stats-grid">
        <div className="vs-stat-card">
          <div className="vs-stat-header"><span>ACTIVE CASES</span><div className="vs-stat-icon"><FileText size={16} /></div></div>
          <h3>842</h3>
          <p>48 countries</p>
        </div>
        <div className="vs-stat-card">
          <div className="vs-stat-header"><span>SUBMITTED TODAY</span><div className="vs-stat-icon"><FileText size={16} /></div></div>
          <h3>118</h3>
          <p>96% complete</p>
        </div>
        <div className="vs-stat-card">
          <div className="vs-stat-header"><span>APPOINTMENTS</span><div className="vs-stat-icon"><FileText size={16} /></div></div>
          <h3>64</h3>
          <p>Next 7 days</p>
        </div>
        <div className="vs-stat-card">
          <div className="vs-stat-header"><span>SERVICE VALUE</span><div className="vs-stat-icon"><FileText size={16} /></div></div>
          <h3>₹6.8L</h3>
          <p>+9.2% WoW</p>
        </div>
      </div>

      {/* Main grid: Screens panel + Dashboard */}
      <div className="vs-main-grid">

        {/* LEFT: Visa screens */}
        <div className="vs-screens-panel">
          <div className="vs-screens-header">
            <h3>Visa screens</h3>
            <span className="vs-screens-count">37</span>
          </div>

          <div className="vs-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="vs-screens-toggle" onClick={() => setIsListOpen(!isListOpen)}>
            <ChevronDown size={14} className={`vs-chevron ${isListOpen ? 'open' : ''}`} />
            <span>{isListOpen ? 'Collapse screens' : 'Expand screens'}</span>
          </button>

          {isListOpen && (
            <div className="vs-screens-list">
              {filteredGroups.length === 0 ? (
                <p className="vs-screens-empty">No matches</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.heading} className="vs-screens-group">
                    <p className="vs-screens-heading">{group.heading}</p>
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className={`vs-screens-item ${activeScreen === item ? 'active' : ''}`}
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
        <div className="vs-dashboard">

          {/* Operating command banner */}
          <div className="vs-op-banner">
            <div className="vs-op-banner-left">
              <div className="vs-op-icon"><FileText size={22} /></div>
              <div>
                <div className="vs-op-tags">
                  <span className="vs-op-tag-cyan">Dedicated dashboard</span>
                  <span className="vs-op-tag-dark">API</span>
                  <span className="vs-op-tag-muted">Saved · Not changed</span>
                </div>
                <h2>Visa operating command</h2>
                <p>Rules, eligibility, document packets, applications, appointments and submission tracking</p>
              </div>
            </div>
            <div className="vs-op-banner-actions">
              <button className="vs-op-btn-secondary" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh
              </button>
              <button className="vs-op-btn-primary" onClick={() => goToScreen('Country rules')}>
                Open priority work <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Supply grid */}
          <div className="vs-supply-grid">
            <div className="vs-supply-card">
              <div className="vs-supply-top">
                <span className="vs-band-tag band-1">Band 1</span>
                <span className="vs-band-status not-applicable">Not applicable</span>
              </div>
              <h4>BMT Direct / Vendor supply</h4>
              <p>External-supply vertical; vendor registration is disabled.</p>
            </div>
            <div className="vs-supply-card">
              <div className="vs-supply-top">
                <span className="vs-band-tag band-2">Band 2</span>
                <span className="vs-band-status healthy">Healthy</span>
              </div>
              <h4>Third-party API supply</h4>
              <p>Visa Primary, Visa Backup · certification, mapping, quota, fallback and reconciliation</p>
            </div>
            <div className="vs-supply-card">
              <div className="vs-supply-top">
                <span className="vs-band-tag gate">Release gate</span>
                <span className="vs-band-status enforced">Enforced</span>
              </div>
              <h4>Eligibility before ranking</h4>
              <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
            </div>
          </div>

          {/* Pipeline + Appointment SLA */}
          <div className="vs-two-col">
            <div className="vs-panel">
              <div className="vs-panel-header">
                <h3>Application case pipeline</h3>
                <button className="vs-btn-chip" onClick={() => goToScreen('Applications')}>
                  All cases
                </button>
              </div>
              <div className="vs-pipeline">
                <div className="vs-pipeline-step active">
                  <b>184</b>
                  <span>Intake</span>
                </div>
                <div className="vs-pipeline-step" onClick={() => goToScreen('Document review')}>
                  <b>128</b>
                  <span>Documents</span>
                </div>
                <div className="vs-pipeline-step" onClick={() => goToScreen('Embassy submission')}>
                  <b>82</b>
                  <span>Submitted</span>
                </div>
                <div className="vs-pipeline-step" onClick={() => goToScreen('Case stages')}>
                  <b>46</b>
                  <span>Embassy</span>
                </div>
                <div className="vs-pipeline-step" onClick={() => goToScreen('Status tracking')}>
                  <b>28</b>
                  <span>Decision</span>
                </div>
              </div>
            </div>

            <div className="vs-panel">
              <h3>Appointment &amp; SLA</h3>
              <div className="vs-sla-card">
                <span className="vs-sla-label">APPOINTMENTS</span>
                <b>64</b>
                <span className="vs-sla-sub">next 7 days</span>
              </div>
              <div className="vs-sla-card">
                <span className="vs-sla-label">RULES FRESHNESS</span>
                <b>99.8%</b>
                <span className="vs-sla-sub">48 countries</span>
              </div>
              <button className="vs-open-btn" onClick={() => goToScreen('Appointments')}>
                Open appointments
              </button>
            </div>
          </div>

          {/* Queue items */}
          <div className="vs-queue-grid">
            <div className="vs-queue-item ready" onClick={() => goToScreen('Applications')}>
              <div className="vs-queue-top">
                <span className="vs-queue-id">VIS-8421</span>
                <span className="vs-queue-tag ready">Ready</span>
              </div>
              <p>UAE · ready to submit</p>
            </div>
            <div className="vs-queue-item action" onClick={() => goToScreen('Document review')}>
              <div className="vs-queue-top">
                <span className="vs-queue-id">VIS-8392</span>
                <span className="vs-queue-tag action">Action</span>
              </div>
              <p>France · document re-upload</p>
            </div>
            <div className="vs-queue-item upcoming" onClick={() => goToScreen('Appointments')}>
              <div className="vs-queue-top">
                <span className="vs-queue-id">APT-182</span>
                <span className="vs-queue-tag upcoming">Upcoming</span>
              </div>
              <p>UK biometrics · tomorrow</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}