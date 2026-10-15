// src/pages/Insurance.jsx
import React, { useState, useMemo } from 'react';
import { Shield, Play, Download, RefreshCw, ChevronRight, ChevronDown, Search } from 'lucide-react';
import './Insurance.css';

// ---- Insurance screens nav groups (shown INSIDE the page) ----
const INSURANCE_GROUPS = [
  { heading: 'Overview', items: ['Command dashboard', 'Executive summary', 'Live operations'] },
  { heading: 'Partners & distribution', items: [
    'Provider 360° control', 'Provider onboarding & KYC',
    'Provider products & listings', 'Provider inventory & rates',
    'Provider bookings & servicing', 'Provider access & security',
    'Provider compliance & audit', 'Change approval queue',
    'Admin supply override', 'Commercial & settlement control',
    'Source mapping & priority', 'Providers',
    'Provider certification', 'Provider cost & quota',
  ]},
  { heading: 'Operations', items: [
    'Plan catalog', 'Eligibility', 'Premium quotes',
    'Plan comparison', 'Policy issuance', 'Certificates',
    'Cancellation & refunds', 'API credentials', 'Benefits mapping',
    'Quote requests', 'Policy amendments', 'Commission',
    'Reconciliation', 'Webhook replay', 'API logs', 'Reports',
  ]},
  { heading: 'Product setup & content', items: [
    'Claims handoff', 'Product information', 'Product units',
    'Photos & media', 'Policies', 'Product documents',
    'Product change history',
  ]},
];

export default function Insurance() {
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
    if (!searchTerm.trim()) return INSURANCE_GROUPS;
    const q = searchTerm.toLowerCase();
    return INSURANCE_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [searchTerm]);

  // ---- Custom report ----
  const handleCustomReport = () => {
    const rows = [
      ['BirdMyTrip · Insurance Overview'],
      ['Generated', new Date().toISOString()],
      [''],
      ['Metric', 'Value', 'Detail'],
      ['Policies issued', '1,842', 'Today'],
      ['Quote conversion', '38.4%', '+2.1% MoM'],
      ['Claims handoff', '18', '4 need action'],
      ['Premium value', '₹11.2L', '+15.8% WoW'],
      [''],
      ['Quote → policy funnel'],
      ['Eligible', '12.8K', ''],
      ['Quoted', '8.4K', ''],
      ['Selected', '3.2K', ''],
      ['Paid', '1.9K', ''],
      ['Issued', '1,842', ''],
      [''],
      ['Claims & reconciliation'],
      ['Claims handoff', '18', '4 action'],
      ['Ledger match', '98.7%', '₹42K variance'],
      ['Certificates', '1,842', 'issued today'],
      ['API success', '99.2%', 'P95 620ms'],
      [''],
      ['Queue items'],
      ['POL-88421', 'Issued', 'International cover · issued'],
      ['CLM-284', 'Action', 'Medical claim · ack pending'],
      ['API-INS', 'Healthy', 'Quote service · 99.2% success'],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `insurance_overview_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="in-content-area">

      {/* Header banner */}
      <div className="in-banner">
        <div className="in-banner-left">
          <div className="in-banner-icon"><Shield size={20} /></div>
          <div>
            <div className="in-banner-tag-row">
              <span className="in-banner-tag">VERTICAL COMMAND</span>
              <span className="in-banner-chip">API</span>
              <span className="in-banner-chip gray">38 screens</span>
            </div>
            <h1>Insurance · Overview</h1>
            <p>Providers, eligibility, quotes, plan comparison, policies, certificates and claims handoff</p>
          </div>
        </div>
        <div className="in-banner-actions">
          <button className="in-btn-secondary" onClick={handleCustomReport}>
            <Download size={14} /> Custom report
          </button>
          <button className="in-btn-primary" onClick={() => goToScreen('Policy issuance')}>
            <Play size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* Category banner */}
      <div className="in-category-banner">
        <div className="in-category-image" />
        <div className="in-category-content">
          <p className="in-category-eyebrow">INSURANCE OPERATIONS</p>
          <h2>One vertical. Its own workflow.</h2>
          <p>Providers, eligibility, quotes, plan comparison, policies, certificates and claims handoff. Open a workspace below to manage its records.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="in-stats-grid">
        <div className="in-stat-card">
          <div className="in-stat-header"><span>POLICIES ISSUED</span><div className="in-stat-icon"><Shield size={16} /></div></div>
          <h3>1,842</h3>
          <p>Today</p>
        </div>
        <div className="in-stat-card">
          <div className="in-stat-header"><span>QUOTE CONVERSION</span><div className="in-stat-icon"><Shield size={16} /></div></div>
          <h3>38.4%</h3>
          <p>+2.1% MoM</p>
        </div>
        <div className="in-stat-card">
          <div className="in-stat-header"><span>CLAIMS HANDOFF</span><div className="in-stat-icon"><Shield size={16} /></div></div>
          <h3>18</h3>
          <p>4 need action</p>
        </div>
        <div className="in-stat-card">
          <div className="in-stat-header"><span>PREMIUM VALUE</span><div className="in-stat-icon"><Shield size={16} /></div></div>
          <h3>₹11.2L</h3>
          <p>+15.8% WoW</p>
        </div>
      </div>

      {/* Main grid: Screens panel + Dashboard */}
      <div className="in-main-grid">

        {/* LEFT: Insurance screens */}
        <div className="in-screens-panel">
          <div className="in-screens-header">
            <h3>Insurance screens</h3>
            <span className="in-screens-count">38</span>
          </div>

          <div className="in-screens-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Find a screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="in-screens-toggle" onClick={() => setIsListOpen(!isListOpen)}>
            <ChevronDown size={14} className={`in-chevron ${isListOpen ? 'open' : ''}`} />
            <span>{isListOpen ? 'Collapse screens' : 'Expand screens'}</span>
          </button>

          {isListOpen && (
            <div className="in-screens-list">
              {filteredGroups.length === 0 ? (
                <p className="in-screens-empty">No matches</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.heading} className="in-screens-group">
                    <p className="in-screens-heading">{group.heading}</p>
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className={`in-screens-item ${activeScreen === item ? 'active' : ''}`}
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
        <div className="in-dashboard">

          {/* Operating command banner */}
          <div className="in-op-banner">
            <div className="in-op-banner-left">
              <div className="in-op-icon"><Shield size={22} /></div>
              <div>
                <div className="in-op-tags">
                  <span className="in-op-tag-cyan">Dedicated dashboard</span>
                  <span className="in-op-tag-dark">API</span>
                  <span className="in-op-tag-muted">Saved · Not changed</span>
                </div>
                <h2>Insurance operating command</h2>
                <p>Providers, eligibility, quotes, plan comparison, policies, certificates and claims handoff</p>
              </div>
            </div>
            <div className="in-op-banner-actions">
              <button className="in-op-btn-secondary" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh
              </button>
              <button className="in-op-btn-primary" onClick={() => goToScreen('Premium quotes')}>
                Open priority work <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Supply grid */}
          <div className="in-supply-grid">
            <div className="in-supply-card">
              <div className="in-supply-top">
                <span className="in-band-tag band-1">Band 1</span>
                <span className="in-band-status not-applicable">Not applicable</span>
              </div>
              <h4>BMT Direct / Vendor supply</h4>
              <p>External-supply vertical; vendor registration is disabled.</p>
            </div>
            <div className="in-supply-card">
              <div className="in-supply-top">
                <span className="in-band-tag band-2">Band 2</span>
                <span className="in-band-status healthy">Healthy</span>
              </div>
              <h4>Third-party API supply</h4>
              <p>Insurance Primary, Insurance Backup · certification, mapping, quota, fallback and reconciliation</p>
            </div>
            <div className="in-supply-card">
              <div className="in-supply-top">
                <span className="in-band-tag gate">Release gate</span>
                <span className="in-band-status enforced">Enforced</span>
              </div>
              <h4>Eligibility before ranking</h4>
              <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
            </div>
          </div>

          {/* Funnel + Claims */}
          <div className="in-two-col">
            <div className="in-panel">
              <h3>Quote → policy funnel</h3>
              <div className="in-funnel">
                <div className="in-funnel-step active">
                  <b>12.8K</b>
                  <span>Eligible</span>
                </div>
                <div className="in-funnel-step" onClick={() => goToScreen('Quote requests')}>
                  <b>8.4K</b>
                  <span>Quoted</span>
                </div>
                <div className="in-funnel-step" onClick={() => goToScreen('Plan comparison')}>
                  <b>3.2K</b>
                  <span>Selected</span>
                </div>
                <div className="in-funnel-step" onClick={() => goToScreen('Policy issuance')}>
                  <b>1.9K</b>
                  <span>Paid</span>
                </div>
                <div className="in-funnel-step" onClick={() => goToScreen('Certificates')}>
                  <b>1,842</b>
                  <span>Issued</span>
                </div>
              </div>
            </div>

            <div className="in-panel">
              <div className="in-panel-header">
                <h3>Claims &amp; reconciliation</h3>
                <button className="in-btn-chip" onClick={() => goToScreen('Claims handoff')}>
                  Claims
                </button>
              </div>
              <div className="in-claims-grid">
                <div className="in-claims-card">
                  <span className="in-claims-label">CLAIMS HANDOFF</span>
                  <b>18</b>
                  <span className="in-claims-sub">4 action</span>
                </div>
                <div className="in-claims-card">
                  <span className="in-claims-label">LEDGER MATCH</span>
                  <b>98.7%</b>
                  <span className="in-claims-sub">₹42K variance</span>
                </div>
                <div className="in-claims-card">
                  <span className="in-claims-label">CERTIFICATES</span>
                  <b>1,842</b>
                  <span className="in-claims-sub">issued today</span>
                </div>
                <div className="in-claims-card">
                  <span className="in-claims-label">API SUCCESS</span>
                  <b>99.2%</b>
                  <span className="in-claims-sub">P95 620ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Queue items */}
          <div className="in-queue-grid">
            <div className="in-queue-item issued" onClick={() => goToScreen('Certificates')}>
              <div className="in-queue-top">
                <span className="in-queue-id">POL-88421</span>
                <span className="in-queue-tag issued">Issued</span>
              </div>
              <p>International cover · issued</p>
            </div>
            <div className="in-queue-item action" onClick={() => goToScreen('Claims handoff')}>
              <div className="in-queue-top">
                <span className="in-queue-id">CLM-284</span>
                <span className="in-queue-tag action">Action</span>
              </div>
              <p>Medical claim · ack pending</p>
            </div>
            <div className="in-queue-item healthy" onClick={() => goToScreen('API logs')}>
              <div className="in-queue-top">
                <span className="in-queue-id">API-INS</span>
                <span className="in-queue-tag healthy">Healthy</span>
              </div>
              <p>Quote service · 99.2% success</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}