import React from "react";
import { SectionTitle, LegendDot, statusColor } from "./common/UI";

export function GridMap({ transformers, onSelect }) {
  const GRID = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ];
  const zones = ["North", "East", "South", "West"];

  return (
    <div className="bg-bg2 border border-border-grid rounded-xl p-5">
      <SectionTitle label="Zone Risk Map" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        {GRID.map(([a, b], zi) => {
          const ta = transformers[a],
            tb = transformers[b];
          const zone = zones[zi];
          const maxRisk = Math.max(ta?.risk || 0, tb?.risk || 0);
          const zStatus =
            maxRisk >= 60 ? "critical" : maxRisk >= 28 ? "warning" : "safe";
          const colClass = statusColor(zStatus);
          
          // Map status to border/bg colors for v4
          const zoneBorder = zStatus === "critical" ? "border-grid-red/40" : 
                             zStatus === "warning" ? "border-grid-amber/40" : "border-grid-green/40";
          const zoneBg = zStatus === "critical" ? "bg-grid-red/5" : 
                         zStatus === "warning" ? "bg-grid-amber/5" : "bg-grid-green/5";

          return (
            <div
              key={zone}
              className={`border rounded-lg p-3 ${zoneBorder} ${zoneBg}`}
            >
              <div className={`text-[11px] font-bold tracking-widest uppercase mb-2 ${colClass}`}>
                {zone} Grid
              </div>
              {[ta, tb].map(
                (t) =>
                  t && (
                    <div
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="flex justify-between items-center py-1.5 border-b border-border-grid/20 last:border-0 cursor-pointer text-[11px] group"
                    >
                      <span className="text-t2 group-hover:text-t1 transition-colors">{t.id}</span>
                      <span className={`${statusColor(t.status)} font-bold`}>
                        {t.risk}%
                      </span>
                    </div>
                  )
              )}
              <div className="mt-2.5">
                <div className="h-1.5 bg-border-grid rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colClass.replace("text-", "bg-")}`}
                    style={{ width: `${maxRisk}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-t3 justify-center">
        <LegendDot color="#10b981" label="Safe (<28%)" />
        <LegendDot color="#f59e0b" label="Warning (28–60%)" />
        <LegendDot color="#ef4444" label="Critical (>60%)" />
      </div>
    </div>
  );
}
