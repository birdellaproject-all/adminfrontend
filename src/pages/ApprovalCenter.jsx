// src/pages/ApprovalCenter.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchVendors, approveVendor, rejectVendor } from '../services/vendorApi';
import { 
  Search, Download, Plus, CheckCircle2, Clock, Shield, 
  Check, X, Loader2, Paperclip, ShieldCheck, FileText, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import './ApprovalCenter.css';

const API_BASE_URL = "https://bmtvendorfinal.onrender.com";
const PAGE_SIZE = 10;

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ---- Inline CSV export ----
const exportToCsv = (data, columns, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('Nothing to export — the list is empty.');
    return;
  }
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((item) =>
    columns.map((c) => {
      let value = c.key.split('.').reduce((obj, k) => obj?.[k], item);
      if (value === null || value === undefined) value = '';
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---- POST to Operations Inbox ----
const createInboxRequest = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/operations-inbox/`, {
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

export default function ApprovalCenter() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionId, setActionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Drawer state ----
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    reference: '',
    priority: 'normal',
    owner: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    approver: '',
    reason: '',
    evidenceNotes: '',
    evidenceFiles: [],
  });

  const user = JSON.parse(localStorage.getItem("bmtAuthUser") || "{}");

  // ---- Dynamic checklist (unchanged) ----
  const checklist = useMemo(() => {
    return [
      {
        key: 'scopeOwner',
        label: 'Scope and owner verified',
        desc: 'Actor, decision and timestamp will be retained.',
        complete: true,
      },
      {
        key: 'fieldsComplete',
        label: 'Required fields completed',
        desc: 'Action title and reason must be filled.',
        complete: Boolean(form.title.trim() && form.reason.trim()),
      },
      {
        key: 'policyChecked',
        label: 'Policy and limit checked',
        desc: 'Reference ID and priority must be provided.',
        complete: Boolean(form.reference.trim() && form.priority),
      },
      {
        key: 'evidenceAttached',
        label: 'Evidence attached',
        desc: 'At least one note or file must be attached.',
        complete: Boolean(form.evidenceNotes.trim() || form.evidenceFiles.length > 0),
      },
      {
        key: 'approverIdentified',
        label: 'Approver identified',
        desc: 'An approver / maker-checker name is required.',
        complete: Boolean(form.approver.trim()),
      },
    ];
  }, [form]);

  const completeness = useMemo(() => {
    const done = checklist.filter((c) => c.complete).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  // ---- Load vendors ----
  const loadVendors = useCallback(async () => {
    try {
      const res = await fetchVendors();
      setVendors(res.vendors || []);
    } catch (err) {
      console.error("Vendor fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  // ---- Filtering (memoized) ----
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        (v.name || '').toLowerCase().includes(search) ||
        (v.email || '').toLowerCase().includes(search) ||
        (v.businessName || '').toLowerCase().includes(search);
      const matchesCategory = categoryFilter === 'All' || v.vertical === categoryFilter;
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchTerm, categoryFilter, statusFilter]);

  // ---- Reset page on filter change ----
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageItems = filteredVendors.slice(startIndex, endIndex);

  // ---- Stats ----
  const openDecisions = vendors.filter((v) => v.status === 'PENDING').length;
  const approvedCount = vendors.filter((v) => v.status === 'APPROVED').length;
  const decidedToday = vendors.filter((v) => {
    if (!v.updatedAt) return false;
    return new Date(v.updatedAt).toDateString() === new Date().toDateString();
  }).length;

  // ---- Approve / Reject ----
  const handleApprove = async (vendor) => {
    const vendorId = vendor._id || vendor.id;
    const vendorName = vendor.businessName || vendor.name || 'Unnamed Vendor';
    if (!window.confirm(`Approve "${vendorName}"?`)) return;

    setActionId(vendorId);
    setVendors((prev) => prev.map((v) =>
      (v._id === vendorId || v.id === vendorId)
        ? { ...v, status: 'APPROVED', isApproved: true, updatedAt: new Date().toISOString() }
        : v
    ));

    try {
      await approveVendor(vendorId);
      setTimeout(() => loadVendors(), 800);
    } catch (err) {
      setVendors((prev) => prev.map((v) =>
        (v._id === vendorId || v.id === vendorId)
          ? { ...v, status: 'PENDING', isApproved: false } : v
      ));
      alert(`❌ Could not approve: ${err.message}`);
    } finally { setActionId(null); }
  };

  const handleReject = async (vendor) => {
    const vendorId = vendor._id || vendor.id;
    const vendorName = vendor.businessName || vendor.name || 'Unnamed Vendor';
    const reason = window.prompt(`Reject "${vendorName}"?\n\nEnter a reason:`);
    if (reason === null) return;

    setActionId(vendorId);
    setVendors((prev) => prev.map((v) =>
      (v._id === vendorId || v.id === vendorId)
        ? { ...v, status: 'REJECTED', isApproved: false, updatedAt: new Date().toISOString() }
        : v
    ));

    try {
      await rejectVendor(vendorId);
      setTimeout(() => loadVendors(), 800);
    } catch (err) {
      setVendors((prev) => prev.map((v) =>
        (v._id === vendorId || v.id === vendorId)
          ? { ...v, status: 'PENDING', isApproved: false } : v
      ));
      alert(`❌ Could not reject: ${err.message}`);
    } finally { setActionId(null); }
  };

  const handleExportQueue = () => {
    exportToCsv(filteredVendors, [
      { key: '_id', label: 'Vendor ID' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'name', label: 'Owner Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'vertical', label: 'Vertical' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'businessType', label: 'Business Type' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' },
    ], 'approval_queue');
  };

  // ---- Evidence file handlers ----
  const handleAddEvidenceFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      alert(`File "${oversized.name}" is larger than 5MB.`);
      return;
    }
    setForm((prev) => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...files],
    }));
    e.target.value = "";
  };

  const handleRemoveEvidenceFile = (index) => {
    setForm((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // ---- Submit ----
  const handleSubmitRequest = async () => {
    if (!form.title.trim()) {
      alert("Action title is required.");
      setActiveTab('details');
      return;
    }
    if (!form.reason.trim()) {
      alert("Reason and expected outcome is required.");
      setActiveTab('details');
      return;
    }

    setSubmitting(true);
    try {
      const evidenceSummary = [
        form.evidenceNotes.trim(),
        ...form.evidenceFiles.map((f) => `[File: ${f.name} (${formatFileSize(f.size)})]`),
      ].filter(Boolean).join("\n");

      const payload = {
        requestId: `REQ-${Date.now()}`,
        title: form.title,
        description: form.reason,
        reference: form.reference,
        referenceType: "approval",
        module: "Approvals",
        priority: form.priority,
        status: "pending",
        owner: {
          userId: user._id || user.id,
          name: form.owner || user.name,
          email: user.email,
        },
        evidence: evidenceSummary,
        approver: form.approver,
        effectiveDate: form.effectiveDate,
      };

      await createInboxRequest(payload);
      alert("✅ Request submitted to Operations Inbox");
      handleCloseDrawer();
    } catch (err) {
      alert(`❌ Could not submit.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveTab('details');
    setForm({
      title: '',
      reference: '',
      priority: 'normal',
      owner: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      approver: '',
      reason: '',
      evidenceNotes: '',
      evidenceFiles: [],
    });
  };

  if (loading) return <div className="ac-loading">Loading vendors...</div>;
  if (error) return <div className="ac-loading" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="ac-content-area">

      {/* Header */}
      <div className="ac-header">
        <div>
          <p className="ac-header-tag">MAKER-CHECKER GOVERNANCE</p>
          <h1>Approval Center</h1>
          <p className="ac-header-desc">
            One decision queue for vendor, finance, access, content and production changes with limits, separation of duties and complete evidence.
          </p>
        </div>
        <div className="ac-header-actions">
          <button className="ac-btn-secondary" onClick={handleExportQueue}>
            <Download size={14}/> Export queue
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ac-stats-grid">
        <div className="ac-stat-card">
          <div className="ac-stat-header"><span>OPEN DECISIONS</span><CheckCircle2 size={16} className="text-blue" /></div>
          <h2>{openDecisions}</h2>
          <p>Across authorized queues</p>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-header"><span>INSIDE SLA</span><Clock size={16} className="text-blue" /></div>
          <h2>94.7%</h2>
          <p>Rolling 7 days</p>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-header"><span>APPROVED TOTAL</span><Shield size={16} className="text-green" /></div>
          <h2>{approvedCount}</h2>
          <p>Protected by checker limits</p>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-header"><span>DECIDED TODAY</span><CheckCircle2 size={16} className="text-green" /></div>
          <h2>{decidedToday}</h2>
          <p>Median 12 minutes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ac-filters">
        <div className="ac-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search request, maker or owner..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="ac-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All Verticals</option>
          <option value="stay">Stay</option>
          <option value="bus">Bus</option>
          <option value="cab">Cab</option>
          <option value="cruise">Cruise</option>
          <option value="darshan">Darshan</option>
          <option value="activities">Activities</option>
          <option value="events">Events</option>
          <option value="packages">Packages</option>
        </select>
        <select className="ac-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="ac-table-wrapper">
        <table className="ac-table">
          <thead>
            <tr>
              <th>REQUEST</th><th>CATEGORY</th><th>PHONE</th>
              <th>MAKER → CHECKER</th><th>CREATED</th><th>STATUS</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan="7" className="ac-empty">No vendors match your filters.</td></tr>
            ) : (
              pageItems.map((v) => (
                <tr key={v._id}>
                  <td data-label="Request">
                    <div className="ac-table-title">{v.businessName || v.name || 'Unnamed Vendor'}</div>
                    <div className="ac-table-sub">{v.email || 'No email'}</div>
                  </td>
                  <td data-label="Category">
                    <span className="ac-category-tag">{(v.vertical || 'N/A').toUpperCase()}</span>
                  </td>
                  <td data-label="Phone">{v.phone || '—'}</td>
                  <td data-label="Maker">
                    <div className="ac-maker">
                      <span>{v.name || 'Unknown'}</span>
                      <span className="ac-arrow">→</span>
                      <span className="ac-checker">You</span>
                    </div>
                  </td>
                  <td data-label="Created">
                    {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td data-label="Status">
                    <span className={`ac-status status-${v.status.toLowerCase()}`}>{v.status}</span>
                  </td>
                  <td>
                    {v.status === 'PENDING' && (
                      <div className="ac-actions">
                        <button className="ac-btn-approve" onClick={() => handleApprove(v)}
                          disabled={actionId === v._id} title="Approve">
                          {actionId === v._id ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                        </button>
                        <button className="ac-btn-reject" title="Reject"
                          onClick={() => handleReject(v)} disabled={actionId === v._id}>
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {filteredVendors.length > 0 && (
          <div className="ac-pagination">
            <div className="ac-pagination-info">
              Showing <b>{startIndex + 1}</b>–<b>{Math.min(endIndex, filteredVendors.length)}</b> of <b>{filteredVendors.length}</b>
            </div>
            <div className="ac-pagination-controls">
              <button
                className="ac-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="ac-page-ellipsis">...</span>}
                    <button
                      className={`ac-page-num ${currentPage === p ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                className="ac-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer (unchanged) */}
      {isDrawerOpen && (
        <>
          <div className="ac-drawer-overlay" onClick={handleCloseDrawer} />
          <aside className="ac-drawer">
            <div className="ac-drawer-header">
              <div>
                <h2>New controlled approval request</h2>
                <p>Command approval · record a request for review and track it in Operations inbox.</p>
              </div>
              <button className="ac-drawer-close" onClick={handleCloseDrawer}>
                <X size={18} />
              </button>
            </div>

            <div className="ac-drawer-banner">
              <div className="ac-drawer-banner-left">
                <div className="ac-drawer-banner-icon"><Shield size={18} /></div>
                <div>
                  <b>Global Platform Administration</b>
                  <span>Executive Office · Global Platform Administration · All markets</span>
                </div>
              </div>
              <span className="ac-drawer-badge">Draft · operations</span>
            </div>

            <div className="ac-drawer-tabs">
              {[
                { key: 'details', label: 'Action details' },
                { key: 'checklist', label: 'Control checklist' },
                { key: 'evidence', label: 'Evidence' },
                { key: 'audit', label: 'Audit preview' },
              ].map((t) => (
                <span
                  key={t.key}
                  className={`ac-drawer-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </span>
              ))}
            </div>

            <div className="ac-drawer-body">
              {activeTab === 'details' && (
                <>
                  <div className="ac-field">
                    <label>Action title *</label>
                    <input type="text" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="New controlled approval request" />
                  </div>
                  <div className="ac-field-row">
                    <div className="ac-field">
                      <label>Reference / record ID</label>
                      <input type="text" value={form.reference}
                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                        placeholder="Booking, vendor, employee or API reference" />
                    </div>
                    <div className="ac-field">
                      <label>Priority</label>
                      <select value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="ac-field-row">
                    <div className="ac-field">
                      <label>Operational owner</label>
                      <input type="text" value={form.owner || user.name || ''}
                        onChange={(e) => setForm({ ...form, owner: e.target.value })}
                        placeholder="Pranshu Singh" />
                    </div>
                    <div className="ac-field">
                      <label>Effective date</label>
                      <input type="date" value={form.effectiveDate}
                        onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="ac-field">
                    <label>Approver / maker-checker</label>
                    <input type="text" value={form.approver}
                      onChange={(e) => setForm({ ...form, approver: e.target.value })}
                      placeholder="Assigned manager / maker-checker" />
                  </div>
                  <div className="ac-field">
                    <label>Reason, expected outcome and rollback *</label>
                    <textarea rows={5} value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Explain the operational need, expected result, customer impact and rollback path." />
                  </div>
                </>
              )}

              {activeTab === 'checklist' && (
                <>
                  <div className="ac-readiness">
                    <div className="ac-readiness-header">
                      <div>
                        <h4>Submission readiness</h4>
                        <p>Every controlled change needs scope, policy, evidence and approval.</p>
                      </div>
                      <span className="ac-readiness-pct">{completeness}%</span>
                    </div>
                    <div className="ac-readiness-bar">
                      <div className="ac-readiness-fill" style={{ width: `${completeness}%` }} />
                    </div>
                  </div>
                  <div className="ac-checklist">
                    {checklist.map((item) => (
                      <div key={item.key} className="ac-checklist-item">
                        <div className={`ac-checklist-box ${item.complete ? 'checked' : ''}`}>
                          {item.complete && <Check size={12} />}
                        </div>
                        <div className="ac-checklist-text">
                          <b>{item.label}</b>
                          <span>{item.desc}</span>
                        </div>
                        <span className={`ac-checklist-status ${item.complete ? 'complete' : 'required'}`}>
                          {item.complete ? 'Complete' : 'Required'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'evidence' && (
                <>
                  <div className="ac-field">
                    <label>Evidence and validation notes</label>
                    <textarea rows={6} value={form.evidenceNotes}
                      onChange={(e) => setForm({ ...form, evidenceNotes: e.target.value })}
                      placeholder="Source document, before/after values, test result, customer or supplier communication..." />
                  </div>
                  <input type="file" id="evidence-file-input" multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                    style={{ display: 'none' }}
                    onChange={handleAddEvidenceFile} />
                  <label htmlFor="evidence-file-input" className="ac-btn-add-evidence">
                    <Paperclip size={14} /> Add evidence file
                  </label>
                  {form.evidenceFiles.length > 0 && (
                    <div className="ac-file-list">
                      {form.evidenceFiles.map((file, idx) => (
                        <div key={idx} className="ac-file-item">
                          <FileText size={16} className="ac-file-icon" />
                          <div className="ac-file-info">
                            <b>{file.name}</b>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                          <button className="ac-file-remove"
                            onClick={() => handleRemoveEvidenceFile(idx)} title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'audit' && (
                <>
                  <div className="ac-audit-list">
                    <div className="ac-audit-item">
                      <span className="ac-audit-num">1</span>
                      <div><b>Draft opened</b><span>{user.name || 'Pranshu Singh'} · Now</span></div>
                    </div>
                    <div className="ac-audit-item">
                      <span className="ac-audit-num">2</span>
                      <div><b>Scope derived</b><span>Global Platform Administration · All markets</span></div>
                    </div>
                    <div className="ac-audit-item">
                      <span className="ac-audit-num">3</span>
                      <div><b>Approval route</b><span>{form.approver || 'Assigned manager / maker-checker'} · Unlimited · maker-checker exceptions logged</span></div>
                    </div>
                    <div className="ac-audit-item">
                      <span className="ac-audit-num">4</span>
                      <div><b>Future state</b><span>Approval pending · {form.effectiveDate || '—'}</span></div>
                    </div>
                  </div>
                  <div className="ac-enforcement">
                    <div className="ac-enforcement-header">
                      <ShieldCheck size={14} />
                      <b>Enforcement preview</b>
                    </div>
                    <div className="ac-enforcement-grid">
                      <div className="ac-enforcement-card">
                        <span>EMPLOYEE ACTION</span>
                        <p>View, Create, Edit, Delete, Approve, Export, Refund, Cancel, Financial, Secrets, Staff, Publish, Assign</p>
                      </div>
                      <div className="ac-enforcement-card">
                        <span>REQUIRED ACTION</span>
                        <p>Edit</p>
                      </div>
                      <div className="ac-enforcement-card">
                        <span>FINANCIAL AUTHORITY</span>
                        <p>Unlimited · maker-checker exceptions logged</p>
                      </div>
                      <div className="ac-enforcement-card">
                        <span>MARKET SCOPE</span>
                        <p>All markets</p>
                      </div>
                      <div className="ac-enforcement-card wide">
                        <span>OPERATION</span>
                        <p>Global Platform Administration</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ac-drawer-footer">
              <button className="ac-btn-cancel" onClick={handleCloseDrawer} disabled={submitting}>
                Cancel
              </button>
              <button className="ac-btn-submit" onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? <><Loader2 size={14} className="spin" /> Submitting...</>
                  : <><Check size={14} /> Submit controlled action</>}
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}