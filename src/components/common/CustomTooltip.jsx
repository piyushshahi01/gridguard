import React from "react";

export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg1 border border-border-grid rounded-lg p-3 text-[12px] text-t1 shadow-xl">
      <div className="text-t3 mb-1.5 font-bold">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2 items-center mb-1">
          <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-t2">{p.name}:</span>
          <span className="font-bold">{p.value} kWh</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-border-grid mt-2 pt-1.5 text-grid-red font-medium">
          Δ {Math.abs(payload[1]?.value - payload[0]?.value)} kWh mismatch
        </div>
      )}
    </div>
  );
}
