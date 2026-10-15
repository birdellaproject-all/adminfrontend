// src/pages/MyWorkDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyWorkStats,
  fetchMyWorkQueue,
  fetchMyWorkWorkspaces,
  fetchMyWorkShift,
  fetchMyWorkCompletions,
} from '../services/api';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Clock,
  Users,
  Zap,
} from 'lucide-react';
import './MyWorkDashboard.css';

export default function MyWorkDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("bmtAuthUser") || "{}");

  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [shift, setShift] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [filter, setFilter] = useState("assigned");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [statsRes, queueRes, wsRes, shiftRes, compRes] = await Promise.all([
          fetchMyWorkStats(),
          fetchMyWorkQueue(filter),
          fetchMyWorkWorkspaces(),
          fetchMyWorkShift(),
          fetchMyWorkCompletions(),
        ]);
        setStats(statsRes.data);
        setQueue(queueRes.data.items);
        setWorkspaces(wsRes.data.items);
        setShift(shiftRes.data.currentShift);
        setCompletions(compRes.data.items);
      } catch (err) {
        console.error("MyWork load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [filter]);

  const handleWorkspaceClick = (route) => {
    if (route) navigate(route);
  };

  if (loading) return <div className="mw-loading">Loading My Work...</div>;

  const userInitials = (user.name || "PS")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mw-content-area">

      {/* Welcome Banner */}
      <div className="mw-banner">
        <div className="mw-banner-left">
          <div className="mw-avatar-lg">{userInitials}</div>
          <div>
            <p className="mw-banner-subtitle">MY ASSIGNED OPERATION</p>
            <h1>Welcome, {user.name || "Pranshu"}</h1>
            <p className="mw-banner-role">
              Global Platform Administration · Always-on privileged
            </p>
          </div>
        </div>
        <div className="mw-banner-right">
          <span className="mw-tag">Executive Office</span>
          <span className="mw-tag">All markets</span>
          <span className="mw-tag">All verticals</span>
        </div>
      </div>

      {/* 4 Top Stats Cards */}
      <div className="mw-stats-grid">
        <div className="mw-stat-card">
          <p className="mw-stat-label">ASSIGNED NOW</p>
          <h2 className="mw-stat-value">{stats?.assignedNow?.value || 0}</h2>
          <p className="mw-stat-desc">{stats?.assignedNow?.subValue}</p>
        </div>
        <div className="mw-stat-card">
          <p className="mw-stat-label">INSIDE SLA</p>
          <h2 className="mw-stat-value">{stats?.insideSla?.value || 0}%</h2>
          <p className="mw-stat-desc">{stats?.insideSla?.subValue}</p>
        </div>
        <div className="mw-stat-card">
          <p className="mw-stat-label">COMPLETED TODAY</p>
          <h2 className="mw-stat-value">{stats?.completedToday?.value || 0}</h2>
          <p className="mw-stat-desc">{stats?.completedToday?.subValue}</p>
        </div>
        <div className="mw-stat-card">
          <p className="mw-stat-label">APPROVAL AUTHORITY</p>
          <h2 className="mw-stat-value">{stats?.approvalAuthority?.value || "Unlimited"}</h2>
          <p className="mw-stat-desc">{stats?.approvalAuthority?.subValue}</p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="mw-main-grid">

        {/* LEFT: Operational Queue */}
        <div className="mw-panel">
          <div className="mw-panel-header">
            <div>
              <h3>My operational queue</h3>
              <p>Department, vertical and queue assignment enforced</p>
            </div>
            <select
              className="mw-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="assigned">Assigned to me</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mw-queue-list">
            {queue.length === 0 ? (
              <p className="mw-empty">No tasks in your queue.</p>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="mw-queue-item">
                  <div className={`mw-priority-bar priority-${item.priority.toLowerCase()}`}></div>
                  <div className="mw-queue-content">
                    <div className="mw-queue-title-row">
                      <h4>{item.title}</h4>
                      <span className={`mw-badge-priority priority-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="mw-queue-meta">
                      {item.taskId} · {item.category} · queue: {item.queue}
                    </p>
                  </div>
                  <div className="mw-queue-sla">
                    <span>SLA {item.sla}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Side Panels */}
        <div className="mw-side-panels">

          {/* Authorized Workspaces */}
          <div className="mw-panel">
            <h3>Authorized workspaces</h3>
            <div className="mw-workspace-list">
              {workspaces.length === 0 ? (
                <p className="mw-empty">No workspaces assigned.</p>
              ) : (
                workspaces.map((ws) => {
                  const IconMap = {
                    Executive: ShieldCheck,
                    Approvals: CheckCircle2,
                    "Operations Inbox": Activity,
                    Incidents: AlertTriangle,
                    "Service Health": Activity,
                    "Change Calendar": Clock,
                    Handovers: Users,
                  };
                  const Icon = IconMap[ws.title] || ShieldCheck;
                  return (
                    <div
                      key={ws.id}
                      className="mw-workspace-item"
                      onClick={() => handleWorkspaceClick(ws.route)}
                    >
                      <Icon size={16} />
                      <span>{ws.title}</span>
                      <ChevronRight size={14} className="ml-auto" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Shift & Handover */}
          <div className="mw-panel">
            <h3>Shift &amp; handover</h3>
            {!shift ? (
              <p className="mw-empty">No active shift.</p>
            ) : (
              <div className="mw-shift-content">
                <div className="mw-shift-row">
                  <span>Current shift</span>
                  <span className="mw-badge-active">{shift.status}</span>
                </div>
                <h4 className="mw-shift-name">{shift.shiftName}</h4>
                <div className="mw-progress-bar">
                  <div
                    className="mw-progress-fill"
                    style={{ width: `${shift.progress}%` }}
                  ></div>
                </div>
                <button className="mw-btn-outline">
                  <Zap size={14} /> Create handover
                </button>
              </div>
            )}
          </div>

          {/* Recent Completions */}
          <div className="mw-panel">
            <h3>Recent completions</h3>
            {completions.length === 0 ? (
              <p className="mw-empty-text">
                Completed work and resolution evidence will appear here.
              </p>
            ) : (
              <div className="mw-completion-list">
                {completions.map((c) => (
                  <div key={c.id} className="mw-completion-item">
                    <h4>{c.title}</h4>
                    <p>{c.taskId} · {c.resolution}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}