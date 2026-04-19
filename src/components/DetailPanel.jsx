import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Activity, AlertTriangle, Zap, ArrowLeft, TrendingDown, Users, Check
} from "lucide-react";
import { 
  MetricCard, SectionTitle, LegendDot, Badge, Tag, statusColor 
} from "./common/UI";
import { CustomTooltip } from "./common/CustomTooltip";
import { assignInspector, INSPECTORS } from "../services/dataService";

export function DetailPanel({ transformer: t, onBack, onDataUpdate, alerts }) {
  if (!t) return null;
  
  const colClass = statusColor(t.status);
  const anomalyCount = t.meters.filter(m => m.anomaly).length;
  
  // Find associated alert
  const alert = alerts?.find(a => a.transformer === t.id && a.severity !== "safe");
  
  const [selectedInsp, setSelectedInsp] = useState(INSPECTORS[0]);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if(!alert) return;
    setIsAssigning(true);
    try {
      await assignInspector(alert.id, selectedInsp);
      if(onDataUpdate) await onDataUpdate();
    } catch(err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* back + header */}
      <div className="flex items-center gap-4 py-2 flex-wrap">
        <button 
          onClick={onBack} 
          className="bg-bg2 border border-border-grid rounded-lg px-4 py-2.5 text-t2 hover:text-t1 hover:border-border-hov transition-all flex items-center gap-2 text-[13px] font-medium cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="flex-1 min-w-[200px]">
          <div className="text-2xl font-bold text-t1 font-chakra tracking-tight">
            {t.id} <span className="text-t3 font-normal mx-1">—</span> {t.location}
          </div>
          <div className="text-[12px] text-t3 font-medium flex items-center gap-2 mt-1">
            <Tag label={t.zone} colorClass="text-grid-blue" />
            <span className="opacity-20">|</span>
            <span>Last Sync: {new Date(t.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
        <Badge status={t.status} className="px-5 py-1.5 text-[12px]" />
      </div>

      {/* metric row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Source Supply" value={`${t.supply} kWh`} sub="Measured at TX Output" colorClass="text-grid-green" />
        <MetricCard icon={Activity} label="Aggregate Load" value={`${t.consumption} kWh`}
          sub="Sum of downstream meters" colorClass={t.consumption > t.supply ? "text-grid-red" : "text-grid-cyan"} />
        <MetricCard icon={TrendingDown} label="Loss Factor"
          value={`${t.loss > 0 ? "+" : ""}${t.loss}%`}
          sub={t.loss > 15 ? "Critical Threshold" : "Statistical Baseline"}
          colorClass={Math.abs(t.loss) > 15 ? "text-grid-red" : "text-grid-amber"} />
        <MetricCard icon={AlertTriangle} label="Confidence Score" value={`${t.risk}%`}
          sub={`${anomalyCount} node irregularit${anomalyCount !== 1 ? "ies" : "y"}`}
          colorClass={colClass} pulse={t.status === "critical"} />
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* time series */}
        <div className="bg-bg2 border border-border-grid rounded-xl p-5">
          <SectionTitle label="Supply vs. Consumption — 24H Load Profile" className="mb-4" />
          <div className="flex gap-4 mb-5">
            <LegendDot color="#10b981" label="Transformer Supply" />
            <LegendDot color="#ef4444" label="Metered Consumption" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={t.timeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {t.consumption > t.supply && (
                  <ReferenceLine y={t.supply} stroke="#f59e0b" strokeDasharray="5 5"
                    label={{ value: "Max Capacity", fill: "#f59e0b", fontSize: 10, position: 'right' }} />
                )}
                <Area type="monotone" dataKey="supply" stroke="#10b981" strokeWidth={2.5}
                  fill="url(#ds)" name="Supply" dot={false} />
                <Area type="monotone" dataKey="consumption" stroke="#ef4444" strokeWidth={2.5}
                  fill="url(#dc)" name="Consumption" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* meter breakdown */}
        <div className="bg-bg2 border border-border-grid rounded-xl p-5">
          <SectionTitle label="Individual Meter Deviations" className="mb-4" />
          <div className="h-[280px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t.meters} margin={{ top: 5, right: 20, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="id" tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                  tickLine={false} axisLine={false} width={80} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const m = t.meters.find(x => x.id === payload[0]?.payload?.id);
                  return (
                    <div className="bg-bg1 border border-border-grid rounded-lg p-3 text-[12px] shadow-2xl">
                      <div className="text-t1 font-bold mb-2 border-b border-border-grid pb-1">{m?.id} — {m?.consumer}</div>
                      <div className="text-t2 flex justify-between gap-4 mb-1">
                        <span>Expected:</span>
                        <span className="text-grid-green font-mono">{m?.expected} kWh</span>
                      </div>
                      <div className="text-t2 flex justify-between gap-4">
                        <span>Actual:</span>
                        <span className={`font-mono ${m?.anomaly ? "text-grid-red font-bold" : "text-grid-blue"}`}>{m?.actual} kWh</span>
                      </div>
                      {m?.anomaly && (
                        <div className="mt-2 text-grid-red bg-grid-red/10 px-2 py-1 rounded text-[10px] font-bold tracking-tighter animate-pulse">
                          ⚠ ANOMALOUS CONSUMPTION PATTERN
                        </div>
                      )}
                    </div>
                  );
                }} />
                <Bar dataKey="expected" fill="#10b98140" name="Expected" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]} barSize={12}>
                  {t.meters.map((m, i) => (
                    <Cell key={i} fill={m.anomaly ? "#ef4444" : "#38bdf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] justify-center text-t3 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-grid-green/30" /> Expected</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-grid-blue" /> Normal</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-grid-red" /> Divergent</div>
          </div>
        </div>
      </div>

      {/* anomaly explanation and assignment footer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 mt-2">
        <div className="bg-grid-red/5 border border-grid-red/20 border-l-4 border-l-grid-red rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-grid-red" />
            <SectionTitle label="Technical Forensic Analysis" className="text-grid-red" />
          </div>
          <p className="text-[14px] text-t2 leading-relaxed">
            {t.explanation}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Tag label={`Calculated Risk: ${t.risk}%`} colorClass={colClass} />
            <Tag label={`Unaccounted Energy: ${t.loss > 0 ? "+" : ""}${t.loss}%`} colorClass="text-grid-amber" />
            <Tag label={`Priority Investigation`} colorClass="text-grid-red" />
          </div>
        </div>

        {alert && (
            <div className="bg-bg2 border border-border-grid rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-grid-blue" />
                <SectionTitle label="Inspector Assignment" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-[12px] text-t2 mb-2">Current Status: <span className="font-bold text-t1 uppercase tracking-widest">{alert.actionStatus}</span></div>
                
                {alert.assignedTo && alert.assignedTo !== "Unassigned" ? (
                  <div className="bg-bg3 border border-border-grid rounded-lg p-3 mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                          <span className="text-[10px] text-t3 uppercase font-bold tracking-widest">Assigned To</span>
                          <span className="text-t1 font-bold">{alert.assignedTo}</span>
                      </div>
                      <div className="bg-grid-green/10 text-grid-green px-2 py-1 rounded text-[10px] font-bold uppercase"><Check size={12} className="inline mr-1" /> Active</div>
                  </div>
                ) : (
                  <>
                      <select 
                        value={selectedInsp} 
                        onChange={e => setSelectedInsp(e.target.value)}
                        className="bg-bg3 border border-border-grid text-t1 text-[13px] rounded-lg p-2.5 outline-none mb-3 font-jetbrains"
                      >
                        {INSPECTORS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <button 
                        onClick={handleAssign}
                        disabled={isAssigning}
                        className="bg-grid-blue hover:bg-grid-cyan text-bg0 font-bold px-4 py-2.5 rounded-lg text-[13px] uppercase tracking-widest shadow-lg transition-all"
                      >
                        {isAssigning ? "Assigning..." : "Assign Field Inspector"}
                      </button>
                  </>
                )}
              </div>
            </div>
        )}
      </div>

    </div>
  );
}
