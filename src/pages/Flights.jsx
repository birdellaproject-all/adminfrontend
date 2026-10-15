// src/pages/Flights.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Play, Download, RefreshCw, Clock, FileText,
  Activity, CircleDollarSign, Boxes, Zap, ChevronRight
} from 'lucide-react';
import './Flights.css';

export default function Flights() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---- Refresh with visible spinner ----
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  // ---- Navigate to a specific Flights screen ----
  const goToScreen = (screenName) => {
    // Update URL so the sidebar auto-syncs
    navigate(`/admin/flights?screen=${encodeURIComponent(screenName)}`);
    // Also dispatch an event so the sidebar updates instantly
    window.dispatchEvent(
      new CustomEvent('flight-screen-change', { detail: screenName })
    );
  };

  // ---- Download custom report as CSV ----
  const handleCustomReport = () => {
    const rows = [
      ['BirdMyTrip · Flights Overview'],
      ['Generated', new Date().toISOString()],
      [''],
      ['Metric', 'Value', 'Detail'],
      ['Bookings today', '486', '91.2% ticketed'],
      ['Gross value', '₹1.18Cr', '+11.4% WoW'],
      ['PNR action queue', '28', '6 urgent'],
      ['Search latency', '480 ms', 'P95 1.2 sec'],
      [''],
      ['Offer → order → fulfillment funnel'],
      ['Searches', '18.4K', ''],
      ['Priced', '12.8K', ''],
      ['Held', '1,284', ''],
      ['Orders', '486', ''],
      ['Ticketed', '443', ''],
      [''],
      ['PNR deadline watch'],
      ['12 min · ticketing deadline', 'Urgent', ''],
      ['38 min · schedule accept', 'Watch', ''],
      ['2h · void window', 'Watch', ''],
      [''],
      ['PNR queue'],
      ['PNR-X8PL2', 'Urgent', 'DEL → DXB · Ticketing deadline'],
      ['SCH-284', 'Action', 'BOM → SIN · Schedule change'],
      ['API-882', 'Warning', 'Sabre · elevated errors'],
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `flights_overview_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fl-content-area">

      {/* Header banner */}
      <div className="fl-banner">
        <div className="fl-banner-left">
          <div className="fl-banner-icon">
            <Plane size={20} />
          </div>
          <div>
            <div className="fl-banner-tag-row">
              <span className="fl-banner-tag">VERTICAL COMMAND</span>
              <span className="fl-banner-chip">API</span>
              <span className="fl-banner-chip gray">45 screens</span>
            </div>
            <h1>Flights · Overview</h1>
            <p>Shopping, fares, orders, PNR, ticketing and disruption servicing</p>
          </div>
        </div>
        <div className="fl-banner-actions">
          <button className="fl-btn-secondary" onClick={handleCustomReport}>
            <Download size={14} /> Custom report
          </button>
          <button
            className="fl-btn-primary"
            onClick={() => goToScreen('Provider bookings & servicing')}
          >
            <Play size={14} /> Open operations
          </button>
        </div>
      </div>

      {/* Category banner */}
      <div className="fl-category-banner">
        <div className="fl-category-image" />
        <div className="fl-category-content">
          <p className="fl-category-eyebrow">FLIGHTS OPERATIONS</p>
          <h2>One vertical. Its own workflow.</h2>
          <p>
            Shopping, fares, orders, PNR, ticketing and disruption servicing.
            Open a workspace below to manage its records.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="fl-stats-grid">
        <div className="fl-stat-card">
          <div className="fl-stat-header">
            <span>BOOKINGS TODAY</span>
            <div className="fl-stat-icon"><Activity size={16} /></div>
          </div>
          <h3>486</h3>
          <p>91.2% ticketed</p>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-header">
            <span>GROSS VALUE</span>
            <div className="fl-stat-icon"><CircleDollarSign size={16} /></div>
          </div>
          <h3>₹1.18Cr</h3>
          <p>+11.4% WoW</p>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-header">
            <span>PNR ACTION QUEUE</span>
            <div className="fl-stat-icon warning"><Boxes size={16} /></div>
          </div>
          <h3>28</h3>
          <p>6 urgent</p>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-header">
            <span>SEARCH LATENCY</span>
            <div className="fl-stat-icon"><Zap size={16} /></div>
          </div>
          <h3>480 ms</h3>
          <p>P95 1.2 sec</p>
        </div>
      </div>

      {/* Operating command banner */}
      <div className="fl-op-banner">
        <div className="fl-op-banner-left">
          <div className="fl-op-icon">
            <Plane size={22} />
          </div>
          <div>
            <div className="fl-op-tags">
              <span className="fl-op-tag-cyan">Dedicated dashboard</span>
              <span className="fl-op-tag-dark">API</span>
              <span className="fl-op-tag-muted">Saved · Not changed</span>
            </div>
            <h2>Flights operating command</h2>
            <p>Shopping, fares, orders, PNR, ticketing and disruption servicing</p>
          </div>
        </div>
        <div className="fl-op-banner-actions">
          <button
            className="fl-op-btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="fl-op-btn-primary"
            onClick={() => goToScreen('PNR queue')}
          >
            Open priority work <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Supply grid */}
      <div className="fl-supply-grid">
        <div className="fl-supply-card">
          <div className="fl-supply-top">
            <span className="fl-band-tag band-1">Band 1</span>
            <span className="fl-band-status not-applicable">Not applicable</span>
          </div>
          <h4>BMT Direct / Vendor supply</h4>
          <p>External-supply vertical; vendor registration is disabled.</p>
        </div>
        <div className="fl-supply-card">
          <div className="fl-supply-top">
            <span className="fl-band-tag band-2">Band 2</span>
            <span className="fl-band-status healthy">Healthy</span>
          </div>
          <h4>Third-party API supply</h4>
          <p>Amadeus, Sabre, Travelport, Mystifly · certification, mapping, quota, fallback and reconciliation</p>
        </div>
        <div className="fl-supply-card">
          <div className="fl-supply-top">
            <span className="fl-band-tag gate">Release gate</span>
            <span className="fl-band-status enforced">Enforced</span>
          </div>
          <h4>Eligibility before ranking</h4>
          <p>Compliance, sellable availability, canonical deduplication and user sort apply before BMT Direct-first ranking.</p>
        </div>
      </div>

      {/* Funnel + PNR deadline */}
      <div className="fl-two-col">
        <div className="fl-panel">
          <h3>Offer → order → fulfillment funnel</h3>
          <div className="fl-funnel">
            <div className="fl-funnel-step active">
              <b>18.4K</b>
              <span>Searches</span>
            </div>
            <div className="fl-funnel-step">
              <b>12.8K</b>
              <span>Priced</span>
            </div>
            <div className="fl-funnel-step">
              <b>1,284</b>
              <span>Held</span>
            </div>
            <div className="fl-funnel-step">
              <b>486</b>
              <span>Orders</span>
            </div>
            <div className="fl-funnel-step">
              <b>443</b>
              <span>Ticketed</span>
            </div>
          </div>
        </div>

        <div className="fl-pnr-panel">
          <div className="fl-pnr-header">
            <FileText size={16} />
            <h3>PNR deadline watch</h3>
          </div>
          <div className="fl-pnr-list">
            <div className="fl-pnr-row">
              <Clock size={14} />
              <span>12 min · ticketing deadline</span>
              <span className="fl-pnr-tag urgent">Urgent</span>
            </div>
            <div className="fl-pnr-row">
              <Clock size={14} />
              <span>38 min · schedule accept</span>
              <span className="fl-pnr-tag watch">Watch</span>
            </div>
            <div className="fl-pnr-row">
              <Clock size={14} />
              <span>2h · void window</span>
              <span className="fl-pnr-tag watch">Watch</span>
            </div>
          </div>
          <button
            className="fl-pnr-btn"
            onClick={() => goToScreen('PNR queue')}
          >
            Open PNR control
          </button>
        </div>
      </div>

      {/* PNR queue items */}
      <div className="fl-pnr-items-grid">
        <div className="fl-pnr-item urgent">
          <div className="fl-pnr-item-top">
            <span className="fl-pnr-id">PNR-X8PL2</span>
            <span className="fl-pnr-tag urgent">Urgent</span>
          </div>
          <p>DEL → DXB · Ticketing deadline</p>
        </div>
        <div className="fl-pnr-item action">
          <div className="fl-pnr-item-top">
            <span className="fl-pnr-id">SCH-284</span>
            <span className="fl-pnr-tag action">Action</span>
          </div>
          <p>BOM → SIN · Schedule change</p>
        </div>
        <div className="fl-pnr-item warning">
          <div className="fl-pnr-item-top">
            <span className="fl-pnr-id">API-882</span>
            <span className="fl-pnr-tag warning">Warning</span>
          </div>
          <p>Sabre · elevated errors</p>
        </div>
      </div>

    </div>
  );
}