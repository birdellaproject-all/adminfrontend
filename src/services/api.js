// src/services/api.js
const API_BASE_URL = "http://192.168.1.6:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  if (!token) {
    console.warn("[API] No token found — user may not be logged in");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export const fetchExecutiveStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/executive-stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
};

export const fetchServiceHealth = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/service-health`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch service health: ${res.status}`);
  return res.json();
};

export const fetchCommandNow = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/command-now`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch command actions: ${res.status}`);
  return res.json();
};

export const fetchModuleCards = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/module-cards`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch modules: ${res.status}`);
  return res.json();
};

export const fetchOperatingControls = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/operating-controls`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch controls: ${res.status}`);
  return res.json();
};

/* =========================================================
   MY WORK APIs
   ========================================================= */

export const fetchMyWorkStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/my-work/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch MyWork stats: ${res.status}`);
  return res.json();
};

export const fetchMyWorkQueue = async (filter = "assigned") => {
  const res = await fetch(`${API_BASE_URL}/admin/my-work/queue?filter=${filter}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch MyWork queue: ${res.status}`);
  return res.json();
};

export const fetchMyWorkWorkspaces = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/my-work/workspaces`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch workspaces: ${res.status}`);
  return res.json();
};

export const fetchMyWorkShift = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/my-work/shift`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch shift: ${res.status}`);
  return res.json();
};

export const fetchMyWorkCompletions = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/my-work/recent-completions`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch completions: ${res.status}`);
  return res.json();
};