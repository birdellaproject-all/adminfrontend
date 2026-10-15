// src/pages/ServiceHealth.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle2, TrendingUp, Bell,
  RefreshCw, Shield, Zap, Loader2
} from 'lucide-react';
import './ServiceHealth.css';

// ---- Hardcoded API URL ----
const API_BASE_URL = "http://192.168.1.6:4000";

// ---- Auth headers ----
const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ---- Direct API calls ----
const fetchServiceStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/service-health/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchServiceList = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/service-health/list?${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const runHealthChecks = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/service-health/run-checks`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Run checks failed (${res.status}): ${text}`);
  }
  return res.json();
};

// ---- Category filter options ----
const CATEGORY_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Discovery", label: "Discovery" },
  { value: "Commerce", label: "Commerce" },
  { value: "Money", label: "Money" },
  { value: "Supply", label: "Supply" },
  { value: "Integrations", label: "Integrations" },
  { value: "Engagement", label: "Engagement" },
];

export default function ServiceHealth() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isRunningChecks, setIsRunningChecks] = useState(false);

  // ---- Load stats + list ----
  const loadData = useCallback(async () => {
    try {
      const params = categoryFilter !== 'All' ? { category: categoryFilter } : {};
      const [statsRes, listRes] = await Promise.all([
        fetchServiceStats(),
        fetchServiceList(params),
      ]);
      setStats(statsRes.data);
      setServices(listRes.data.items || []);
    } catch (err) {
      console.error("Service health load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Run health checks ----
  const handleRunChecks = async () => {
    setIsRunningChecks(true);
    try {
      const res = await runHealthChecks();
      alert(`✅ ${res.data.message}`);
      await loadData();
    } catch (err) {
      console.error("Run checks error:", err);
      alert(`❌ Could not run checks.\n\n${err.message}`);
    } finally {
      setIsRunningChecks(false);
    }
  };

  // ---- Navigate to Live Incidents ----
  const handleIncidentCommand = () => {
    navigate('/admin/incidents');
  };

  if (loading) return <div className="sh-loading">Loading Service Health...</div>;
  if (error) return (
    <div className="sh-loading" style={{ color: 'red' }}>Error: {error}</div>
  );

  // Helper to color status
  const statusClass = (status) => {
    const map = {
      Healthy: 'status-healthy',
      Warning: 'status-warning',
      Degraded: 'status-degraded',
      Down: 'status-down',
    };
    return map[status] || 'status-healthy';
  };

  return (
    <div className="sh-content-area">

      {/* Header */}
      <div className="sh-header">
        <div>
          <p className="sh-header-tag">RELIABILITY OPERATIONS</p>
          <h1>Service Health Center</h1>
          <p className="sh-header-desc">
            Customer-journey SLOs, dependencies and the four golden signals: latency, traffic, errors and saturation.
          </p>
        </div>
        <div className="sh-header-actions">
          <button
            className="sh-btn-secondary"
            onClick={handleRunChecks}
            disabled={isRunningChecks}
          >
            {isRunningChecks ? (
              <><Loader2 size={14} className="spin" /> Running...</>
            ) : (
              <><RefreshCw size={14} /> Run checks</>
            )}
          </button>
          <button
            className="sh-btn-primary"
            onClick={handleIncidentCommand}
          >
            <Shield size={14} /> Incident command
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="sh-stats-grid">
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>AVAILABILITY</span>
            <Activity size={16} className="text-blue" />
          </div>
          <h2>{stats?.availability?.value || '0%'}</h2>
          <p>{stats?.availability?.subValue || '30-day platform SLO'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>HEALTHY SERVICES</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h2>{stats?.healthyServices?.value || '0/0'}</h2>
          <p>{stats?.healthyServices?.subValue || 'Checking...'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>ERROR BUDGET</span>
            <TrendingUp size={16} className="text-blue" />
          </div>
          <h2>{stats?.errorBudget?.value || '0%'}</h2>
          <p>{stats?.errorBudget?.subValue || 'Monthly budget remaining'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>OPEN ALERTS</span>
            <Bell size={16} className="text-yellow" />
          </div>
          <h2>{stats?.openAlerts?.value ?? 0}</h2>
          <p>{stats?.openAlerts?.subValue || '0 require ownership'}</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sh-filters">
        <select
          className="sh-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="sh-scope-tag">Production · all authorized markets</span>
        <span className="sh-scope-note">
          Every acknowledgement records actor, service, state and time.
        </span>
      </div>

      {/* Service cards grid */}
      <div className="sh-services-grid">
        {services.length === 0 ? (
          <div className="sh-empty">
            <Activity size={32} />
            <h3>No services in this category</h3>
            <p>Try a different filter.</p>
          </div>
        ) : (
          services.map((s) => (
            <div key={s.id} className="sh-service-card">
              <div className="sh-service-top">
                <div className="sh-service-icon">
                  <Zap size={16} />
                </div>
                <span className={`sh-status-tag ${statusClass(s.status)}`}>
                  {s.status}
                </span>
              </div>

              <h3 className="sh-service-name">{s.serviceName}</h3>
              <p className="sh-service-path">{s.fullCategory}</p>

              <div className="sh-metrics-grid">
                <div className="sh-metric">
                  <span>LATENCY</span>
                  <b>{s.latency}</b>
                </div>
                <div className="sh-metric">
                  <span>TRAFFIC</span>
                  <b>{s.traffic}</b>
                </div>
                <div className="sh-metric">
                  <span>ERRORS</span>
                  <b>{s.errors}</b>
                </div>
                <div className="sh-metric">
                  <span>SATURATION</span>
                  <b>{s.saturation}</b>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}