// src/pages/PortfolioOverview.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Bed, Train, Bus, Car, Package, Activity, CalendarDays,
  Landmark, Ship, FileText, Shield, Globe, RefreshCw,
  CircleDollarSign, Boxes, AlertTriangle, ChevronDown, Check,
  ChevronRight
} from 'lucide-react';
import './PortfolioOverview.css';

// ---- Image URLs for verticals (using Unsplash sources) ----
const VERTICALS = [
  {
    key: 'flights', label: 'Flights', icon: <Plane size={16} />, supply: 'api', status: 'Healthy',
    desc: 'Shopping, fares, orders, PNR, ticketing and disruption servicing',
    workspaces: 45,
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'stays', label: 'Stays', icon: <Bed size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'Every accommodation type, property, room, rate, reservation and payout…',
    workspaces: 45,
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'trains', label: 'Trains', icon: <Train size={16} />, supply: 'api', status: 'Healthy',
    desc: 'Rail search, schedules, quotas, PNR monitoring, cancellation and provider…',
    workspaces: 41,
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'buses', label: 'Buses', icon: <Bus size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'Operators, vehicles, routes, seat inventory, trips, crew and realtime…',
    workspaces: 48,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'cabs', label: 'Cabs', icon: <Car size={16} />, supply: 'direct+api', status: 'Action',
    desc: 'Fleet, owners, drivers, nearby demand, dispatch, live trips and safety',
    workspaces: 46,
    image: 'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'packages', label: 'Packages', icon: <Package size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'DMCs, products, itinerary costing, departures, rooming lists and operations',
    workspaces: 61,
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'activities', label: 'Activities', icon: <Activity size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'Experiences, product options, slots, live capacity, safety, booking and…',
    workspaces: 43,
    image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'events', label: 'Events', icon: <CalendarDays size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'Organizers, venues, shows, ticket manifests, commerce, fulfillment and…',
    workspaces: 43,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'darshan', label: 'Darshan', icon: <Landmark size={16} />, supply: 'direct', status: 'Healthy',
    desc: 'Operators, temples, darshan services, slots, passes, queues and verification',
    workspaces: 41,
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'cruises', label: 'Cruises', icon: <Ship size={16} />, supply: 'direct+api', status: 'Healthy',
    desc: 'Lines, ships, sailings, cabins, fare codes, guest documents and embarkation',
    workspaces: 44,
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'visa', label: 'Visa', icon: <FileText size={16} />, supply: 'api', status: 'Healthy',
    desc: 'Rules, eligibility, document packets, applications, appointments and…',
    workspaces: 37,
    image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=70&auto=format&fit=crop',
  },
  {
    key: 'insurance', label: 'Insurance', icon: <Shield size={16} />, supply: 'api', status: 'Healthy',
    desc: 'Providers, eligibility, quotes, plan comparison, policies, certificates and…',
    workspaces: 38,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=70&auto=format&fit=crop',
  },
];

const CROSS_VERTICAL_WATCH = [
  { vertical: 'Cab', msg: 'SOS active', priority: 'critical' },
  { vertical: 'Bus', msg: '7 crew offline', priority: 'action' },
  { vertical: 'Stays', msg: '219 stale units', priority: 'warning' },
  { vertical: 'Flights', msg: 'Provider errors 1.8%', priority: 'warning' },
];

const GOVERNANCE_STEPS = [
  { num: 1, title: 'Eligible BMT Direct', desc: 'Compliant · available · deduplicated' },
  { num: 2, title: 'Third-party APIs', desc: 'Eligible fallback and breadth' },
  { num: 3, title: 'Customer-selected sort', desc: 'Price, rating or relevance respected' },
];

const SUPPLY_OPTIONS = [
  { value: 'all', label: 'All supply' },
  { value: 'direct', label: 'BMT Direct' },
  { value: 'third-party', label: 'Third-party API' },
];

export default function PortfolioOverview() {
  const navigate = useNavigate();
  const [supplyFilter, setSupplyFilter] = useState('all');
  const [isSupplyOpen, setIsSupplyOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

 // Explicit lists — no ambiguity
const THIRD_PARTY_KEYS = ['flights', 'trains', 'visa', 'insurance'];

const isUnderFilter = (v) => {
  if (supplyFilter === 'all') return true;
  if (supplyFilter === 'third-party') return THIRD_PARTY_KEYS.includes(v.key);
  if (supplyFilter === 'direct') return !THIRD_PARTY_KEYS.includes(v.key);
  return true;
};
  const visibleVerticals = VERTICALS.filter(isUnderFilter);

  const handleVerticalClick = (vertical) => {
    const routes = {
      flights: '/admin/flights', stays: '/admin/stays', trains: '/admin/trains',
      buses: '/admin/buses', cabs: '/admin/cabs', packages: '/admin/packages',
      activities: '/admin/activities', events: '/admin/events', darshan: '/admin/darshan',
      cruises: '/admin/cruises', visa: '/admin/visa', insurance: '/admin/insurance',
    };
    const route = routes[vertical.key];
    if (route) navigate(route);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  const handleSupplySelect = (value) => {
    setSupplyFilter(value);
    setIsSupplyOpen(false);
  };

  const currentSupplyLabel =
    SUPPLY_OPTIONS.find((o) => o.value === supplyFilter)?.label || 'All supply';

  const supplyLabel = (s) => {
    if (s === 'direct') return 'Direct';
    if (s === 'api') return 'API';
    return 'Direct + API';
  };
  const supplyClass = (s) => {
    if (s === 'direct') return 'supply-direct';
    if (s === 'api') return 'supply-api';
    return 'supply-both';
  };
  const statusClass = (s) => {
    if (s === 'Healthy') return 'status-healthy';
    if (s === 'Action') return 'status-action';
    return 'status-warning';
  };

  return (
    <div className="po-content-area">

      {/* ============ Header banner ============ */}
      <div className="po-banner">
        <div className="po-banner-left">
          <p className="po-banner-tag">
            <span className="dot"></span> VERTICAL PORTFOLIO · PRODUCTION
          </p>
          <h1>{VERTICALS.length} travel control rooms</h1>
          <p className="po-banner-desc">
            Direct supply, third-party distribution, orders, inventory, service operations and money across every BirdMyTrip vertical.
          </p>
        </div>
        <div className="po-banner-actions">
          <div className="po-dropdown-wrapper">
            <button
              className="po-btn-secondary"
              onClick={() => setIsSupplyOpen(!isSupplyOpen)}
            >
              <Globe size={14} /> {currentSupplyLabel} <ChevronDown size={12} />
            </button>
            {isSupplyOpen && (
              <>
                <div className="po-dropdown-backdrop" onClick={() => setIsSupplyOpen(false)} />
                <div className="po-dropdown-menu">
                  {SUPPLY_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`po-dropdown-item ${supplyFilter === opt.value ? 'active' : ''}`}
                      onClick={() => handleSupplySelect(opt.value)}
                    >
                      <span>{opt.label}</span>
                      {supplyFilter === opt.value && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="po-btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ============ 4 stat cards ============ */}
      <div className="po-stats-grid">
        <div className="po-stat-card">
          <div className="po-stat-header">
            <span>GROSS BOOKING VALUE</span>
            <div className="po-stat-icon"><CircleDollarSign size={16} /></div>
          </div>
          <h2>₹4.82 Cr</h2>
          <p>12 verticals · today</p>
        </div>
        <div className="po-stat-card">
          <div className="po-stat-header">
            <span>BMT DIRECT SHARE</span>
            <div className="po-stat-icon"><Shield size={16} /></div>
          </div>
          <h2>68.4%</h2>
          <p>Eligible direct supply first</p>
        </div>
        <div className="po-stat-card">
          <div className="po-stat-header">
            <span>SELLABLE INVENTORY</span>
            <div className="po-stat-icon"><Boxes size={16} /></div>
          </div>
          <h2>1.82L</h2>
          <p>Fresh and compliant units</p>
        </div>
        <div className="po-stat-card">
          <div className="po-stat-header">
            <span>OPERATIONAL ACTIONS</span>
            <div className="po-stat-icon warning"><AlertTriangle size={16} /></div>
          </div>
          <h2>128</h2>
          <p>4 critical · 42 supply</p>
        </div>
      </div>

      {/* ============ Main grid ============ */}
      <div className="po-main-grid">

        {/* LEFT: Vertical cards */}
        <div className="po-panel">
          <div className="po-panel-header">
            <div>
              <h3>Vertical control rooms</h3>
              <p>All markets · {currentSupplyLabel} · click any vertical for complete operations</p>
            </div>
            <span className="po-badge">{visibleVerticals.length} visible</span>
          </div>

          <div className="po-verticals-grid">
            {visibleVerticals.map((v) => (
              <div
                key={v.key}
                className="po-vertical-card"
                onClick={() => handleVerticalClick(v)}
              >
                <div
                  className="po-vertical-visual"
                  style={{ backgroundImage: `url(${v.image})` }}
                >
                  <span className="po-category-preview">Category preview</span>
                </div>
                <div className="po-vertical-body">
                  <div className="po-vertical-top">
                    <div className={`po-vertical-icon icon-${v.key}`}>{v.icon}</div>
                    <span className={`po-status-tag ${statusClass(v.status)}`}>
                      {v.status}
                    </span>
                  </div>
                  <h4 className="po-vertical-title">{v.label}</h4>
                  <p className="po-vertical-desc">{v.desc}</p>
                  <div className="po-vertical-footer">
                    <span>{v.workspaces} workspaces</span>
                    <span className={`po-supply-text ${supplyClass(v.supply)}`}>
                      {supplyLabel(v.supply)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Governance + Watch */}
        <div className="po-right-col">

          <div className="po-panel">
            <h3>Search supply governance</h3>
            <div className="po-governance-list">
              {GOVERNANCE_STEPS.map((g) => (
                <div key={g.num} className="po-governance-item">
                  <span className="po-governance-num">{g.num}</span>
                  <div>
                    <b>{g.title}</b>
                    <span>{g.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="po-governance-note">
              Ranking never bypasses compliance, availability, safety, legal disclosure or explicit customer sort.
            </div>
          </div>

          <div className="po-panel">
            <h3>Cross-vertical watch</h3>
            <div className="po-watch-list">
              {CROSS_VERTICAL_WATCH.map((w) => (
                <div key={w.vertical} className="po-watch-item">
                  <div className="po-watch-info">
                    <b>{w.vertical}</b>
                    <span>{w.msg}</span>
                  </div>
                  <span className={`po-watch-tag tag-${w.priority}`}>
                    {w.priority === 'critical' ? 'Critical' : w.priority === 'action' ? 'Action' : 'Warning'}
                  </span>
                  <ChevronRight size={14} className="po-chevron" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}