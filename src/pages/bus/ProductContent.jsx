// src/pages/bus/ProductContent.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Bus as BusIcon, Plus, Save } from 'lucide-react';

const API_BASE_URL = "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("bmtAdminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

const MODE_INFO = {
  'product-information': { title: 'Product information', field: 'description', placeholder: 'Bus description, features, highlights' },
  'amenities': { title: 'Amenities & inclusions', field: 'amenities', placeholder: 'WiFi, Charging, Water bottle, Blanket' },
  'product-reviews': { title: 'Product reviews', field: 'reviews', placeholder: 'Customer reviews and ratings' },
  'photos-media': { title: 'Photos & media', field: 'images', placeholder: 'Photo URLs and gallery' },
  'policies': { title: 'Policies', field: 'cancellationPolicy', placeholder: 'Cancellation, refund, and boarding policies' },
  'product-documents': { title: 'Product documents', field: 'documents', placeholder: 'Permit, RC, insurance, and compliance documents' },
  'product-change-history': { title: 'Product change history', field: 'history', placeholder: 'Audit trail of product changes' },
};

export default function ProductContent() {
  const location = useLocation();
  const [buses, setBuses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    const p = location.pathname;
    return Object.keys(MODE_INFO).find(k => p.includes(k)) || 'product-information';
  }, [location.pathname]);

  const info = MODE_INFO[mode];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/bus/list?limit=100`, { headers: getHeaders() });
        if (res.ok) {
          const json = await res.json();
          const items = json.data?.items || [];
          setBuses(items);
          setSelected(items[0] || null);
          if (items[0]) setEditValue(items[0][info.field] || '');
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = buses.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (b.busNumber || '').toLowerCase().includes(q);
  });

  const handleSelect = (bus) => {
    setSelected(bus);
    setEditValue(bus[info.field] || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bus/${selected.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ [info.field]: editValue }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBuses(prev => prev.map(b => b.id === selected.id ? { ...b, [info.field]: editValue } : b));
      showToast(`✅ Saved`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  return (
    <>
      {toast && <div className="bus-toast"><CheckCircle2 size={14} /> {toast}</div>}

      <div className="bus-ops-banner">
        <div className="bus-ops-banner-left">
          <div>
            <div className="bus-ops-banner-tags">
              <span className="bus-ops-tag-green">PRODUCT SETUP &amp; CONTENT</span>
              <span className="bus-ops-tag-gray">Buses</span>
            </div>
            <h2>{info.title}</h2>
            <p>Manage {info.title.toLowerCase()} for each bus in the fleet.</p>
          </div>
        </div>
        {selected && (
          <div className="bus-ops-banner-actions">
            <button className="bus-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={14} className="bus-spin" /> Saving...</> : <><Save size={14} /> Save changes</>}
            </button>
          </div>
        )}
      </div>

      <div className="bus-vendor-split">
        <div className="bus-panel">
          <h3 style={{ marginBottom: 12 }}>Select bus</h3>
          <div className="bus-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search bus number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bus-vendor-list">
            {loading ? (
              <div className="bus-loading"><Loader2 size={16} className="bus-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="bus-empty-inline">No buses.</p>
            ) : filtered.map(bus => (
              <button
                key={bus.id}
                className={`bus-vendor-row ${selected?.id === bus.id ? 'active' : ''}`}
                onClick={() => handleSelect(bus)}
              >
                <div className="bus-vendor-row-head">
                  <b><BusIcon size={12} style={{ display: 'inline', marginRight: 4 }} />{bus.busNumber}</b>
                </div>
                <p>{bus.fromCity} → {bus.toCity}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bus-panel">
          {selected ? (
            <>
              <h3 style={{ marginBottom: 4 }}>{selected.busNumber}</h3>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                {selected.busName} · {selected.fromCity} → {selected.toCity}
              </p>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                {info.title}
              </label>
              <textarea
                rows={12}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={info.placeholder}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </>
          ) : (
            <p className="bus-empty-inline">Select a bus to edit.</p>
          )}
        </div>
      </div>
    </>
  );
}