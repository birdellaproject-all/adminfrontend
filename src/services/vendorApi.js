// src/services/vendorApi.js
const VENDOR_API_BASE = "https://bmtvendorfinal.onrender.com/api/vendor";

// ✅ GET: Fetch all vendors
export const fetchVendors = async () => {
  const res = await fetch(`${VENDOR_API_BASE}/auth/vendors`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

// ✅ PUT: Approve a vendor by ID
export const approveVendor = async (vendorId) => {
  const url = `${VENDOR_API_BASE}/auth/approve-vendor/${vendorId}`;

  const res = await fetch(url, {
    method: "PUT", // ✅ CORRECT — backend uses PUT, not POST
    headers: { "Content-Type": "application/json" },
  });

  console.log(`[APPROVE] PUT ${url} → ${res.status}`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Approval failed (${res.status}): ${text || "No body"}`);
  }

  return res.json().catch(() => ({ success: true }));
};

// ✅ PUT: Reject a vendor by ID (for the X button)
export const rejectVendor = async (vendorId) => {
  const url = `${VENDOR_API_BASE}/auth/reject-vendor/${vendorId}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });

  console.log(`[REJECT] PUT ${url} → ${res.status}`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Rejection failed (${res.status}): ${text || "No body"}`);
  }

  return res.json().catch(() => ({ success: true }));
};