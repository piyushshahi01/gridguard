import React from "react";

export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-[13px] text-slate-800 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)]">
      <div className="text-slate-400 mb-2 font-bold uppercase tracking-widest text-[10px]">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2.5 items-center mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-slate-500 font-medium">{p.name}:</span>
          <span className="font-extrabold text-slate-900 ml-auto">{p.value.toLocaleString()} kWh</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-slate-100 mt-2.5 pt-2.5 text-red-600 font-bold flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-wider">Mismatch</span>
          <span>Δ {Math.abs(payload[1]?.value - payload[0]?.value).toLocaleString()} kWh</span>
        </div>
      )}
    </div>
  );
}
