// src/layouts/AdminLayout.js
import { useState, useEffect, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase, CheckSquare, Inbox, ShieldAlert, Activity, CalendarClock,
  ArrowRightLeft, FileSearch, FileText, Plane, Hotel, Train, Bus, Car,
  Package, CalendarDays, Landmark, Ship, LayoutDashboard, Menu, Search,
  Link as LinkIcon, Bell, ChevronDown, ChevronRight, X,
  Network, BookOpen, Store, Users, UserCog, Boxes,
  Landmark as BankIcon, CreditCard, RotateCcw, Wallet, Calculator,
  Receipt, LineChart, Headphones, MessageSquare, TrendingUp,
  Gift, Star, Globe, Smartphone, Building2, Truck as TruckIcon,
  Cpu, Plug, Rocket, Flag, Bell as BellIcon, ListChecks, Gauge,
  BarChart3, ShieldCheck, Building, Lock, Key, Fingerprint, Shield,
  FileCheck, Gavel, ScrollText, Settings
} from "lucide-react";
import "./Layout.css";

// ============================================================
//  TWO BACKENDS:
//  - LOCAL admin backend (dashboard, incidents, handovers, etc.)
//  - EXTERNAL vendor backend (public vendor list / approvals)
// ============================================================
const API_BASE_URL = "http://192.168.1.6:4000";
const VENDOR_API_BASE = "https://bmtvendorfinal.onrender.com/api/vendor";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

// ---- Sidebar count fetchers ----
const fetchApprovalCount = async () => {
  try {
    // Public endpoint — no auth needed
    const res = await fetch(`${VENDOR_API_BASE}/auth/vendors`);
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.vendors || []).filter((v) => v.status === "PENDING").length;
  } catch (err) {
    console.warn("[Sidebar] approval fetch failed:", err);
    return 0;
  }
};

const fetchIncidentCount = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/live-incidents/list?filter=Active`, {
      headers: getHeaders(),
    });
    if (!res.ok) return 0;
    return (await res.json()).data?.total || 0;
  } catch {
    return 0;
  }
};

const fetchHandoverCount = async () => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/shift-handovers/list?status=Pending%20acceptance`,
      { headers: getHeaders() }
    );
    if (!res.ok) return 0;
    return (await res.json()).data?.total || 0;
  } catch {
    return 0;
  }
};

const fetchPostmortemCount = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/postmortems/list`, {
      headers: getHeaders(),
    });
    if (!res.ok) return 0;
    const items = (await res.json()).data?.items || [];
    return items.filter((i) => i.status !== "Approved" && i.status !== "Closed").length;
  } catch {
    return 0;
  }
};

// ---- Flight screens nav groups ----
const FLIGHT_GROUPS = [
  { heading: 'Overview', items: ['Command dashboard', 'Executive summary', 'Live operations'] },
  { heading: 'Partners & distribution', items: [
    'Provider 360° control', 'Provider onboarding & KYC',
    'Provider products & listings', 'Provider inventory & rates',
    'Provider bookings & servicing', 'Provider access & security',
    'Provider compliance & audit', 'Change approval queue',
    'Admin supply override', 'Commercial & settlement control',
    'Source mapping & priority', 'Provider certification', 'Provider cost & quota',
  ]},
  { heading: 'Operations', items: [
    'Air shopping', 'Order creation', 'PNR queue', 'Ticketing',
    'Disruption reaccommodation', 'Refunds', 'Reconciliation',
    'Supplier APIs', 'Offer comparison', 'Ancillaries', 'Seat maps',
    'Payment status', 'Void & reissue', 'Schedule changes',
    'Cancellation', 'Debit memos', 'Markup & commission',
    'Airport mapping', 'Webhook replay', 'API logs', 'Reports',
  ]},
  { heading: 'Product setup & content', items: [
    'Fare rules', 'Fare families', 'Product information',
    'Product rates', 'Product availability', 'Amenities & inclusions',
    'Product reviews', 'Photos & media', 'Product documents',
    'Product change history',
  ]},
];

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ approvals: 0, incidents: 0, handovers: 0, postmortems: 0 });

  const [isFlightsOpen, setIsFlightsOpen] = useState(false);
  const [flightSearch, setFlightSearch] = useState('');
  const [activeFlightScreen, setActiveFlightScreen] = useState('Command dashboard');

  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("bmtAuthUser") || "{}");

  const loadCounts = async () => {
    const [approvals, incidents, handovers, postmortems] = await Promise.all([
      fetchApprovalCount(),
      fetchIncidentCount(),
      fetchHandoverCount(),
      fetchPostmortemCount(),
    ]);
    setCounts({ approvals, incidents, handovers, postmortems });
  };

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    const handler = () => loadCounts();
    window.addEventListener('refresh-sidebar-counts', handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-sidebar-counts', handler);
    };
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const screen = params.get('screen');
    if (screen && location.pathname === '/admin/flights') {
      setActiveFlightScreen(screen);
      setIsFlightsOpen(true);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        setActiveFlightScreen(e.detail);
        setIsFlightsOpen(true);
      }
    };
    window.addEventListener('flight-screen-change', handler);
    return () => window.removeEventListener('flight-screen-change', handler);
  }, []);

  const filteredFlightGroups = useMemo(() => {
    if (!flightSearch.trim()) return FLIGHT_GROUPS;
    const q = flightSearch.toLowerCase();
    return FLIGHT_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [flightSearch]);

  const handleNavClick = (label) => {
    const routeMap = {
      "My work": "/admin/my-work",
      "Executive command": "/admin/executive",
      "Approval center": "/admin/approvals",
      "Operations inbox": "/admin/inbox",
      "Live incidents": "/admin/incidents",
      "Service health": "/admin/service-health",
      "Change calendar": "/admin/change-calendar",
      "Shift handovers": "/admin/handovers",
      "Postmortems": "/admin/postmortems",
      "Situation reports": "/admin/reports",
      "Portfolio overview": "/admin/portfolio",
      "Flights": "/admin/flights",
      "Stays": "/admin/stays",
      "Trains": "/admin/trains",
      "Buses": "/admin/buses",
      "Cabs": "/admin/cabs",
      "Packages": "/admin/packages",
      "Activities": "/admin/activities",
      "Events": "/admin/events",
      "Darshan": "/admin/darshan",
      "Cruises": "/admin/cruises",
      "Visa": "/admin/visa",
      "Insurance": "/admin/insurance",
      "Commerce command": "/admin/commerce-command",
      "Global bookings": "/admin/global-bookings",
      "Vendor 360° control": "/admin/vendor-360",
      "Customer & user control": "/admin/customer-control",
      "Agent network": "/admin/agent-network",
      "Inventory control": "/admin/inventory-control",
      "Finance command": "/admin/finance-command",
      "Payments": "/admin/payments",
      "Refunds & disputes": "/admin/refunds-disputes",
      "Payouts & settlements": "/admin/payouts-settlements",
      "Reconciliation & accounting": "/admin/reconciliation-accounting",
      "Tax, FX & invoicing": "/admin/tax-fx-invoicing",
      "Service & growth command": "/admin/service-growth-command",
      "Customer care": "/admin/customer-care",
      "Communication center": "/admin/communication-center",
      "Search & ranking": "/admin/search-ranking",
      "Promotions & loyalty": "/admin/promotions-loyalty",
      "Reviews & moderation": "/admin/reviews-moderation",
      "Content & SEO": "/admin/content-seo",
      "User app & website": "/admin/user-app-website",
      "Vendor app & portal": "/admin/vendor-app-portal",
      "Agent website": "/admin/agent-website",
      "Cab driver app": "/admin/cab-driver-app",
      "Bus crew app": "/admin/bus-crew-app",
      "Technology command": "/admin/technology-command",
      "API & supplier hub": "/admin/api-supplier-hub",
      "Release center": "/admin/release-center",
      "Feature flags": "/admin/feature-flags",
      "Notification orchestration": "/admin/notification-orchestration",
      "Jobs & queues": "/admin/jobs-queues",
      "Monitoring & SRE": "/admin/monitoring-sre",
      "Analytics & BI": "/admin/analytics-bi",
      "Governance command": "/admin/governance-command",
      "Company & tax details": "/admin/company-tax-details",
      "Employees & access": "/admin/employees-access",
      "Access governance": "/admin/access-governance",
      "Fraud & risk": "/admin/fraud-risk",
      "Security center": "/admin/security-center",
      "Privacy & policies": "/admin/privacy-policies",
      "Compliance & controls": "/admin/compliance-controls",
      "Legal operations": "/admin/legal-operations",
      "Audit logs": "/admin/audit-logs",
      "Global configuration": "/admin/global-configuration",
    };
    const route = routeMap[label];
    if (route) navigate(route);
    setIsMobileMenuOpen(false);
  };

  const handleFlightsClick = () => {
    navigate("/admin/flights");
    setIsFlightsOpen((v) => !v);
  };

  const handleFlightScreenClick = (screen) => {
    setActiveFlightScreen(screen);
    navigate(`/admin/flights?screen=${encodeURIComponent(screen)}`);
  };

  const commandItems = [
    { icon: <Briefcase size={18} />, label: 'My work', active: location.pathname === '/admin/my-work' },
    { icon: <LayoutDashboard size={18} />, label: 'Executive command', active: location.pathname === '/admin/executive' || location.pathname === '/admin' },
    { icon: <CheckSquare size={18} />, label: 'Approval center', badge: counts.approvals, active: location.pathname === '/admin/approvals' },
    { icon: <Inbox size={18} />, label: 'Operations inbox', active: location.pathname === '/admin/inbox' },
    { icon: <ShieldAlert size={18} />, label: 'Live incidents', badge: counts.incidents, active: location.pathname === '/admin/incidents' },
    { icon: <Activity size={18} />, label: 'Service health', active: location.pathname === '/admin/service-health' },
    { icon: <CalendarClock size={18} />, label: 'Change calendar', active: location.pathname === '/admin/change-calendar' },
    { icon: <ArrowRightLeft size={18} />, label: 'Shift handovers', badge: counts.handovers, active: location.pathname === '/admin/handovers' },
    { icon: <FileSearch size={18} />, label: 'Postmortems', badge: counts.postmortems, active: location.pathname === '/admin/postmortems' },
    { icon: <FileText size={18} />, label: 'Situation reports', active: location.pathname === '/admin/reports' },
  ];

  const verticalItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Portfolio overview', active: location.pathname === '/admin/portfolio' },
    { icon: <Plane size={18} />, label: 'Flights', active: location.pathname === '/admin/flights', isFlights: true },
    { icon: <Hotel size={18} />, label: 'Stays', active: location.pathname === '/admin/stays' },
    { icon: <Train size={18} />, label: 'Trains', active: location.pathname === '/admin/trains' },
    { icon: <Bus size={18} />, label: 'Buses', active: location.pathname === '/admin/buses' },
    { icon: <Car size={18} />, label: 'Cabs', active: location.pathname === '/admin/cabs' },
    { icon: <Package size={18} />, label: 'Packages', active: location.pathname === '/admin/packages' },
    { icon: <Activity size={18} />, label: 'Activities', active: location.pathname === '/admin/activities' },
    { icon: <CalendarDays size={18} />, label: 'Events', active: location.pathname === '/admin/events' },
    { icon: <Landmark size={18} />, label: 'Darshan', tag: 'BMT', active: location.pathname === '/admin/darshan' },
    { icon: <Ship size={18} />, label: 'Cruises', active: location.pathname === '/admin/cruises' },
    { icon: <FileText size={18} />, label: 'Visa', active: location.pathname === '/admin/visa' },
    { icon: <ShieldAlert size={18} />, label: 'Insurance', active: location.pathname === '/admin/insurance' },
  ];

  const commerceItems = [
    { icon: <Network size={18} />, label: 'Commerce command', tag: 'LI…' },
    { icon: <BookOpen size={18} />, label: 'Global bookings', badge: 19 },
    { icon: <Store size={18} />, label: 'Vendor 360° control', badge: 42 },
    { icon: <Users size={18} />, label: 'Customer & user control' },
    { icon: <UserCog size={18} />, label: 'Agent network' },
    { icon: <Boxes size={18} />, label: 'Inventory control' },
  ];

  const financeItems = [
    { icon: <BankIcon size={18} />, label: 'Finance command', tag: 'LIVE' },
    { icon: <CreditCard size={18} />, label: 'Payments' },
    { icon: <RotateCcw size={18} />, label: 'Refunds & disputes', badge: 12 },
    { icon: <Wallet size={18} />, label: 'Payouts & settlements', badge: 7 },
    { icon: <Calculator size={18} />, label: 'Reconciliation & accounting' },
    { icon: <Receipt size={18} />, label: 'Tax, FX & invoicing' },
  ];

  const serviceItems = [
    { icon: <LineChart size={18} />, label: 'Service & growth command', tag: 'L…' },
    { icon: <Headphones size={18} />, label: 'Customer care', badge: 36 },
    { icon: <MessageSquare size={18} />, label: 'Communication center' },
    { icon: <TrendingUp size={18} />, label: 'Search & ranking' },
    { icon: <Gift size={18} />, label: 'Promotions & loyalty' },
    { icon: <Star size={18} />, label: 'Reviews & moderation' },
    { icon: <Globe size={18} />, label: 'Content & SEO' },
  ];

  const appsItems = [
    { icon: <Smartphone size={18} />, label: 'User app & website' },
    { icon: <Building2 size={18} />, label: 'Vendor app & portal' },
    { icon: <Users size={18} />, label: 'Agent website' },
    { icon: <Car size={18} />, label: 'Cab driver app' },
    { icon: <TruckIcon size={18} />, label: 'Bus crew app' },
  ];

  const technologyItems = [
    { icon: <Cpu size={18} />, label: 'Technology command', tag: 'LI…' },
    { icon: <Plug size={18} />, label: 'API & supplier hub', badge: 3 },
    { icon: <Rocket size={18} />, label: 'Release center' },
    { icon: <Flag size={18} />, label: 'Feature flags' },
    { icon: <BellIcon size={18} />, label: 'Notification orchestration' },
    { icon: <ListChecks size={18} />, label: 'Jobs & queues' },
    { icon: <Gauge size={18} />, label: 'Monitoring & SRE' },
    { icon: <BarChart3 size={18} />, label: 'Analytics & BI' },
  ];

  const governanceItems = [
    { icon: <ShieldCheck size={18} />, label: 'Governance command', tag: 'L…' },
    { icon: <Building size={18} />, label: 'Company & tax details' },
    { icon: <Lock size={18} />, label: 'Employees & access' },
    { icon: <Key size={18} />, label: 'Access governance' },
    { icon: <Fingerprint size={18} />, label: 'Fraud & risk' },
    { icon: <Shield size={18} />, label: 'Security center' },
    { icon: <FileCheck size={18} />, label: 'Privacy & policies' },
    { icon: <CheckSquare size={18} />, label: 'Compliance & controls' },
    { icon: <Gavel size={18} />, label: 'Legal operations' },
    { icon: <ScrollText size={18} />, label: 'Audit logs' },
    { icon: <Settings size={18} />, label: 'Global configuration' },
  ];

  const renderSimpleSection = (title, items) => (
    <div className="adm-section">
      <p className="adm-section-title">{title}</p>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="adm-link"
          onClick={() => handleNavClick(item.label)}
        >
          <span className="adm-icon">{item.icon}</span>
          <span className="adm-label">{item.label}</span>
          {typeof item.badge === 'number' && (
            <span className="adm-badge-count">{item.badge}</span>
          )}
          {item.tag && <span className="adm-tag">{item.tag}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="adm-shell">
      {isMobileMenuOpen && (
        <div className="adm-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`adm-side ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-mark">B</span>
          <div>
            <b>BirdMyTrip</b>
            <small>BIRDELLA INTERNATI...</small>
          </div>
          <button className="adm-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="adm-nav-scroll">
          <div className="adm-section">
            <p className="adm-section-title">COMMAND</p>
            {commandItems.map((item, idx) => (
              <div
                key={idx}
                className={`adm-link ${item.active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.label)}
              >
                <span className="adm-icon">{item.icon}</span>
                <span className="adm-label">{item.label}</span>
                {typeof item.badge === 'number' && (
                  <span className="adm-badge-count">{item.badge}</span>
                )}
              </div>
            ))}
          </div>

          <div className="adm-section">
            <p className="adm-section-title">VERTICAL CONTROL ROOMS</p>
            {verticalItems.map((item, idx) => (
              <div key={idx}>
                <div
                  className={`adm-link ${item.active ? 'active' : ''} ${item.isFlights ? 'has-dropdown' : ''}`}
                  onClick={item.isFlights ? handleFlightsClick : () => handleNavClick(item.label)}
                >
                  <span className="adm-icon">{item.icon}</span>
                  <span className="adm-label">{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span className="adm-badge-count">{item.badge}</span>
                  )}
                  {item.tag && <span className="adm-tag">{item.tag}</span>}
                  {item.isFlights && (
                    <ChevronDown
                      size={14}
                      className={`adm-dropdown-chevron ${isFlightsOpen ? 'open' : ''}`}
                    />
                  )}
                </div>

                {item.isFlights && isFlightsOpen && (
                  <div className="adm-flights-dropdown">
                    <div className="adm-flights-search">
                      <Search size={12} />
                      <input
                        type="text"
                        placeholder="Find a screen..."
                        value={flightSearch}
                        onChange={(e) => setFlightSearch(e.target.value)}
                      />
                    </div>
                    <div className="adm-flights-list">
                      {filteredFlightGroups.length === 0 ? (
                        <p className="adm-flights-empty">No matches</p>
                      ) : (
                        filteredFlightGroups.map((group) => (
                          <div key={group.heading}>
                            <p className="adm-flights-heading">{group.heading}</p>
                            {group.items.map((screen) => (
                              <div
                                key={screen}
                                className={`adm-flights-item ${activeFlightScreen === screen ? 'active' : ''}`}
                                onClick={() => handleFlightScreenClick(screen)}
                              >
                                {screen}
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {renderSimpleSection('COMMERCE NETWORK', commerceItems)}
          {renderSimpleSection('FINANCE', financeItems)}
          {renderSimpleSection('SERVICE & GROWTH', serviceItems)}
          {renderSimpleSection('APPS & WEBSITES', appsItems)}
          {renderSimpleSection('TECHNOLOGY', technologyItems)}
          {renderSimpleSection('GOVERNANCE', governanceItems)}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-user-profile">
            <div className="adm-avatar-small">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="adm-user-details">
              <b>{user.name || "Aryan"}</b>
              <small>Global Platform Admin...</small>
            </div>
            <div className="adm-status-dot"></div>
          </div>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top-header">
          <div className="adm-header-left">
            <button className="adm-mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="adm-header-title">
              <h2>
                {location.pathname === '/admin/my-work' ? 'My work'
                  : location.pathname === '/admin/approvals' ? 'Approval center'
                  : location.pathname === '/admin/incidents' ? 'Live incidents'
                  : location.pathname === '/admin/handovers' ? 'Shift handovers'
                  : location.pathname === '/admin/postmortems' ? 'Postmortems'
                  : location.pathname === '/admin/service-health' ? 'Service health'
                  : location.pathname === '/admin/change-calendar' ? 'Change calendar'
                  : location.pathname === '/admin/inbox' ? 'Operations inbox'
                  : location.pathname === '/admin/portfolio' ? 'Portfolio overview'
                  : location.pathname === '/admin/flights' ? 'Flights'
                  : location.pathname === '/admin/stays' ? 'Stays'
                  : location.pathname === '/admin/trains' ? 'Trains'
                  : location.pathname === '/admin/buses' ? 'Buses'
                  : location.pathname === '/admin/cabs' ? 'Cabs'
                  : location.pathname === '/admin/packages' ? 'Packages'
                  : location.pathname === '/admin/activities' ? 'Activities'
                  : location.pathname === '/admin/events' ? 'Events'
                  : location.pathname === '/admin/darshan' ? 'Darshan'
                  : location.pathname === '/admin/cruises' ? 'Cruises'
                  : location.pathname === '/admin/visa' ? 'Visa'
                  : location.pathname === '/admin/insurance' ? 'Insurance'
                  : 'Executive command'}
              </h2>
              <span className="adm-workspace-badge">
                <span className="dot"></span> WORKSPACE DATA
              </span>
              <p>Birdella International Private Limited · Executive Office</p>
            </div>
          </div>

          <div className="adm-header-right">
            <div className="adm-search-box">
              <Search size={16} />
              <input type="text" placeholder="Search authorized modules..." />
              <span className="adm-shortcut">⌘K</span>
            </div>
            <button className="adm-icon-btn"><LinkIcon size={16}/> Copy link</button>
            <button className="adm-icon-btn"><Bell size={16}/></button>

            <div className="adm-profile-pill">
              <span className="adm-avatar">{(user.name || "A").charAt(0).toUpperCase()}</span>
              <div>
                <b>{user.name || "Aryan"}</b>
                <small>Executive Office</small>
              </div>
              <ChevronDown size={14} />
            </div>

            <div className="adm-market-pill">
              <span>All markets</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}