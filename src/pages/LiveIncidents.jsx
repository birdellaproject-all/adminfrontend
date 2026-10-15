// src/pages/LiveIncidents.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield, Clock, Users, CheckCircle2, Plus, X,
  Loader2, FileText, ChevronRight
} from 'lucide-react';
import './LiveIncidents.css';

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

// ---- Direct API calls (no separate service file) ----
const fetchIncidentStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/live-incidents/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchIncidentList = async (filter = "Active") => {
  const url = `${API_BASE_URL}/admin/live-incidents/list?filter=${encodeURIComponent(filter)}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const createIncident = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/live-incidents/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create failed (${res.status}): ${text}`);
  }
  return res.json();
};

const updateIncidentStatus = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/admin/live-incidents/${id}/status`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Status update failed (${res.status}): ${text}`);
  }
  return res.json();
};

const deleteIncident = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/live-incidents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
};

// ---- Filter tabs ----
const FILTER_TABS = [
  { key: "Active", label: "Active" },
  { key: "Traveller safety", label: "Traveller safety" },
  { key: "Travel disruption", label: "Travel disruption" },
  { key: "Supplier outage", label: "Supplier outage" },
  { key: "Platform", label: "Platform" },
  { key: "Resolved", label: "Resolved" },
  { key: "All", label: "All" },
];

export default function LiveIncidents() {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Active");
  const [actionId, setActionId] = useState(null);

  // ---- Declare incident modal state ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    severity: 'P2',
    category: 'Platform',
    domain: '',
    region: 'All markets',
    impact: '',
    impactedBookings: '',
  });

  // ---- Load stats + list ----
  const loadData = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchIncidentStats(),
        fetchIncidentList(activeFilter),
      ]);
      setStats(statsRes.data);
      setIncidents(listRes.data.items || []);
    } catch (err) {
      console.error("Live Incidents load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Submit new incident ----
  const handleDeclareIncident = async () => {
    if (!form.title.trim()) {
      alert("Incident title is required.");
      return;
    }
    if (!form.domain.trim()) {
      alert("Affected service is required.");
      return;
    }
    if (!form.impact.trim()) {
      alert("Current impact is required.");
      return;
    }

    setSubmitting(true);
    try {
      const severityMap = {
        P0: "Critical",
        P1: "High",
        P2: "Medium",
        P3: "Low",
      };
      const payload = {
        incidentId: `INC-${Date.now()}`,
        title: form.title,
        severity: form.severity,
        severityLabel: severityMap[form.severity] || "Medium",
        category: form.category,
        domain: form.domain,
        region: form.region,
        impact: form.impact,
        impactedBookings: parseInt(form.impactedBookings) || 0,
      };
      await createIncident(payload);
      alert("✅ Incident declared and bridge opened");
      setIsModalOpen(false);
      setForm({
        title: '',
        severity: 'P2',
        category: 'Platform',
        domain: '',
        region: 'All markets',
        impact: '',
        impactedBookings: '',
      });
      // Refresh data
      loadData();
    } catch (err) {
      console.error("Declare incident error:", err);
      alert(`❌ Could not declare incident.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Update status (resolve / mitigate / monitor) ----
  const handleUpdateStatus = async (incident, newStatus) => {
    const id = incident.id;
    const confirmMsg = newStatus === "Resolved"
      ? `Resolve "${incident.title}"?`
      : `Set "${incident.title}" to ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionId(id);

    // Optimistic update
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: newStatus } : i
      )
    );

    try {
      await updateIncidentStatus(id, newStatus);
      console.log(`✅ ${incident.incidentId} → ${newStatus}`);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      console.error("Status update error:", err);
      // Rollback
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: incident.status } : i
        )
      );
      alert(`❌ Could not update status.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Delete (soft) ----
  const handleDelete = async (incident) => {
    if (!window.confirm(`Delete incident "${incident.title}"?\n\nThis will remove it from the list.`)) return;

    setActionId(incident.id);
    try {
      await deleteIncident(incident.id);
      setIncidents((prev) => prev.filter((i) => i.id !== incident.id));
      console.log(`✅ Deleted ${incident.incidentId}`);
    } catch (err) {
      console.error("Delete error:", err);
      alert(`❌ Could not delete.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="li-loading">Loading Live Incidents...</div>;
  if (error) return (
    <div className="li-loading" style={{ color: 'red' }}>Error: {error}</div>
  );

  return (
    <div className="li-content-area">

      {/* Header */}
      <div className="li-header">
        <div>
          <p className="li-header-tag">MAJOR INCIDENT OPERATIONS</p>
          <h1>Incident Command</h1>
          <p className="li-header-desc">
            Declare, mobilize, protect travellers, assign command roles, preserve the timeline, communicate and close with a postmortem.
          </p>
        </div>
        <div className="li-header-actions">
          <button className="li-btn-secondary">
            <FileText size={14} /> Postmortems
          </button>
          <button
            className="li-btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} /> Declare incident
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="li-stats-grid">
        <div className="li-stat-card">
          <div className="li-stat-header">
            <span>OPEN INCIDENTS</span>
            <Shield size={16} className="text-blue" />
          </div>
          <h2>{stats?.openIncidents?.value ?? 0}</h2>
          <p>{stats?.openIncidents?.subValue || "No P0"}</p>
        </div>
        <div className="li-stat-card">
          <div className="li-stat-header">
            <span>MTTA</span>
            <Clock size={16} className="text-blue" />
          </div>
          <h2>{stats?.mtta?.value || "0 sec"}</h2>
          <p>{stats?.mtta?.subValue || "Target under 60 seconds"}</p>
        </div>
        <div className="li-stat-card">
          <div className="li-stat-header">
            <span>IMPACTED BOOKINGS</span>
            <Users size={16} className="text-blue" />
          </div>
          <h2>{stats?.impactedBookings?.value ?? 0}</h2>
          <p>{stats?.impactedBookings?.subValue || "No active events"}</p>
        </div>
        <div className="li-stat-card">
          <div className="li-stat-header">
            <span>RESOLVED TODAY</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h2>{stats?.resolvedToday?.value ?? 0}</h2>
          <p>{stats?.resolvedToday?.subValue || "0 postmortems due"}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="li-filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`li-filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Incident cards */}
      <div className="li-incident-grid">
        {incidents.length === 0 ? (
          <div className="li-empty">
            <Shield size={32} />
            <h3>No incidents in this view</h3>
            <p>Try a different filter or declare a new incident.</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div key={inc.id} className="li-incident-card">
              <div className="li-incident-top">
                <span className={`li-severity-tag severity-${inc.severity.toLowerCase()}`}>
                  {inc.severity} {inc.severityLabel}
                </span>
                <span className={`li-status-tag status-${inc.status.toLowerCase()}`}>
                  {inc.status}
                </span>
              </div>

              <h3 className="li-incident-title">{inc.title}</h3>
              <p className="li-incident-path">
                {inc.incidentId} · {inc.domain} · {inc.region}
              </p>

              <div className="li-impact-box">
                <b>Impact:</b> {inc.impact}
              </div>

              <div className="li-incident-footer">
                <span>IC: {inc.ic?.name || 'Unassigned'}</span>
                <span>{inc.timeAgo}</span>
              </div>

              {/* Action buttons */}
              {inc.status !== 'Resolved' && (
                <div className="li-incident-actions">
                  {inc.status === 'Active' && (
                    <button
                      className="li-action-btn"
                      onClick={() => handleUpdateStatus(inc, "Mitigating")}
                      disabled={actionId === inc.id}
                    >
                      {actionId === inc.id ? <Loader2 size={12} className="spin" /> : null}
                      Mitigating
                    </button>
                  )}
                  {inc.status === 'Mitigating' && (
                    <button
                      className="li-action-btn"
                      onClick={() => handleUpdateStatus(inc, "Monitoring")}
                      disabled={actionId === inc.id}
                    >
                      {actionId === inc.id ? <Loader2 size={12} className="spin" /> : null}
                      Monitoring
                    </button>
                  )}
                  <button
                    className="li-action-btn resolve"
                    onClick={() => handleUpdateStatus(inc, "Resolved")}
                    disabled={actionId === inc.id}
                  >
                    Resolve
                  </button>
                  <button
                    className="li-action-btn delete"
                    onClick={() => handleDelete(inc)}
                    disabled={actionId === inc.id}
                    title="Delete"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          DECLARE INCIDENT MODAL
          ===================================================== */}
      {isModalOpen && (
        <>
          <div className="li-modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="li-modal">
            <div className="li-modal-header">
              <div>
                <h2>Declare production incident</h2>
                <p>Creates an audited incident, command bridge, timeline and initial response tasks.</p>
              </div>
              <button className="li-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="li-modal-body">
              <div className="li-field">
                <label>Incident title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Cab SOS · Jaipur Airport"
                  autoFocus
                />
              </div>

              <div className="li-field-row">
                <div className="li-field">
                  <label>Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="P0">P0 Critical</option>
                    <option value="P1">P1 High</option>
                    <option value="P2">P2 Medium</option>
                    <option value="P3">P3 Low</option>
                  </select>
                </div>
                <div className="li-field">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Traveller safety">Traveller safety</option>
                    <option value="Travel disruption">Travel disruption</option>
                    <option value="Supplier outage">Supplier outage</option>
                    <option value="Platform">Platform</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="li-field-row">
                <div className="li-field">
                  <label>Affected service *</label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    placeholder="Cab trip operations"
                  />
                </div>
                <div className="li-field">
                  <label>Market</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="India / All markets"
                  />
                </div>
              </div>

              <div className="li-field">
                <label>Current impact *</label>
                <textarea
                  rows={4}
                  value={form.impact}
                  onChange={(e) => setForm({ ...form, impact: e.target.value })}
                  placeholder="1 traveller · driver location live · ETA delayed 20 min"
                />
              </div>

              <div className="li-field">
                <label>Impacted bookings</label>
                <input
                  type="number"
                  value={form.impactedBookings}
                  onChange={(e) => setForm({ ...form, impactedBookings: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="li-modal-footer">
              <button
                className="li-btn-cancel"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="li-btn-submit"
                onClick={handleDeclareIncident}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 size={14} className="spin" /> Declaring...</>
                ) : (
                  <>Declare &amp; open bridge</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}