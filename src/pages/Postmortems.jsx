// src/pages/Postmortems.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, Activity, RefreshCw, CheckCircle2, Plus, X,
  Loader2, ChevronRight, Shield, FileText
} from 'lucide-react';
import './Postmortems.css';

const API_BASE_URL = "http://192.168.1.6:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ---- Direct API calls ----
const fetchStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchList = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/list?${q}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const fetchOne = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Detail failed: ${res.status}`);
  return res.json();
};

const createPostmortem = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Create failed (${res.status}): ${t}`);
  }
  return res.json();
};

const updateActions = async (id, actions) => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/${id}/actions`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ actions }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
};

const approvePostmortem = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/${id}/approve`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Approve failed (${res.status}): ${t}`);
  }
  return res.json();
};

const deletePostmortem = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/postmortems/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
};

// ---- Helpers ----
const statusClass = (s) => {
  const map = { Draft: 'status-draft', Review: 'status-review', Approved: 'status-approved', Closed: 'status-closed' };
  return map[s] || 'status-draft';
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD
};

export default function Postmortems() {
  const [stats, setStats] = useState(null);
  const [postmortems, setPostmortems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionId, setActionId] = useState(null);

  // ---- Drawer state ----
  const [openDrawer, setOpenDrawer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- New postmortem modal ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    incidentId: '',
    owner: '',
    dueDate: '',
    impact: '',
    detection: '',
    cause: '',
    lessons: '',
  });

  const user = JSON.parse(localStorage.getItem("bmtAuthUser") || "{}");

  // ---- Load data ----
  const loadData = useCallback(async () => {
    try {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {};
      const [statsRes, listRes] = await Promise.all([
        fetchStats(),
        fetchList(params),
      ]);
      setStats(statsRes.data);
      setPostmortems(listRes.data.items || []);
    } catch (err) {
      console.error("Postmortems load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ---- Open drawer ----
  const handleOpenDrawer = async (pm) => {
    setOpenDrawer({ ...pm, full: null });
    setDetailLoading(true);
    try {
      const res = await fetchOne(pm.id);
      setOpenDrawer({ ...pm, full: res.data });
    } catch (err) {
      console.error("Detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };
  const handleCloseDrawer = () => setOpenDrawer(null);

  // ---- Toggle action checkbox ----
  const handleToggleAction = async (index) => {
    if (!openDrawer?.full?.actions) return;

    const newActions = openDrawer.full.actions.map((a, i) =>
      i === index ? { ...a, done: !a.done } : a
    );

    setOpenDrawer((prev) => ({
      ...prev,
      full: { ...prev.full, actions: newActions },
    }));

    try {
      await updateActions(openDrawer.id, newActions);
      setTimeout(() => loadData(), 500);
    } catch (err) {
      console.error("Toggle action error:", err);
      alert(`❌ Could not update action.\n\n${err.message}`);
      handleOpenDrawer(openDrawer);
    }
  };

  // ---- Approve ----
  const handleApprove = async (pm) => {
    if (!window.confirm(`Approve and close "${pm.title}"?`)) return;
    setActionId(pm.id);

    try {
      await approvePostmortem(pm.id);
      console.log(`✅ ${pm.postmortemId} approved`);
      setTimeout(() => loadData(), 800);
      if (openDrawer?.id === pm.id) handleCloseDrawer();
    } catch (err) {
      alert(`❌ Could not approve.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Delete ----
  const handleDelete = async (pm) => {
    if (!window.confirm(`Delete "${pm.title}"?`)) return;
    setActionId(pm.id);
    try {
      await deletePostmortem(pm.id);
      setPostmortems((prev) => prev.filter((p) => p.id !== pm.id));
      if (openDrawer?.id === pm.id) handleCloseDrawer();
    } catch (err) {
      alert(`❌ Could not delete.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Create postmortem ----
  const handleCreate = async () => {
    if (!form.title.trim()) return alert("Title is required.");
    if (!form.incidentId.trim()) return alert("Incident ID is required.");
    if (!form.dueDate) return alert("Due date is required.");

    setSubmitting(true);
    try {
      const payload = {
        postmortemId: `PM-${Date.now().toString().slice(-6)}`,
        incidentId: form.incidentId,
        title: form.title,
        owner: form.owner || user.name,
        ownerEmail: user.email,
        dueDate: new Date(form.dueDate).toISOString(),
        status: 'Draft',
        impact: form.impact,
        detection: form.detection,
        cause: form.cause,
        lessons: form.lessons,
        actions: [
          {
            text: 'Review incident and identify preventative action',
            owner: form.owner || user.name,
            dueDate: new Date(form.dueDate).toISOString(),
            done: false,
          },
        ],
      };
      await createPostmortem(payload);
      alert("✅ Postmortem created");
      setIsModalOpen(false);
      setForm({
        title: '',
        incidentId: '',
        owner: '',
        dueDate: '',
        impact: '',
        detection: '',
        cause: '',
        lessons: '',
      });
      loadData();
    } catch (err) {
      alert(`❌ Could not create.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="pm-loading">Loading Postmortems...</div>;
  if (error) return <div className="pm-loading" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="pm-content-area">

      {/* Header */}
      <div className="pm-header">
        <div>
          <p className="pm-header-tag">LEARNING FROM INCIDENTS</p>
          <h1>Postmortems &amp; Prevention</h1>
          <p className="pm-header-desc">
            Blameless incident review with impact, detection, contributing factors, timeline and owned preventative actions.
          </p>
        </div>
        <div className="pm-header-actions">
          <button className="pm-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> New postmortem
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pm-stats-grid">
        <div className="pm-stat-card">
          <div className="pm-stat-header">
            <span>DUE THIS WEEK</span>
            <ClipboardList size={16} className="text-blue" />
          </div>
          <h2>{stats?.dueThisWeek?.value ?? 0}</h2>
          <p>{stats?.dueThisWeek?.subValue || 'Linked to resolved incidents'}</p>
        </div>
        <div className="pm-stat-card">
          <div className="pm-stat-header">
            <span>ACTIONS OPEN</span>
            <CheckCircle2 size={16} className="text-blue" />
          </div>
          <h2>{stats?.actionsOpen?.value ?? 0}</h2>
          <p>{stats?.actionsOpen?.subValue || 'Named owner + due date'}</p>
        </div>
        <div className="pm-stat-card">
          <div className="pm-stat-header">
            <span>REPEAT INCIDENTS</span>
            <RefreshCw size={16} className="text-blue" />
          </div>
          <h2>{stats?.repeatIncidents?.value || '0%'}</h2>
          <p>{stats?.repeatIncidents?.subValue || 'Rolling 90 days'}</p>
        </div>
        <div className="pm-stat-card">
          <div className="pm-stat-header">
            <span>ON-TIME CLOSURE</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h2>{stats?.onTimeClosure?.value || '0%'}</h2>
          <p>{stats?.onTimeClosure?.subValue || 'Approved reviews'}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="pm-filters">
        <select
          className="pm-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Review">Review</option>
          <option value="Approved">Approved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Cards */}
      <div className="pm-cards-grid">
        {postmortems.length === 0 ? (
          <div className="pm-empty">
            <ClipboardList size={32} />
            <h3>No postmortems</h3>
            <p>Create one to start capturing learnings.</p>
          </div>
        ) : (
          postmortems.map((pm) => (
            <div key={pm.id} className="pm-card">
              <div className="pm-card-top">
                <span className={`pm-status-tag ${statusClass(pm.status)}`}>{pm.status}</span>
                <span className="pm-due-date">Due {formatDate(pm.dueDate)}</span>
              </div>

              <h3 className="pm-card-title">{pm.title}</h3>
              <p className="pm-card-meta">
                {pm.postmortemId} · {pm.incidentId} · {pm.owner}
              </p>

              {pm.impact && <p className="pm-card-impact">{pm.impact}</p>}

              <div className="pm-progress">
                <div className="pm-progress-fill" style={{ width: `${pm.progress}%` }} />
              </div>

              <div className="pm-card-footer">
                <span className="pm-actions-count">
                  {pm.actionsDone}/{pm.actionsTotal} actions
                </span>
                <div className="pm-card-actions">
                  {pm.status !== 'Approved' && pm.status !== 'Closed' && (
                    <button
                      className="pm-action-btn approve"
                      onClick={() => handleApprove(pm)}
                      disabled={actionId === pm.id || pm.actionsDone < pm.actionsTotal}
                      title={pm.actionsDone < pm.actionsTotal ? 'All actions must be done first' : 'Approve'}
                    >
                      {actionId === pm.id ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />}
                      Approve
                    </button>
                  )}
                  <button className="pm-action-btn view" onClick={() => handleOpenDrawer(pm)}>
                    View <ChevronRight size={12} />
                  </button>
                  <button className="pm-action-btn delete" onClick={() => handleDelete(pm)} disabled={actionId === pm.id}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          CREATE MODAL
          ===================================================== */}
      {isModalOpen && (
        <>
          <div className="pm-modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div>
                <h2>Create incident postmortem</h2>
                <p>Post-incident review · record a request for review and track it in Operations inbox.</p>
              </div>
              <button className="pm-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="pm-modal-banner">
              <div className="pm-modal-banner-left">
                <div className="pm-modal-banner-icon"><Shield size={18} /></div>
                <div>
                  <b>Global Platform Administration</b>
                  <span>Executive Office · Global Platform Administration · All markets</span>
                </div>
              </div>
              <span className="pm-modal-badge">Draft · publish</span>
            </div>

            <div className="pm-modal-body">
              <div className="pm-field">
                <label>Action title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Create incident postmortem"
                  autoFocus
                />
              </div>

              <div className="pm-field-row">
                <div className="pm-field">
                  <label>Reference / incident ID *</label>
                  <input
                    type="text"
                    value={form.incidentId}
                    onChange={(e) => setForm({ ...form, incidentId: e.target.value })}
                    placeholder="INC-4382"
                  />
                </div>
                <div className="pm-field">
                  <label>Due date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="pm-field">
                <label>Operational owner</label>
                <input
                  type="text"
                  value={form.owner || user.name || ''}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  placeholder="Pranshu Singh"
                />
              </div>

              <div className="pm-field">
                <label>Impact</label>
                <textarea
                  rows={2}
                  value={form.impact}
                  onChange={(e) => setForm({ ...form, impact: e.target.value })}
                  placeholder="18 crew devices used offline manifests for 24 minutes."
                />
              </div>

              <div className="pm-field">
                <label>Reason, expected outcome and rollback *</label>
                <textarea
                  rows={4}
                  value={form.cause}
                  onChange={(e) => setForm({ ...form, cause: e.target.value })}
                  placeholder="Explain the operational need, expected result, customer impact and rollback path."
                />
              </div>
            </div>

            <div className="pm-modal-footer">
              <button className="pm-btn-cancel" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="pm-btn-submit" onClick={handleCreate} disabled={submitting}>
                {submitting ? <><Loader2 size={14} className="spin" /> Creating...</>
                  : <><CheckCircle2 size={14} /> Submit controlled action</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          DETAIL DRAWER
          ===================================================== */}
      {openDrawer && (
        <>
          <div className="pm-drawer-overlay" onClick={handleCloseDrawer} />
          <aside className="pm-drawer">
            <div className="pm-drawer-header">
              <div>
                <span className={`pm-status-tag ${statusClass(openDrawer.status)}`}>
                  {openDrawer.status}
                </span>
                <h2>{openDrawer.title}</h2>
                <p>{openDrawer.postmortemId} · {openDrawer.incidentId}</p>
              </div>
              <button className="pm-drawer-close" onClick={handleCloseDrawer}>
                <X size={18} />
              </button>
            </div>

            <div className="pm-drawer-body">
              {detailLoading ? (
                <div className="pm-drawer-loading">
                  <Loader2 size={20} className="spin" /> Loading detail...
                </div>
              ) : openDrawer.full ? (
                <>
                  {/* Impact */}
                  {openDrawer.full.impact && (
                    <div className="pm-detail-section">
                      <h4>Impact</h4>
                      <p className="pm-detail-text">{openDrawer.full.impact}</p>
                    </div>
                  )}

                  {/* Detection */}
                  {openDrawer.full.detection && (
                    <div className="pm-detail-section">
                      <h4>Detection</h4>
                      <p className="pm-detail-text">{openDrawer.full.detection}</p>
                    </div>
                  )}

                  {/* Cause */}
                  {openDrawer.full.cause && (
                    <div className="pm-detail-section">
                      <h4>Root cause</h4>
                      <p className="pm-detail-text">{openDrawer.full.cause}</p>
                    </div>
                  )}

                  {/* Lessons */}
                  {openDrawer.full.lessons && (
                    <div className="pm-detail-section">
                      <h4>Lessons</h4>
                      <p className="pm-detail-text">{openDrawer.full.lessons}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {openDrawer.full.actions?.length > 0 && (
                    <div className="pm-detail-section">
                      <h4><CheckCircle2 size={14} /> Preventative actions</h4>
                      <div className="pm-actions-list">
                        {openDrawer.full.actions.map((a, idx) => (
                          <label key={idx} className="pm-action-row">
                            <input
                              type="checkbox"
                              checked={a.done}
                              onChange={() => handleToggleAction(idx)}
                            />
                            <div className="pm-action-content">
                              <span className={a.done ? 'checked' : ''}>{a.text}</span>
                              <small>{a.owner} · Due {formatDate(a.dueDate)}</small>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="pm-detail-text">Failed to load details.</p>
              )}
            </div>

            <div className="pm-drawer-footer">
              {openDrawer.status !== 'Approved' && openDrawer.status !== 'Closed' && (
                <button
                  className="pm-btn-submit"
                  onClick={() => handleApprove(openDrawer)}
                  disabled={actionId === openDrawer.id}
                >
                  {actionId === openDrawer.id ? (
                    <><Loader2 size={14} className="spin" /> Approving...</>
                  ) : (
                    <><CheckCircle2 size={14} /> Approve &amp; close</>
                  )}
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}