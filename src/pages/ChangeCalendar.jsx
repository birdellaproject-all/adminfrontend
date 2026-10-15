// src/pages/ChangeCalendar.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, AlertTriangle, Shield, CheckCircle2, Plus, X,
  Loader2, ChevronRight, Clock
} from 'lucide-react';
import './ChangeCalendar.css';

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
const fetchChangeStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchChangeList = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/list?${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const fetchBlackouts = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/blackouts`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Blackouts failed: ${res.status}`);
  return res.json();
};

const createChange = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/`, {
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

const approveChange = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/${id}/approve`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Approve failed (${res.status}): ${text}`);
  }
  return res.json();
};

const rejectChange = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/${id}/reject`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Reject failed (${res.status}): ${text}`);
  }
  return res.json();
};

const deleteChange = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/change-calendar/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
};

// ---- Helpers ----
const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const statusClass = (status) => {
  const map = {
    Approved: 'status-approved',
    Review: 'status-review',
    Scheduled: 'status-scheduled',
    Rejected: 'status-rejected',
    Completed: 'status-completed',
  };
  return map[status] || 'status-scheduled';
};

const riskClass = (risk) => {
  const map = {
    Low: 'risk-low',
    Medium: 'risk-medium',
    High: 'risk-high',
    Critical: 'risk-critical',
  };
  return map[risk] || 'risk-medium';
};

export default function ChangeCalendar() {
  const [stats, setStats] = useState(null);
  const [changes, setChanges] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionId, setActionId] = useState(null);

  // ---- New change modal state ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    service: '',
    risk: 'Medium',
    windowStart: '',
    windowEnd: '',
    rollbackPlan: '',
    description: '',
  });

  // ---- Load all data ----
  const loadData = useCallback(async () => {
    try {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {};
      const [statsRes, listRes, blackoutsRes] = await Promise.all([
        fetchChangeStats(),
        fetchChangeList(params),
        fetchBlackouts(),
      ]);
      setStats(statsRes.data);
      setChanges(listRes.data.items || []);
      setBlackouts(blackoutsRes.data.items || []);
    } catch (err) {
      console.error("Change Calendar load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Create change ----
  const handleSubmitChange = async () => {
    if (!form.title.trim()) return alert("Change title is required.");
    if (!form.service.trim()) return alert("Service is required.");
    if (!form.windowStart || !form.windowEnd) return alert("Start and End times are required.");
    if (!form.rollbackPlan.trim()) return alert("Rollback plan is required.");

    setSubmitting(true);
    try {
      const payload = {
        changeId: `CHG-${Date.now()}`,
        title: form.title,
        service: form.service,
        environment: "Production",
        owner: form.service,
        risk: form.risk,
        status: "Scheduled",
        windowStart: new Date(form.windowStart).toISOString(),
        windowEnd: new Date(form.windowEnd).toISOString(),
        rollbackPlan: form.rollbackPlan,
        description: form.description,
      };
      await createChange(payload);
      alert("✅ Change scheduled successfully");
      setIsModalOpen(false);
      setForm({
        title: '',
        service: '',
        risk: 'Medium',
        windowStart: '',
        windowEnd: '',
        rollbackPlan: '',
        description: '',
      });
      loadData();
    } catch (err) {
      console.error("Create change error:", err);
      alert(`❌ Could not create change.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Approve ----
  const handleApprove = async (change) => {
    if (!window.confirm(`Approve "${change.title}"?`)) return;
    setActionId(change.id);
    setChanges((prev) =>
      prev.map((c) => c.id === change.id ? { ...c, status: 'Approved' } : c)
    );

    try {
      await approveChange(change.id);
      console.log(`✅ ${change.changeId} approved`);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      setChanges((prev) =>
        prev.map((c) => c.id === change.id ? { ...c, status: change.status } : c)
      );
      alert(`❌ Could not approve.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Reject ----
  const handleReject = async (change) => {
    if (!window.confirm(`Reject "${change.title}"?`)) return;
    setActionId(change.id);
    setChanges((prev) =>
      prev.map((c) => c.id === change.id ? { ...c, status: 'Rejected' } : c)
    );

    try {
      await rejectChange(change.id);
      console.log(`✅ ${change.changeId} rejected`);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      setChanges((prev) =>
        prev.map((c) => c.id === change.id ? { ...c, status: change.status } : c)
      );
      alert(`❌ Could not reject.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Delete ----
  const handleDelete = async (change) => {
    if (!window.confirm(`Delete "${change.title}"?`)) return;
    setActionId(change.id);
    try {
      await deleteChange(change.id);
      setChanges((prev) => prev.filter((c) => c.id !== change.id));
    } catch (err) {
      alert(`❌ Could not delete.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="cc-loading">Loading Change Calendar...</div>;
  if (error) return <div className="cc-loading" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="cc-content-area">

      {/* Header */}
      <div className="cc-header">
        <div>
          <p className="cc-header-tag">CONTROLLED PRODUCTION CHANGE</p>
          <h1>Change Calendar &amp; CAB</h1>
          <p className="cc-header-desc">
            Planned releases, maintenance, blackout windows, approvals and automatic scheduling-conflict detection.
          </p>
        </div>
        <div className="cc-header-actions">
          <button className="cc-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> New change
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="cc-stats-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-header">
            <span>THIS WEEK</span>
            <Calendar size={16} className="text-blue" />
          </div>
          <h2>{stats?.thisWeek?.value ?? 0}</h2>
          <p>{stats?.thisWeek?.subValue || 'Production changes'}</p>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-header">
            <span>CONFLICTS</span>
            <AlertTriangle size={16} className="text-yellow" />
          </div>
          <h2>{stats?.conflicts?.value ?? 0}</h2>
          <p>{stats?.conflicts?.subValue || 'Must resolve before approval'}</p>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-header">
            <span>BLACKOUT WINDOWS</span>
            <Shield size={16} className="text-green" />
          </div>
          <h2>{stats?.blackoutWindows?.value ?? 0}</h2>
          <p>{stats?.blackoutWindows?.subValue || 'Finance + peak commerce'}</p>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-header">
            <span>SUCCESS RATE</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h2>{stats?.successRate?.value || '0%'}</h2>
          <p>{stats?.successRate?.subValue || 'Rolling 90 days'}</p>
        </div>
      </div>

      {/* Blackout banners */}
      {blackouts.length > 0 && (
        <div className="cc-blackout-list">
          {blackouts.map((b) => (
            <div key={b.id} className="cc-blackout-banner">
              <Shield size={18} className="cc-blackout-icon" />
              <div className="cc-blackout-info">
                <b>{b.title}</b>
                <span>
                  {formatDateTime(b.windowStart)} – {formatDateTime(b.windowEnd)} · {b.reason}
                </span>
              </div>
              <span className="cc-blackout-tag">Blackout</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter row */}
      <div className="cc-filters">
        <select
          className="cc-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Approved">Approved</option>
          <option value="Review">Review</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Changes list */}
      <div className="cc-changes-list">
        {changes.length === 0 ? (
          <div className="cc-empty">
            <Calendar size={32} />
            <h3>No changes scheduled</h3>
            <p>Click "New change" to add one.</p>
          </div>
        ) : (
          changes.map((c) => (
            <div key={c.id} className="cc-change-card">
              <div className="cc-change-left">
                <div className="cc-change-icon">
                  <Calendar size={18} />
                </div>
                <div className="cc-change-info">
                  <h4>{c.title}</h4>
                  <p>
                    {c.changeId} · {c.service} · {c.environment}
                  </p>
                </div>
              </div>

              <div className="cc-change-middle">
                <div className="cc-window">
                  <b>{formatDateTime(c.windowStart)}</b>
                  <span>to {formatDateTime(c.windowEnd)}</span>
                </div>
              </div>

              <div className="cc-change-tags">
                <span className={`cc-risk-tag ${riskClass(c.risk)}`}>{c.risk}</span>
                <span className={`cc-status-tag ${statusClass(c.status)}`}>{c.status}</span>
                {c.hasConflict && (
                  <span className="cc-conflict-tag">
                    {c.conflictMessage || 'Overlap detected'}
                  </span>
                )}
                {!c.hasConflict && (
                  <span className="cc-none-tag">None</span>
                )}
              </div>

              <div className="cc-change-actions">
                {c.status === 'Scheduled' && !c.hasConflict && (
                  <button
                    className="cc-action-btn approve"
                    onClick={() => handleApprove(c)}
                    disabled={actionId === c.id}
                    title="Approve"
                  >
                    {actionId === c.id ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />}
                    Approve
                  </button>
                )}
                {c.status === 'Scheduled' && (
                  <button
                    className="cc-action-btn reject"
                    onClick={() => handleReject(c)}
                    disabled={actionId === c.id}
                    title="Reject"
                  >
                    Reject
                  </button>
                )}
                <button
                  className="cc-action-btn delete"
                  onClick={() => handleDelete(c)}
                  disabled={actionId === c.id}
                  title="Delete"
                >
                  <X size={12} />
                </button>
                <ChevronRight size={16} className="cc-chevron" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          NEW CHANGE MODAL
          ===================================================== */}
      {isModalOpen && (
        <>
          <div className="cc-modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="cc-modal">
            <div className="cc-modal-header">
              <div>
                <h2>Create production change</h2>
                <p>Conflict, blackout, owner, approval and rollback controls apply.</p>
              </div>
              <button className="cc-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cc-modal-body">
              <div className="cc-field">
                <label>Change title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Search ranking v18 rollout"
                  autoFocus
                />
              </div>

              <div className="cc-field-row">
                <div className="cc-field">
                  <label>Service *</label>
                  <input
                    type="text"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    placeholder="Search orchestration"
                  />
                </div>
                <div className="cc-field">
                  <label>Risk</label>
                  <select
                    value={form.risk}
                    onChange={(e) => setForm({ ...form, risk: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="cc-field-row">
                <div className="cc-field">
                  <label>Start *</label>
                  <input
                    type="datetime-local"
                    value={form.windowStart}
                    onChange={(e) => setForm({ ...form, windowStart: e.target.value })}
                  />
                </div>
                <div className="cc-field">
                  <label>End *</label>
                  <input
                    type="datetime-local"
                    value={form.windowEnd}
                    onChange={(e) => setForm({ ...form, windowEnd: e.target.value })}
                  />
                </div>
              </div>

              <div className="cc-field">
                <label>Rollback plan *</label>
                <textarea
                  rows={3}
                  value={form.rollbackPlan}
                  onChange={(e) => setForm({ ...form, rollbackPlan: e.target.value })}
                  placeholder="Feature flag to v17, restore snapshot, etc."
                />
              </div>

              <div className="cc-field">
                <label>Description (optional)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional context..."
                />
              </div>
            </div>

            <div className="cc-modal-footer">
              <button
                className="cc-btn-cancel"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="cc-btn-submit"
                onClick={handleSubmitChange}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 size={14} className="spin" /> Creating...</>
                ) : (
                  <>Check conflicts &amp; create</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}