// src/pages/SituationReports.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FileText, Download, Calendar, Check, X, Loader2,
  Paperclip, ShieldCheck, Shield, Trash2
} from 'lucide-react';
import './SituationReports.css';

const API_BASE_URL = "http://192.168.1.6:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ---- Direct API calls ----
const fetchSections = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/sections`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Sections failed: ${res.status}`);
  return res.json();
};

const fetchPreview = async (sections) => {
  const q = sections && sections.length ? `?sections=${encodeURIComponent(sections.join(","))}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/preview${q}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
  return res.json();
};

const fetchReports = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/list`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const generateReport = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Generate failed (${res.status}): ${t}`);
  }
  return res.json();
};

const scheduleReport = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/schedule`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Schedule failed (${res.status}): ${t}`);
  }
  return res.json();
};

const deleteReport = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/situation-reports/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
};

// ---- CSV helper ----
const downloadCsv = (report) => {
  const rows = [
    ["BirdMyTrip Command Report", report.name],
    ["Report ID", report.reportId],
    ["Owner", report.owner],
    ["Generated", new Date(report.generatedAt).toISOString()],
    ["Scope", report.scope],
    [""],
    ["Section", "Value"],
    ...(report.content
      ? report.content.split("\n").map((line) => {
          const idx = line.indexOf(": ");
          if (idx > 0) return [line.slice(0, idx), line.slice(idx + 2)];
          return [line, ""];
        })
      : []),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${report.name.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function SituationReports() {
  const user = JSON.parse(localStorage.getItem("bmtAuthUser") || "{}");

  const [allSections, setAllSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [preview, setPreview] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportName, setReportName] = useState("Daily command briefing");
  const [isGenerating, setIsGenerating] = useState(false);

  // ---- Drawer state ----
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [submitting, setSubmitting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    title: "Schedule command report",
    reference: "",
    priority: "normal",
    owner: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    outputFormat: "CSV",
    scheduleFrequency: "Run once",
    approver: "",
    reason: "",
    evidenceNotes: "",
    evidenceFiles: [],
  });

  // ---- Load initial data ----
  const loadInitial = useCallback(async () => {
    try {
      const [secRes, listRes, prevRes] = await Promise.all([
        fetchSections(),
        fetchReports(),
        fetchPreview(),
      ]);
      setAllSections(secRes.data.sections || []);
      setSelectedSections(secRes.data.sections || []);
      setReports(listRes.data.items || []);
      setPreview(prevRes.data.sections || []);
    } catch (err) {
      console.error("Situation reports load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ---- Refresh preview when selection changes ----
  useEffect(() => {
    if (selectedSections.length === 0) {
      setPreview([]);
      return;
    }
    async function refreshPreview() {
      try {
        const res = await fetchPreview(selectedSections);
        setPreview(res.data.sections || []);
      } catch (err) {
        console.error("Preview error:", err);
      }
    }
    refreshPreview();
  }, [selectedSections]);

  // ---- Toggle section ----
  const toggleSection = (section) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // ---- Dynamic checklist ----
  const checklist = useMemo(() => {
    return [
      { key: 'scopeOwner', label: 'Scope and owner verified', desc: 'Actor, decision and timestamp will be retained.', complete: true },
      { key: 'fieldsComplete', label: 'Required fields completed', desc: 'Action title and reason must be filled.', complete: Boolean(scheduleForm.title.trim() && scheduleForm.reason.trim()) },
      { key: 'policyChecked', label: 'Policy and limit checked', desc: 'Reference ID and priority must be provided.', complete: Boolean(scheduleForm.reference.trim() && scheduleForm.priority) },
      { key: 'evidenceAttached', label: 'Evidence attached', desc: 'At least one note or file must be attached.', complete: Boolean(scheduleForm.evidenceNotes.trim() || scheduleForm.evidenceFiles.length > 0) },
      { key: 'approverIdentified', label: 'Approver identified', desc: 'An approver / maker-checker name is required.', complete: Boolean(scheduleForm.approver.trim()) },
    ];
  }, [scheduleForm]);

  const completeness = useMemo(() => {
    const done = checklist.filter((c) => c.complete).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  // ---- Generate & download ----
  const handleGenerate = async () => {
    if (!reportName.trim()) return alert("Report name is required.");
    if (selectedSections.length === 0) return alert("Select at least one section.");

    setIsGenerating(true);
    try {
      const res = await generateReport({
        name: reportName.trim(),
        sections: selectedSections,
      });
      const report = res.data.report;

      // Download CSV
      downloadCsv(report);

      // Refresh list
      const listRes = await fetchReports();
      setReports(listRes.data.items || []);

      alert(`✅ ${report.reportId} generated and downloaded`);
    } catch (err) {
      console.error("Generate error:", err);
      alert(`❌ Could not generate report.\n\n${err.message}`);
    } finally {
      setIsGenerating(false);
    }
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
    setScheduleForm((prev) => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...files],
    }));
    e.target.value = "";
  };

  const handleRemoveEvidenceFile = (index) => {
    setScheduleForm((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
    }));
  };

  // ---- Submit schedule ----
  const handleSubmitSchedule = async () => {
    if (!scheduleForm.title.trim()) {
      alert("Action title is required.");
      setActiveTab("details");
      return;
    }
    if (!scheduleForm.reason.trim()) {
      alert("Reason and expected outcome is required.");
      setActiveTab("details");
      return;
    }

    setSubmitting(true);
    try {
      await scheduleReport({
        name: reportName.trim() || scheduleForm.title,
        sections: selectedSections,
        scheduleFrequency: scheduleForm.scheduleFrequency,
        outputFormat: scheduleForm.outputFormat,
        nextRunAt: new Date(scheduleForm.effectiveDate).toISOString(),
      });

      alert("✅ Report scheduled");
      handleCloseDrawer();

      const listRes = await fetchReports();
      setReports(listRes.data.items || []);
    } catch (err) {
      alert(`❌ Could not schedule.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveTab("details");
    setScheduleForm({
      title: "Schedule command report",
      reference: "",
      priority: "normal",
      owner: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      outputFormat: "CSV",
      scheduleFrequency: "Run once",
      approver: "",
      reason: "",
      evidenceNotes: "",
      evidenceFiles: [],
    });
  };

  // ---- Delete report ----
  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete report "${report.name}"?`)) return;
    try {
      await deleteReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      alert(`❌ Could not delete.\n\n${err.message}`);
    }
  };

  if (loading) return <div className="sr-loading">Loading Situation Reports...</div>;
  if (error) return <div className="sr-loading" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="sr-content-area">

      {/* Header */}
      <div className="sr-header">
        <div>
          <p className="sr-header-tag">EXECUTIVE COMMUNICATION</p>
          <h1>Situation Reports</h1>
          <p className="sr-header-desc">
            Generate a scoped, repeatable command briefing from current operational truth and retain its generation history.
          </p>
        </div>
        <div className="sr-header-actions">
          <button className="sr-btn-secondary" onClick={() => setIsDrawerOpen(true)}>
            <Calendar size={14} /> Schedule delivery
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="sr-main-grid">

        {/* LEFT */}
        <div className="sr-panel">
          <h3>Report definition</h3>

          <div className="sr-field">
            <label>Report name *</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Daily command briefing"
            />
          </div>

          <div className="sr-field">
            <label>Included sections</label>
            <div className="sr-sections-list">
              {allSections.map((section) => {
                const checked = selectedSections.includes(section);
                return (
                  <label key={section} className="sr-section-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSection(section)}
                    />
                    <span>{section}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            className="sr-btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 size={14} className="spin" /> Generating...</>
            ) : (
              <><Download size={14} /> Generate &amp; download briefing</>
            )}
          </button>
        </div>

        {/* RIGHT */}
        <div className="sr-right-col">

          {/* Preview */}
          <div className="sr-panel">
            <h3>Live briefing preview</h3>

            <div className="sr-preview-header">
              <div className="sr-preview-tag">BIRDMYTRIP COMMAND</div>
              <h2>{reportName || "Untitled report"}</h2>
              <p>Production · authorized scope · prepared by {user.name || "Pranshu Singh"}</p>
            </div>

            <div className="sr-preview-grid">
              {preview.length === 0 ? (
                <div className="sr-empty-small">No sections selected.</div>
              ) : (
                preview.map((p) => (
                  <div key={p.section} className="sr-preview-card">
                    <span>{p.section.toUpperCase()}</span>
                    <b>{p.value}</b>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generated reports */}
          <div className="sr-panel">
            <h3>Generated reports</h3>
            {reports.length === 0 ? (
              <div className="sr-empty-state">
                <p>No report generated yet.</p>
              </div>
            ) : (
              <div className="sr-reports-list">
                {reports.map((r) => (
                  <div key={r.id} className="sr-report-item">
                    <div className="sr-report-icon">
                      <FileText size={16} />
                    </div>
                    <div className="sr-report-info">
                      <b>{r.name}</b>
                      <span>
                        {r.reportId} · {r.owner} · {new Date(r.generatedAt).toLocaleString()}
                        {r.isScheduled && " · Scheduled"}
                      </span>
                    </div>
                    <button
                      className="sr-report-delete"
                      onClick={() => handleDeleteReport(r)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          SCHEDULE DRAWER
          ===================================================== */}
      {isDrawerOpen && (
        <>
          <div className="sr-drawer-overlay" onClick={handleCloseDrawer} />
          <aside className="sr-drawer">
            <div className="sr-drawer-header">
              <div>
                <h2>Schedule command report</h2>
                <p>Executive report schedule · record a request for review and track it in Operations inbox.</p>
              </div>
              <button className="sr-drawer-close" onClick={handleCloseDrawer}>
                <X size={18} />
              </button>
            </div>

            {/* Banner */}
            <div className="sr-drawer-banner">
              <div className="sr-drawer-banner-left">
                <div className="sr-drawer-banner-icon">
                  <Shield size={18} />
                </div>
                <div>
                  <b>{selectedSections.join(", ") || "No sections selected"}</b>
                  <span>Executive Office · Global Platform Administration · All markets</span>
                </div>
              </div>
              <span className="sr-drawer-badge">Draft · report</span>
            </div>

            {/* Tabs */}
            <div className="sr-drawer-tabs">
              {[
                { key: 'details', label: 'Action details' },
                { key: 'checklist', label: 'Control checklist' },
                { key: 'evidence', label: 'Evidence' },
                { key: 'audit', label: 'Audit preview' },
              ].map((t) => (
                <span
                  key={t.key}
                  className={`sr-drawer-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </span>
              ))}
            </div>

            <div className="sr-drawer-body">

              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <>
                  <div className="sr-field">
                    <label>Action title *</label>
                    <input
                      type="text"
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                      placeholder="Schedule command report"
                    />
                  </div>

                  <div className="sr-field-row">
                    <div className="sr-field">
                      <label>Reference / record ID</label>
                      <input
                        type="text"
                        value={scheduleForm.reference}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, reference: e.target.value })}
                        placeholder="Booking, vendor, employee or API reference"
                      />
                    </div>
                    <div className="sr-field">
                      <label>Priority</label>
                      <select
                        value={scheduleForm.priority}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, priority: e.target.value })}
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="sr-field-row">
                    <div className="sr-field">
                      <label>Operational owner</label>
                      <input
                        type="text"
                        value={scheduleForm.owner || user.name || ""}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, owner: e.target.value })}
                        placeholder="Pranshu Singh"
                      />
                    </div>
                    <div className="sr-field">
                      <label>Effective date</label>
                      <input
                        type="date"
                        value={scheduleForm.effectiveDate}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, effectiveDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="sr-field-row">
                    <div className="sr-field">
                      <label>Output format</label>
                      <select
                        value={scheduleForm.outputFormat}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, outputFormat: e.target.value })}
                      >
                        <option value="CSV">CSV</option>
                        <option value="PDF">PDF</option>
                        <option value="TXT">TXT</option>
                      </select>
                    </div>
                    <div className="sr-field">
                      <label>Schedule</label>
                      <select
                        value={scheduleForm.scheduleFrequency}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleFrequency: e.target.value })}
                      >
                        <option value="Run once">Run once</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="sr-field">
                    <label>Approver / maker-checker</label>
                    <input
                      type="text"
                      value={scheduleForm.approver}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, approver: e.target.value })}
                      placeholder="Assigned manager / maker-checker"
                    />
                  </div>

                  <div className="sr-field">
                    <label>Reason, expected outcome and rollback *</label>
                    <textarea
                      rows={4}
                      value={scheduleForm.reason}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                      placeholder="Explain the operational need, expected result, customer impact and rollback path."
                    />
                  </div>
                </>
              )}

              {/* TAB 2: CHECKLIST */}
              {activeTab === 'checklist' && (
                <>
                  <div className="sr-readiness">
                    <div className="sr-readiness-header">
                      <div>
                        <h4>Submission readiness</h4>
                        <p>Every controlled change needs scope, policy, evidence and approval.</p>
                      </div>
                      <span className="sr-readiness-pct">{completeness}%</span>
                    </div>
                    <div className="sr-readiness-bar">
                      <div className="sr-readiness-fill" style={{ width: `${completeness}%` }} />
                    </div>
                  </div>

                  <div className="sr-checklist">
                    {checklist.map((item) => (
                      <div key={item.key} className="sr-checklist-item">
                        <div className={`sr-checklist-box ${item.complete ? 'checked' : ''}`}>
                          {item.complete && <Check size={12} />}
                        </div>
                        <div className="sr-checklist-text">
                          <b>{item.label}</b>
                          <span>{item.desc}</span>
                        </div>
                        <span className={`sr-checklist-status ${item.complete ? 'complete' : 'required'}`}>
                          {item.complete ? 'Complete' : 'Required'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 3: EVIDENCE */}
              {activeTab === 'evidence' && (
                <>
                  <div className="sr-field">
                    <label>Evidence and validation notes</label>
                    <textarea
                      rows={6}
                      value={scheduleForm.evidenceNotes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, evidenceNotes: e.target.value })}
                      placeholder="Source document, before/after values, test result, customer or supplier communication..."
                    />
                  </div>

                  <input
                    type="file"
                    id="sr-evidence-file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                    style={{ display: 'none' }}
                    onChange={handleAddEvidenceFile}
                  />
                  <label htmlFor="sr-evidence-file" className="sr-btn-add-evidence">
                    <Paperclip size={14} /> Add evidence file
                  </label>

                  {scheduleForm.evidenceFiles.length > 0 && (
                    <div className="sr-file-list">
                      {scheduleForm.evidenceFiles.map((file, idx) => (
                        <div key={idx} className="sr-file-item">
                          <FileText size={16} className="sr-file-icon" />
                          <div className="sr-file-info">
                            <b>{file.name}</b>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                          <button
                            className="sr-file-remove"
                            onClick={() => handleRemoveEvidenceFile(idx)}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TAB 4: AUDIT PREVIEW */}
              {activeTab === 'audit' && (
                <>
                  <div className="sr-audit-list">
                    <div className="sr-audit-item">
                      <span className="sr-audit-num">1</span>
                      <div>
                        <b>Draft opened</b>
                        <span>{user.name || "Pranshu Singh"} · Now</span>
                      </div>
                    </div>
                    <div className="sr-audit-item">
                      <span className="sr-audit-num">2</span>
                      <div>
                        <b>Scope derived</b>
                        <span>Global Platform Administration · All markets</span>
                      </div>
                    </div>
                    <div className="sr-audit-item">
                      <span className="sr-audit-num">3</span>
                      <div>
                        <b>Approval route</b>
                        <span>
                          {scheduleForm.approver || "Assigned manager / maker-checker"} · Unlimited · maker-checker exceptions logged
                        </span>
                      </div>
                    </div>
                    <div className="sr-audit-item">
                      <span className="sr-audit-num">4</span>
                      <div>
                        <b>Future state</b>
                        <span>Approval pending · {scheduleForm.effectiveDate || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sr-enforcement">
                    <div className="sr-enforcement-header">
                      <ShieldCheck size={14} />
                      <b>Enforcement preview</b>
                    </div>
                    <div className="sr-enforcement-grid">
                      <div className="sr-enforcement-card">
                        <span>EMPLOYEE ACTION</span>
                        <p>View, Create, Edit, Delete, Approve, Export, Refund, Cancel, Financial, Secrets, Staff, Publish, Assign</p>
                      </div>
                      <div className="sr-enforcement-card">
                        <span>REQUIRED ACTION</span>
                        <p>Export</p>
                      </div>
                      <div className="sr-enforcement-card">
                        <span>FINANCIAL AUTHORITY</span>
                        <p>Unlimited · maker-checker exceptions logged</p>
                      </div>
                      <div className="sr-enforcement-card">
                        <span>MARKET SCOPE</span>
                        <p>All markets</p>
                      </div>
                      <div className="sr-enforcement-card wide">
                        <span>OPERATION</span>
                        <p>Global Platform Administration</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sr-drawer-footer">
              <button className="sr-btn-cancel" onClick={handleCloseDrawer} disabled={submitting}>
                Cancel
              </button>
              <button className="sr-btn-submit" onClick={handleSubmitSchedule} disabled={submitting}>
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