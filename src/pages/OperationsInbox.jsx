// src/pages/OperationsInbox.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, Download, ClipboardCheck, 
  Check, X, Loader2, Inbox 
} from 'lucide-react';
import './OperationsInbox.css';

// ---- Hardcoded API URL ----
const API_BASE_URL = "http://192.168.1.6:4000";

// ---- Inline CSV export helper ----
const exportToCsv = (data, columns, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('Nothing to export — the list is empty.');
    return;
  }
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((item) =>
    columns
      .map((c) => {
        let value = c.key.split('.').reduce((obj, k) => obj?.[k], item);
        if (value === null || value === undefined) value = '';
        value = String(value).replace(/"/g, '""');
        return `"${value}"`;
      })
      .join(',')
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

// ---- Helper: Auth headers ----
const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ---- Direct API calls (no separate service file) ----
const fetchInboxStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/operations-inbox/stats`, { 
    headers: getHeaders() 
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
};

const fetchInboxList = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/operations-inbox/list?${query}`, { 
    headers: getHeaders() 
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
};

const approveInboxItem = async (id, reason = "") => {
  const res = await fetch(`${API_BASE_URL}/admin/operations-inbox/${id}/approve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Approve failed (${res.status}): ${text}`);
  }
  return res.json();
};

const rejectInboxItem = async (id, reason = "") => {
  const res = await fetch(`${API_BASE_URL}/admin/operations-inbox/${id}/reject`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Reject failed (${res.status}): ${text}`);
  }
  return res.json();
};

export default function OperationsInbox() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionId, setActionId] = useState(null);

  // ---- Load stats + list ----
  const loadData = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchInboxStats(),
        fetchInboxList({ limit: 50 }),
      ]);
      setStats(statsRes.data);
      setItems(listRes.data.items || []);
    } catch (err) {
      console.error("Operations Inbox load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Filtering (client-side) ----
  const filteredItems = items.filter((i) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (i.requestId || '').toLowerCase().includes(search) ||
      (i.title || '').toLowerCase().includes(search) ||
      (i.reference || '').toLowerCase().includes(search) ||
      (i.owner?.name || '').toLowerCase().includes(search);
    
    const matchesModule = moduleFilter === 'All' || i.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  // ---- Approve Handler ----
  const handleApprove = async (item) => {
    const reason = window.prompt(`Approve "${item.title}"?\n\nEnter reason (optional):`);
    if (reason === null) return;

    setActionId(item.id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, status: 'approved' } : i)
    );

    try {
      await approveInboxItem(item.id, reason);
      console.log(`✅ ${item.requestId} approved`);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      console.error("❌ Approve error:", err);
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: 'pending' } : i)
      );
      alert(`❌ Could not approve.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  // ---- Reject Handler ----
  const handleReject = async (item) => {
    const reason = window.prompt(`Reject "${item.title}"?\n\nEnter reason:`);
    if (reason === null) return;

    setActionId(item.id);

    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, status: 'rejected' } : i)
    );

    try {
      await rejectInboxItem(item.id, reason);
      console.log(`✅ ${item.requestId} rejected`);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      console.error("❌ Reject error:", err);
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: 'pending' } : i)
      );
      alert(`❌ Could not reject.\n\n${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="oi-loading">Loading Operations Inbox...</div>;
  if (error) return (
    <div className="oi-loading" style={{ color: 'red' }}>Error: {error}</div>
  );

  return (
    <div className="oi-content-area">

      {/* Header */}
      <div className="oi-header">
        <div>
          <p className="oi-header-tag">CROSS-MODULE REQUESTS</p>
          <h1>Operations inbox</h1>
          <p className="oi-header-desc">
            Review requests, record decisions and retain the reason for every change.
          </p>
        </div>
        <div className="oi-header-actions">
          <button 
  className="oi-btn-secondary"
  onClick={() => exportToCsv(
    filteredItems,
    [
      { key: 'requestId', label: 'Request ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'owner.name', label: 'Owner' },
      { key: 'owner.email', label: 'Owner Email' },
      { key: 'module', label: 'Module' },
      { key: 'reference', label: 'Reference' },
      { key: 'referenceType', label: 'Reference Type' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' },
      { key: 'decidedAt', label: 'Decided' },
    ],
    'operations_inbox'
  )}
>
  <Download size={14}/> Export requests
</button>
        </div>
      </div>

      {/* 3 Stats Cards */}
      <div className="oi-stats-grid">
        <div className="oi-stat-card">
          <p className="oi-stat-label">Pending review</p>
          <h2 className="oi-stat-value">{stats?.pendingReview?.value ?? 0}</h2>
        </div>
        <div className="oi-stat-card">
          <p className="oi-stat-label">Approved for execution</p>
          <h2 className="oi-stat-value">{stats?.approvedForExecution?.value ?? 0}</h2>
        </div>
        <div className="oi-stat-card">
          <p className="oi-stat-label">Rejected / cancelled</p>
          <h2 className="oi-stat-value">{stats?.rejectedCancelled?.value ?? 0}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="oi-filters">
        <div className="oi-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search ID, request, owner or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="oi-select"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Executive">Executive</option>
          <option value="Approvals">Approvals</option>
          <option value="Finance">Finance</option>
          <option value="Vendors">Vendors</option>
          <option value="Bookings">Bookings</option>
          <option value="Customers">Customers</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table / Empty State */}
      <div className="oi-table-wrapper">
        {filteredItems.length === 0 ? (
          <div className="oi-empty-state">
            <div className="oi-empty-icon">
              <ClipboardCheck size={32} />
            </div>
            <h3>No requests yet</h3>
            <p>Requests submitted from module actions will appear here.</p>
          </div>
        ) : (
          <table className="oi-table">
            <thead>
              <tr>
                <th>REQUEST</th>
                <th>OWNER</th>
                <th>MODULE</th>
                <th>REFERENCE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Request">
                    <div className="oi-table-title">{item.title}</div>
                    <div className="oi-table-sub">{item.requestId}</div>
                  </td>
                  <td data-label="Owner">
                    {item.owner?.name || 'Unknown'}
                  </td>
                  <td data-label="Module">
                    <span className="oi-module-tag">{item.module}</span>
                  </td>
                  <td data-label="Reference">
                    {item.reference || '—'}
                  </td>
                  <td data-label="Priority">
                    <span className={`oi-priority priority-${item.priority}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`oi-status status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td data-label="Created">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </td>
                  <td>
                    {item.status === 'pending' && (
                      <div className="oi-actions">
                        <button
                          className="oi-btn-approve"
                          onClick={() => handleApprove(item)}
                          disabled={actionId === item.id}
                          title="Approve"
                        >
                          {actionId === item.id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                        <button
                          className="oi-btn-reject"
                          onClick={() => handleReject(item)}
                          disabled={actionId === item.id}
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}