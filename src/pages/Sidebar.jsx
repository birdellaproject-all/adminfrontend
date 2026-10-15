import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Inbox, 
  ShieldAlert, 
  Activity, 
  CalendarClock, 
  ArrowRightLeft, 
  FileSearch, 
  FileText,
  Plane,
  Hotel,
  Train,
  Bus,
  Car,
  Package,
  CalendarDays,
  Landmark,
  Ship
} from 'lucide-react';
import './Sidebar.css'; // We will create this next

const Sidebar = () => {
  // Define data to make the component cleaner
  const commandItems = [
    { icon: <Briefcase size={18} />, label: 'My work' },
    { icon: <LayoutDashboard size={18} />, label: 'Executive command', active: true },
    { icon: <CheckSquare size={18} />, label: 'Approval center', badge: 28 },
    { icon: <Inbox size={18} />, label: 'Operations inbox' },
    { icon: <ShieldAlert size={18} />, label: 'Live incidents', badge: 4 },
    { icon: <Activity size={18} />, label: 'Service health' },
    { icon: <CalendarClock size={18} />, label: 'Change calendar' },
    { icon: <ArrowRightLeft size={18} />, label: 'Shift handovers', badge: 2 },
    { icon: <FileSearch size={18} />, label: 'Postmortems', badge: 3 },
    { icon: <FileText size={18} />, label: 'Situation reports' },
  ];

  const verticalItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Portfolio overview', badge: 12 },
    { icon: <Plane size={18} />, label: 'Flights' },
    { icon: <Hotel size={18} />, label: 'Stays' },
    { icon: <Train size={18} />, label: 'Trains' },
    { icon: <Bus size={18} />, label: 'Buses' },
    { icon: <Car size={18} />, label: 'Cabs' },
    { icon: <Package size={18} />, label: 'Packages' },
    { icon: <Activity size={18} />, label: 'Activities' },
    { icon: <CalendarDays size={18} />, label: 'Events' },
    { icon: <Landmark size={18} />, label: 'Darshan', tag: 'BMT' },
    { icon: <Ship size={18} />, label: 'Cruises' },
  ];

  return (
    <div className="sidebar">
      {/* 1. Header / Logo */}
      <div className="sidebar-header">
        <div className="logo-icon">B</div>
        <div className="logo-text">
          <h2>BirdMyTrip</h2>
          <span>BIRDELLA INTERNATI...</span>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="sidebar-scroll-area">
        
        {/* Section: COMMAND */}
        <div className="nav-section">
          <p className="section-title">COMMAND</p>
          {commandItems.map((item, index) => (
            <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Section: VERTICAL CONTROL ROOMS */}
        <div className="nav-section">
          <p className="section-title">VERTICAL CONTROL ROOMS</p>
          {verticalItems.map((item, index) => (
            <div key={index} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.tag && <span className="nav-tag">{item.tag}</span>}
            </div>
          ))}
        </div>
        
        {/* Add extra spacing at bottom so content isn't hidden by footer */}
        <div style={{ height: '80px' }}></div>
      </div>

      {/* 2. Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">PS</div>
          <div className="user-info">
            <p className="user-name">Pranshu Singh</p>
            <p className="user-role">Global Platform Admin...</p>
          </div>
          <div className="status-indicator"></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;