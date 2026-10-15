// src/pages/ShiftHandovers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, AlertTriangle, CheckCircle2, Shield, Plus, X,
  Loader2, ChevronRight, ClipboardCheck
} from 'lucide-react';
import './ShiftHandovers.css';

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
const fetchHandoverStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchHandoverList = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/list?${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const fetchHandoverOne = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Detail failed: ${res.status}`);
  return res.json();
};

const createHandover = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/`, {
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

const acceptHandover = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/${id}/accept`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Accept failed (${res.status}): ${text}`);
  }
  return res.json();
};

const updateChecklist = async (id, checklist) => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/${id}/checklist`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ checklist }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Checklist update failed (${res.status}): ${text}`);
  }
  return res.json();
};

const deleteHandover = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/shift-handovers/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
};

// ---- Helpers ----
const statusClass = (status) => {
  const map = {
    "Pending acceptance": 'status-pending',
    "Accepted": 'status-accepted',
    "Rejected": 'status-rejected',
    "Completed": 'status-completed',
  };
  return map[status] || 'status-pending';
};

const riskClass = (severity) => {
  const map = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    critical: 'risk-critical',
  };
  return map[severity] || 'risk-medium';
};

export default function ShiftHandovers() {
  const [stats, setStats] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionId, setActionId] = useState(null);

  // ---- Detail panel state ----
  const [openHandover, setOpenHandover] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- New handover modal ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    operationalSummary: '',
    outgoing: '',
    incoming: '',
    risks: '',
  });

  // ---- Load stats + list ----
  const loadData = useCallback(async () => {
    try {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {};
      const [statsRes, listRes] = await Promise.all([
        fetchHandoverStats(),
        fetchHandoverList(params),
      ]);
      setStats(statsRes.data);
      setHandovers(listRes.data.items || []);
    } catch (err) {
      console.error("Shift handovers load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Open detail panel ----
  const handleOpenDetail = async (handover) => {
    setOpenHandover({ ...handover, full: null });
    setDetailLoading(true);
    try {
      const res = await fetchHandoverOne(handover.id);
      setOpenHandover({ ...handover, full: res.data });
    } catch (err) {
      console.error("Detail load error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => setOpenHandover(null);

  // ---- Accept handover ----
  const handleAccept = async (handover) => {
    if (!window.confirm(`Accept handover "${handover.title}"?`)) return;
    setActionId(handover.id);

    setHandovers((prev) =>
      prev.map((h) =>
        h.id === handover.id ? { ...h, status: 'Accepted', progress: 100 } : h
      )
    );

    try {
      await acceptHandover(handover.id);
      console.log(`✅ ${handover.handoverId} accepted`);
      setTimeout(() => loadData(), 800);
      if (openHandover?.id === handover.id) {
        setOpenHandover((prev) => ({ ...prev, status: 'Accepted', progress: 100 }));
      }
    } catch (err) {
      console.error("Accept error:", err);
      setHandovers((prev) =>
        prev.map((h) =>
          h.id === handover.id ? { ...h, status: handover.status, progress: handover.progress } : h
        )
      );
      alert(`❌ Could not accept.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Toggle checklist item ----
  const handleToggleChecklistItem = async (index) => {
    if (!openHandover?.full?.checklist) return;

    // Optimistic update
    const newChecklist = openHandover.full.checklist.map((c, i) =>
      i === index ? { ...c, checked: !c.checked } : c
    );
    const newProgress = Math.round(
      (newChecklist.filter((c) => c.checked).length / newChecklist.length) * 100
    );

    setOpenHandover((prev) => ({
      ...prev,
      full: { ...prev.full, checklist: newChecklist, progress: newProgress },
    }));

    try {
      await updateChecklist(openHandover.id, newChecklist);
      console.log(`✅ Checklist updated (${newProgress}%)`);
      // Refresh list to keep progress bar in sync
      setTimeout(() => loadData(), 500);
    } catch (err) {
      console.error("Checklist update error:", err);
      alert(`❌ Could not update checklist.\n\n${err.message}`);
      // Revert on error
      handleOpenDetail(openHandover);
    }
  };

  // ---- Create handover ----
  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("Title is required.");
    if (!form.outgoing.trim()) return alert("Outgoing team is required.");
    if (!form.incoming.trim()) return alert("Incoming team is required.");

    setSubmitting(true);
    try {
      // Parse risks from comma-separated input
      const risks = form.risks
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => ({ title: r, severity: 'medium' }));

      const payload = {
        handoverId: `HND-${Date.now()}`,
        title: form.title,
        operationalSummary: form.operationalSummary,
        outgoing: form.outgoing,
        incoming: form.incoming,
        risks,
        status: "Pending acceptance",
      };
      await createHandover(payload);
      alert("✅ Handover created");
      setIsModalOpen(false);
      setForm({
        title: '',
        operationalSummary: '',
        outgoing: '',
        incoming: '',
        risks: '',
      });
      loadData();
    } catch (err) {
      console.error("Create handover error:", err);
      alert(`❌ Could not create handover.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete handover ----
  const handleDelete = async (handover) => {
    if (!window.confirm(`Delete "${handover.title}"?`)) return;
    setActionId(handover.id);
    try {
      await deleteHandover(handover.id);
      setHandovers((prev) => prev.filter((h) => h.id !== handover.id));
      if (openHandover?.id === handover.id) handleCloseDetail();
    } catch (err) {
      alert(`❌ Could not delete.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="sh-loading">Loading Shift Handovers...</div>;
  if (error) return <div className="sh-loading" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="sh-content-area">

      {/* Header */}
      <div className="sh-header">
        <div>
          <p className="sh-header-tag">CONTINUITY OF OPERATIONS</p>
          <h1>Shift Handovers</h1>
          <p className="sh-header-desc">
            Transfer live incidents, approvals, customer commitments, risks and ownership without losing operational context.
          </p>
        </div>
        <div className="sh-header-actions">
          <button className="sh-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Create handover
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sh-stats-grid">
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>PENDING ACCEPTANCE</span>
            <Users size={16} className="text-blue" />
          </div>
          <h2>{stats?.pendingAcceptance?.value ?? 0}</h2>
          <p>{stats?.pendingAcceptance?.subValue || 'Require incoming owner'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>UNRESOLVED RISKS</span>
            <AlertTriangle size={16} className="text-yellow" />
          </div>
          <h2>{stats?.unresolvedRisks?.value ?? 0}</h2>
          <p>{stats?.unresolvedRisks?.subValue || 'Across active handovers'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>ON-SHIFT TEAMS</span>
            <Users size={16} className="text-blue" />
          </div>
          <h2>{stats?.onShiftTeams?.value ?? 0}</h2>
          <p>{stats?.onShiftTeams?.subValue || 'Global operations'}</p>
        </div>
        <div className="sh-stat-card">
          <div className="sh-stat-header">
            <span>HANDOVER COMPLIANCE</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h2>{stats?.handoverCompliance?.value || '0%'}</h2>
          <p>{stats?.handoverCompliance?.subValue || 'Checklist + acceptance'}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="sh-filters">
        <select
          className="sh-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Pending acceptance">Pending acceptance</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="sh-cards-grid">
        {handovers.length === 0 ? (
          <div className="sh-empty">
            <Users size={32} />
            <h3>No handovers in this view</h3>
            <p>Create one or change the filter.</p>
          </div>
        ) : (
          handovers.map((h) => (
            <div key={h.id} className="sh-card">
              <div className="sh-card-top">
                <span className={`sh-status-tag ${statusClass(h.status)}`}>
                  {h.status}
                </span>
                <span className="sh-handover-id">{h.handoverId}</span>
              </div>

              <h3 className="sh-card-title">{h.title}</h3>
              {h.operationalSummary && (
                <p className="sh-card-summary">{h.operationalSummary}</p>
              )}

              <div className="sh-team-grid">
                <div className="sh-team-box">
                  <span>OUTGOING</span>
                  <b>{h.outgoing || '—'}</b>
                </div>
                <div className="sh-team-box">
                  <span>INCOMING</span>
                  <b>{h.incoming || '—'}</b>
                </div>
              </div>

              <div className="sh-progress">
                <div className="sh-progress-fill" style={{ width: `${h.progress}%` }} />
              </div>

              <div className="sh-card-footer">
                <span className="sh-risks-count">
                  {h.risksCount} risk{h.risksCount !== 1 ? 's' : ''}
                </span>
                <div className="sh-card-actions">
                  {h.status === 'Pending acceptance' && (
                    <button
                      className="sh-action-btn accept"
                      onClick={() => handleAccept(h)}
                      disabled={actionId === h.id}
                    >
                      {actionId === h.id ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />}
                      Accept
                    </button>
                  )}
                  <button
                    className="sh-action-btn view"
                    onClick={() => handleOpenDetail(h)}
                  >
                    View <ChevronRight size={12} />
                  </button>
                  <button
                    className="sh-action-btn delete"
                    onClick={() => handleDelete(h)}
                    disabled={actionId === h.id}
                    title="Delete"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          CREATE HANDOVER MODAL
          ===================================================== */}
      {isModalOpen && (
        <>
          <div className="sh-modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="sh-modal">
            <div className="sh-modal-header">
              <div>
                <h2>Create shift handover</h2>
                <p>Transfer operational context, risks and open items to the incoming team.</p>
              </div>
              <button className="sh-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="sh-modal-body">
              <div className="sh-field">
                <label>Handover title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Bus live operations"
                  autoFocus
                />
              </div>

              <div className="sh-field">
                <label>Operational summary</label>
                <textarea
                  rows={3}
                  value={form.operationalSummary}
                  onChange={(e) => setForm({ ...form, operationalSummary: e.target.value })}
                  placeholder="14 live trips; two delayed routes; seven crew devices awaiting sync."
                />
              </div>

              <div className="sh-field-row">
                <div className="sh-field">
                  <label>Outgoing team *</label>
                  <input
                    type="text"
                    value={form.outgoing}
                    onChange={(e) => setForm({ ...form, outgoing: e.target.value })}
                    placeholder="Morning Ground Ops"
                  />
                </div>
                <div className="sh-field">
                  <label>Incoming team *</label>
                  <input
                    type="text"
                    value={form.incoming}
                    onChange={(e) => setForm({ ...form, incoming: e.target.value })}
                    placeholder="Rohan Verma"
                  />
                </div>
              </div>

              <div className="sh-field">
                <label>Risks (comma-separated)</label>
                <input
                  type="text"
                  value={form.risks}
                  onChange={(e) => setForm({ ...form, risks: e.target.value })}
                  placeholder="PNQ–GOA delay 48 min, Supplier API degraded"
                />
              </div>
            </div>

            <div className="sh-modal-footer">
              <button className="sh-btn-cancel" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="sh-btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 size={14} className="spin" /> Creating...</>
                  : <><CheckCircle2 size={14} /> Create handover</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          DETAIL SIDE PANEL
          ===================================================== */}
      {openHandover && (
        <>
          <div className="sh-drawer-overlay" onClick={handleCloseDetail} />
          <aside className="sh-drawer">
            <div className="sh-drawer-header">
              <div>
                <span className={`sh-status-tag ${statusClass(openHandover.status)}`}>
                  {openHandover.status}
                </span>
                <h2>{openHandover.title}</h2>
                <p>{openHandover.handoverId}</p>
              </div>
              <button className="sh-drawer-close" onClick={handleCloseDetail}>
                <X size={18} />
              </button>
            </div>

            <div className="sh-drawer-body">
              {detailLoading ? (
                <div className="sh-drawer-loading">
                  <Loader2 size={20} className="spin" /> Loading detail...
                </div>
              ) : openHandover.full ? (
                <>
                  {/* Teams */}
                  <div className="sh-detail-section">
                    <h4>Teams</h4>
                    <div className="sh-team-grid">
                      <div className="sh-team-box">
                        <span>OUTGOING</span>
                        <b>{openHandover.full.outgoing || '—'}</b>
                      </div>
                      <div className="sh-team-box">
                        <span>INCOMING</span>
                        <b>{openHandover.full.incoming || '—'}</b>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {openHandover.full.operationalSummary && (
                    <div className="sh-detail-section">
                      <h4>Operational summary</h4>
                      <p className="sh-detail-text">{openHandover.full.operationalSummary}</p>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="sh-detail-section">
                    <div className="sh-detail-progress-header">
                      <h4>Progress</h4>
                      <span>{openHandover.full.progress}%</span>
                    </div>
                    <div className="sh-progress">
                      <div
                        className="sh-progress-fill"
                        style={{ width: `${openHandover.full.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist */}
                  {openHandover.full.checklist?.length > 0 && (
                    <div className="sh-detail-section">
                      <h4>
                        <ClipboardCheck size={14} /> Acceptance checklist
                      </h4>
                      <div className="sh-checklist">
                        {openHandover.full.checklist.map((item, idx) => (
                          <label key={idx} className="sh-checklist-row">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleChecklistItem(idx)}
                            />
                            <span className={item.checked ? 'checked' : ''}>{item.item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {openHandover.full.risks?.length > 0 && (
                    <div className="sh-detail-section">
                      <h4>
                        <AlertTriangle size={14} /> Risks ({openHandover.full.risks.length})
                      </h4>
                      <div className="sh-risks-list">
                        {openHandover.full.risks.map((r, idx) => (
                          <div key={idx} className="sh-risk-item">
                            <span className={`sh-risk-badge ${riskClass(r.severity)}`}>
                              {r.severity}
                            </span>
                            <span>{r.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="sh-detail-text">Failed to load details.</p>
              )}
            </div>

            <div className="sh-drawer-footer">
              {openHandover.status === 'Pending acceptance' && (
                <button
                  className="sh-btn-submit"
                  onClick={() => handleAccept(openHandover)}
                  disabled={actionId === openHandover.id}
                >
                  {actionId === openHandover.id ? (
                    <><Loader2 size={14} className="spin" /> Accepting...</>
                  ) : (
                    <><CheckCircle2 size={14} /> Accept handover</>
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