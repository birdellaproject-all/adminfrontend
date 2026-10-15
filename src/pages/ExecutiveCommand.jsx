import React, { useEffect, useState, useRef } from 'react';
import { 
  fetchExecutiveStats, 
  fetchServiceHealth, 
  fetchCommandNow, 
  fetchModuleCards, 
  fetchOperatingControls 
} from '../services/api';
import { 
  RefreshCw, Download, ChevronDown, ChevronRight, Activity, Users, 
  ShieldCheck, AlertTriangle, Zap, Check 
} from 'lucide-react';
import './ExecutiveCommand.css';

export default function ExecutiveCommand() {
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [commands, setCommands] = useState([]);
  const [modules, setModules] = useState(null);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ---- DATE DROPDOWN STATE ----
  const [dateRange, setDateRange] = useState("Today");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, svcRes, cmdRes, modRes, ctrlRes] = await Promise.all([
        fetchExecutiveStats(),
        fetchServiceHealth(),
        fetchCommandNow(),
        fetchModuleCards(),
        fetchOperatingControls()
      ]);
      setStats(statsRes.data);
      setServices(svcRes.data.items);
      setCommands(cmdRes.data.items);
      setModules(modRes.data);
      setControls(ctrlRes.data.items);
    } catch (err) {
      console.error("Error loading executive data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]); // Reload when date range changes

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleSituationReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Service,Category,Status,Latency,Traffic,Errors,Saturation\n"
      + services.map(s => `${s.service},${s.category},${s.status},${s.latency},${s.traffic},${s.errors},${s.saturation}%`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `situation_report_${dateRange.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenHealthCenter = () => {
    alert("Navigate to Health Center page");
  };

  const handleDateSelect = (range) => {
    setDateRange(range);
    setIsDateDropdownOpen(false);
  };

  if (loading) return <div className="exec-loading">Loading Executive Command Data...</div>;
  if (error) return (
    <div className="exec-loading" style={{ color: 'red' }}>
      <h3>Error: {error}</h3>
      <p>Check the browser console for details.</p>
    </div>
  );

  return (
    <div className="exec-content-area">
      
      {/* Banner */}
      <div className="exec-banner">
        <div>
          <div className="exec-banner-tag">
            <span className="dot"></span> GLOBAL COMMAND · WORKSPACE
          </div>
          <h1>BirdMyTrip executive overview</h1>
          <p>Commerce, travellers, supply, money and platform reliability in one governed view. Workspace sample data.</p>
        </div>
        <div className="exec-banner-actions">

          {/* ---- WORKING "TODAY" DROPDOWN ---- */}
          <div className="exec-dropdown-wrapper" ref={dateDropdownRef}>
            <button 
              className="exec-btn-secondary" 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            >
              {dateRange} <ChevronDown size={14} />
            </button>

            {isDateDropdownOpen && (
              <div className="exec-dropdown-menu">
                {["Today", "7 days", "30 days"].map((range) => (
                  <div 
                    key={range}
                    className={`exec-dropdown-item ${dateRange === range ? 'active' : ''}`}
                    onClick={() => handleDateSelect(range)}
                  >
                    <span>{range}</span>
                    {dateRange === range && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            className="exec-btn-secondary" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''}/> 
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            className="exec-btn-primary" 
            onClick={handleSituationReport}
          >
            <Download size={14}/> Situation report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="exec-filters">
        <div className="exec-filter-group">
          <label>Market scope</label>
          <select><option>All markets</option></select>
        </div>
        <div className="exec-filter-group">
          <label>Vertical</label>
          <select><option>All verticals</option></select>
        </div>
        <div className="exec-filter-right">
          <div className="exec-toggle">
            <div className="toggle-switch on"></div>
            <span>Auto-refresh</span>
          </div>
          <span className="exec-scope-tag">Global Platform Administration · scoped access</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="exec-stats-grid">
        <div className="exec-stat-card">
          <div className="exec-stat-header">
            <span>GROSS BOOKING VALUE</span>
            <Activity size={16} className="text-green"/>
          </div>
          <h2>{stats?.grossBookingValue?.formatted || '₹0'}</h2>
          <p className="text-green">+{stats?.grossBookingValue?.change || 0}% vs previous period</p>
        </div>
        <div className="exec-stat-card">
          <div className="exec-stat-header">
            <span>ACTIVE TRAVELLERS</span>
            <Users size={16} className="text-blue"/>
          </div>
          <h2>{stats?.activeTravellers?.value || 0}</h2>
          <p>{stats?.activeTravellers?.inService || 0} currently in service</p>
        </div>
        <div className="exec-stat-card">
          <div className="exec-stat-header">
            <span>BMT DIRECT SHARE</span>
            <ShieldCheck size={16} className="text-green"/>
          </div>
          <h2>{stats?.bmtDirectShare?.value || 0}%</h2>
          <p>Direct inventory ranked first</p>
        </div>
        <div className="exec-stat-card">
          <div className="exec-stat-header">
            <span>COMMAND ACTIONS</span>
            <AlertTriangle size={16} className="text-yellow"/>
          </div>
          <h2>{stats?.commandActions?.value || 0}</h2>
          <p>{stats?.commandActions?.critical || 0} critical · {stats?.commandActions?.approvals || 0} approvals</p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="exec-main-grid">
        
        <div className="exec-left-col">
          <div className="exec-panel">
            <div className="exec-panel-header">
              <div>
                <h3>Service health · golden signals</h3>
                <p>Latency, traffic, errors and saturation across customer journeys</p>
              </div>
              <button className="exec-btn-link" onClick={handleOpenHealthCenter}>
                Open health center
              </button>
            </div>
            
            <div className="exec-table-container">
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>SERVICE</th>
                    <th>STATUS</th>
                    <th>LATENCY</th>
                    <th>TRAFFIC</th>
                    <th>ERRORS</th>
                    <th>SATURATION</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Service">
                        <div className="exec-table-title">{s.service}</div>
                        <div className="exec-table-sub">{s.category}</div>
                      </td>
                      <td data-label="Status">
                        <span className={`exec-badge status-${s.status.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                      <td data-label="Latency">{s.latency}</td>
                      <td data-label="Traffic">{s.traffic}</td>
                      <td data-label="Errors">{s.errors}</td>
                      <td data-label="Saturation">
                        <div className="exec-progress-bar">
                          <div className="exec-progress-fill" style={{width: `${s.saturation}%`}}></div>
                        </div>
                        <span className="exec-progress-text">{s.saturation}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="exec-module-grid">
            {modules && Object.values(modules).map((mod, idx) => (
              <div key={idx} className="exec-module-card">
                <div className="exec-module-header">
                  <h4>{mod.title}</h4>
                  <ChevronRight size={14} className="text-gray"/>
                </div>
                <h3>{mod.value}</h3>
                <p>{mod.subValue}</p>
                <div className="exec-progress-bar">
                  <div className="exec-progress-fill" style={{width: `${mod.progress}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="exec-right-col">
          <div className="exec-panel">
            <div className="exec-panel-header">
              <h3>Command now</h3>
              <span className="exec-badge-action">Action</span>
            </div>
            <div className="exec-command-list">
              {commands.map((cmd) => (
                <div key={cmd.id} className="exec-command-item">
                  <div className="exec-command-priority">
                    <span className={`exec-priority-badge p-${cmd.priority.toLowerCase()}`}>{cmd.priority}</span>
                  </div>
                  <div className="exec-command-content">
                    <h4>{cmd.title}</h4>
                    <p>{cmd.timeAgo}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray"/>
                </div>
              ))}
            </div>
          </div>

          <div className="exec-panel">
            <h3>Operating controls</h3>
            <div className="exec-control-list">
              {controls.map((ctrl) => (
                <div key={ctrl.id} className="exec-control-item">
                  <div className="exec-control-icon"><Zap size={16}/></div>
                  <div className="exec-control-content">
                    <h4>{ctrl.title}</h4>
                    <p>{ctrl.value}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}