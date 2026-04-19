import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SectionTitle, LegendDot } from "./common/UI";

/* Glowing marker colors */
const COLORS = {
  critical: { fill: "#ef4444", stroke: "#fca5a5", glow: "rgba(239,68,68,0.5)" },
  warning:  { fill: "#f59e0b", stroke: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  safe:     { fill: "#10b981", stroke: "#6ee7b7", glow: "rgba(16,185,129,0.3)" },
};

export function GeospatialMap({ transformers }) {
  const loading = !transformers || transformers.length === 0;
  const center  = [30.9, 75.85];

  const getStatus = (risk) => risk >= 70 ? "critical" : risk >= 30 ? "warning" : "safe";

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col"
      style={{ border: '1px solid rgba(56,189,248,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle label="Isolation Forest Predictive GIS" />
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-t3">{transformers?.length || 0} sensors</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-grid-green animate-gg-blink" />
            <span className="text-[10px] text-grid-green font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[320px] h-[360px] relative rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(56,189,248,0.1)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(11,17,32,0.9)' }}>
            <div className="w-8 h-8 border-2 border-t-grid-blue border-border-grid rounded-full animate-spin" />
            <span className="text-t3 text-[12px] uppercase tracking-widest font-semibold">Loading ML Predictions...</span>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={8}
            scrollWheelZoom={true}
            preferCanvas={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {transformers.map((m) => {
              const status = getStatus(m.risk);
              const c = COLORS[status];
              const radius = status === "critical" ? 7 : status === "warning" ? 5 : 3.5;
              const weight = status === "critical" ? 2.5 : 1.5;
              return (
                <CircleMarker
                  key={m.id}
                  center={[m.lat, m.lon]}
                  pathOptions={{
                    color: c.stroke,
                    fillColor: c.fill,
                    fillOpacity: status === "critical" ? 0.9 : 0.75,
                    weight,
                  }}
                  radius={radius}
                >
                  <Popup>
                    <div style={{
                      background: 'rgba(11,17,32,0.97)',
                      padding: '12px',
                      borderRadius: 10,
                      minWidth: 180,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      <div style={{ color: c.fill, fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.fill, display: 'inline-block' }} />
                        {m.id}
                      </div>
                      <div style={{ color: '#8ba3c7', fontSize: 11, marginBottom: 8 }}>{m.location}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                        {[
                          { label: 'Supply', val: `${m.supply} kWh`, col: '#10b981' },
                          { label: 'Loss', val: `${m.loss?.toFixed(1)}%`, col: m.loss > 15 ? '#ef4444' : '#f59e0b' },
                          { label: 'Risk Score', val: `${m.risk}`, col: c.fill },
                          { label: 'Status', val: status.toUpperCase(), col: c.fill },
                        ].map((row, i) => (
                          <div key={i}>
                            <div style={{ fontSize: 9, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{row.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: row.col, fontFamily: 'monospace' }}>{row.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-[11px] justify-center">
        <LegendDot color="#10b981" label="Safe (Risk < 30)" />
        <LegendDot color="#f59e0b" label="Warning (30–69)" />
        <LegendDot color="#ef4444" label="Critical — ML Theft Detected (≥ 70)" />
      </div>
    </div>
  );
}
