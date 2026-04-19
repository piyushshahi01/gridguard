import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  AlertTriangle, Shield, Clock, MapPin, Eye, XCircle, CheckCircle, MessageSquare, FileText,
  Activity, Radio, TrendingUp, Zap, RefreshCw
} from "lucide-react";
import { 
  Badge, SectionTitle, LegendDot, StatPill, ActionBtn, statusColor 
} from "./common/UI";
import { CustomTooltip } from "./common/CustomTooltip";
import { updateActionStatus } from "../services/dataService";

export function InspectorDashboard({ data, inspectorName, onDataUpdate }) {
  const { transformers, alerts: rawAlerts } = data;
  
  // ─── LOCAL STATE for real-time optimistic updates ───────────────────────
  const [localAlerts, setLocalAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [filter, setFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [statusFlash, setStatusFlash] = useState(null); // for animation
  
  // Sync from props → local state when server data arrives
  useEffect(() => {
    const cases = rawAlerts.length > 0 
      ? rawAlerts.map(a => ({ ...a }))
      : transformers.filter(t => t.status !== "safe").map((t, i) => ({
          id: `CASE-${i}`,
          transformer: t.id,
          location: t.location,
          severity: t.status,
          risk: t.risk,
          message: `${t.status === 'critical' ? 'CRITICAL' : 'WARNING'} — Loss anomaly detected.`,
          time: t.updatedAt,
          explanation: t.explanation,
          actionStatus: "open",
          assignedTo: inspectorName,
          notes: ""
        }));
    setLocalAlerts(cases);
    if(!selectedId && cases.length > 0) setSelectedId(cases[0].id);
  }, [rawAlerts, transformers]);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset timer when new data arrives from server
  useEffect(() => { setLastUpdated(0); }, [data]);

  const activeId = selectedId || (localAlerts.length > 0 ? localAlerts[0].id : null);
  const selected = localAlerts.find(a => a.id === activeId);
  const tx = selected ? transformers.find(t => t.id === selected.transformer) : null;

  // ─── REAL-TIME STATUS UPDATE ────────────────────────────────────────────
  const handleStatusUpdate = async (status) => {
    const targetId = activeId || (filtered.length > 0 ? filtered[0].id : null);
    if (!targetId) return;
    setIsUpdating(true);

    // 1) OPTIMISTIC: update local state instantly
    setLocalAlerts(prev => prev.map(a => 
      a.id === targetId 
        ? { ...a, actionStatus: status, notes: noteText || a.notes } 
        : a
    ));

    // Flash animation
    setStatusFlash(status);
    setTimeout(() => setStatusFlash(null), 1500);

    try {
      // 2) PERSIST: send to backend
      await updateActionStatus(targetId, status, noteText);
      
      // 3) SYNC: refresh from server (keeps everything consistent)
      if (onDataUpdate) await onDataUpdate();
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      // Rollback on error
      if (onDataUpdate) await onDataUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = filter === "all" ? localAlerts : localAlerts.filter(a => a.severity === filter);

  // ─── LIVE STATS (computed from local state) ────────────────────────────
  const activeList = localAlerts.filter(a => a.actionStatus === "open" || a.actionStatus === "assigned");
  const totalCases = activeList.length;
  const criticalCases = activeList.filter(a => a.severity === "critical").length;
  const resolvedCases = localAlerts.filter(a => a.actionStatus === "confirmed" || a.actionStatus === "false_alarm" || a.actionStatus === "checked").length;
  const inProgressCases = activeList.length;

  const actionStatusLabel = {
    open: "Unassigned", assigned: "Assigned", in_progress: "In Progress", checked: "Completed", confirmed: "Theft Confirmed", false_alarm: "Resolved",
  };

  const actionStatusColor = {
    open: "text-t3", assigned: "text-grid-blue", in_progress: "text-grid-cyan", checked: "text-grid-amber", confirmed: "text-grid-red", false_alarm: "text-grid-green",
  };

  const actionStatusBg = {
    open: "bg-bg2", assigned: "bg-grid-blue/10", in_progress: "bg-grid-cyan/10", checked: "bg-grid-amber/10", confirmed: "bg-grid-red/10", false_alarm: "bg-grid-green/10",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Top Stats Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-3 flex-1 flex-wrap">
          {[
            { icon: Activity, label: "Active Cases", value: totalCases, color: "text-grid-blue", bg: "bg-grid-blue/10", border: "border-grid-blue/20" },
            { icon: AlertTriangle, label: "Critical", value: criticalCases, color: "text-grid-red", bg: "bg-grid-red/10", border: "border-grid-red/20" },
            { icon: TrendingUp, label: "In Progress", value: inProgressCases, color: "text-grid-amber", bg: "bg-grid-amber/10", border: "border-grid-amber/20" },
            { icon: CheckCircle, label: "Resolved", value: resolvedCases, color: "text-grid-green", bg: "bg-grid-green/10", border: "border-grid-green/20" },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-3 ${s.bg} border ${s.border} rounded-xl px-4 py-3 min-w-[140px] transition-all duration-500`}>
              <s.icon size={18} className={s.color} />
              <div>
                <div className="text-[10px] text-t3 font-bold uppercase tracking-widest">{s.label}</div>
                <div className={`text-xl font-bold font-chakra ${s.color} transition-all duration-300`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg2 border border-border-grid rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-grid-green shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-[10px] text-t3 font-bold tracking-widest uppercase">System Live</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-t3">
            <Clock size={10} />
            <span>Updated {lastUpdated}s ago</span>
          </div>
          <button 
            onClick={() => { if(onDataUpdate) { onDataUpdate(); setLastUpdated(0); } }}
            className="w-8 h-8 rounded-lg bg-bg2 border border-border-grid flex items-center justify-center text-t3 hover:text-grid-blue hover:border-grid-blue/30 transition-all cursor-pointer active:scale-90"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ─── Status Flash Banner ──────────────────────────────────────── */}
      {statusFlash && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border animate-pulse transition-all duration-300 ${
          statusFlash === 'checked' ? 'bg-grid-amber/10 border-grid-amber/30 text-grid-amber' :
          statusFlash === 'confirmed' ? 'bg-grid-red/10 border-grid-red/30 text-grid-red' :
          statusFlash === 'false_alarm' ? 'bg-grid-green/10 border-grid-green/30 text-grid-green' :
          'bg-grid-blue/10 border-grid-blue/30 text-grid-blue'
        }`}>
          <CheckCircle size={16} />
          <span className="text-[13px] font-bold uppercase tracking-widest">
            Status Updated → {actionStatusLabel[statusFlash]}
          </span>
        </div>
      )}

      {/* ─── Main Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4" style={{ height: 'calc(100vh - 250px)' }}>
        {/* ─── Left Panel — Cases List ─────────────────────────────────── */}
        <div className="bg-bg2 border border-border-grid rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-border-grid">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle label="Investigation Queue" />
              <span className="text-[10px] text-grid-blue font-bold bg-grid-blue/10 border border-grid-blue/20 px-2 py-1 rounded-md">{filtered.length} Cases</span>
            </div>
            <div className="flex gap-1.5 bg-bg1 p-1 rounded-lg border border-border-grid/50">
              {["all", "critical", "warning"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                    filter === f ? "bg-bg3 text-t1 shadow-sm" : "text-t3 hover:text-t2"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filtered.map(a => (
              <div
                key={a.id}
                onClick={() => { setSelectedId(a.id); setNoteText(a.notes || ""); }}
                className={`
                  p-3.5 rounded-lg border cursor-pointer transition-all duration-300 border-l-4 group
                  ${activeId === a.id
                    ? "bg-bg3 border-border-grid/50 shadow-md"
                    : "bg-transparent border-transparent hover:bg-bg3/40"}
                  ${a.severity === 'critical' ? 'border-l-grid-red' : 'border-l-grid-amber'}
                `}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-[11px] font-bold tracking-widest uppercase ${statusColor(a.severity)}`}>
                    {a.transformer}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-all duration-300 ${
                    actionStatusColor[a.actionStatus || 'open']
                  } ${actionStatusBg[a.actionStatus || 'open']}`}>
                    {actionStatusLabel[a.actionStatus || 'open']}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-t3 mt-1 group-hover:text-t2 transition-colors">
                  <MapPin size={10} /> {a.location}
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-1 text-[10px] text-t3">
                    <Clock size={9} /> {a.time || a.timestamp || 'Just Now'}
                  </div>
                  <div className={`text-[12px] font-bold font-chakra ${a.risk >= 60 ? 'text-grid-red' : a.risk >= 28 ? 'text-grid-amber' : 'text-grid-green'}`}>
                    {a.risk}% Risk
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Panel — Investigation Detail ─────────────────────── */}
        {selected && tx ? (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Case Header */}
            <div className="bg-bg2 border border-border-grid rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xl font-bold text-t1 font-chakra flex items-center gap-3">
                    <Zap size={20} className={selected.severity === 'critical' ? 'text-grid-red' : 'text-grid-amber'} />
                    {selected.transformer}
                    <span className="text-t3 font-normal opacity-30">—</span>
                    <span className="text-t2 text-base font-normal">{tx.location}</span>
                  </div>
                  <div className="text-[12px] text-t3 flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1"><Radio size={10} /> {tx.zone}</span>
                    <span className="opacity-20">|</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Detected: {selected.time || selected.timestamp || 'Just Now'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={selected.severity} label={selected.severity === "critical" ? "CRITICAL" : "WARNING"} className="px-4 py-1.5" />
                  <div className={`px-4 py-2 rounded-xl border font-chakra font-bold text-lg ${
                    selected.risk >= 60 ? 'text-grid-red bg-grid-red/5 border-grid-red/20' :
                    selected.risk >= 28 ? 'text-grid-amber bg-grid-amber/5 border-grid-amber/20' :
                    'text-grid-green bg-grid-green/5 border-grid-green/20'
                  }`}>
                    {selected.risk}%
                    <div className="text-[9px] text-t3 font-normal uppercase tracking-widest">Risk Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graph Section */}
            <div className="glass-card border border-border-grid rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle label="Supply vs. Consumption — 24h Load Profile" />
                <div className="flex items-center gap-1.5 bg-grid-red/10 border border-grid-red/20 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-grid-red animate-pulse" />
                  <span className="text-[9px] text-grid-red font-bold uppercase tracking-widest">Anomaly Detected</span>
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <LegendDot color="#10b981" label="Transformer Supply" />
                <LegendDot color="#ef4444" label="Metered Consumption" />
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tx.timeSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inspS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="inspC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} interval={5} />
                    <YAxis tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={tx.supply * 0.85} stroke="#f59e0b" strokeDasharray="5 5"
                      label={{ value: "Threshold", fill: "#f59e0b", fontSize: 9, position: 'right' }} />
                    <Area type="monotone" dataKey="supply" stroke="#10b981" strokeWidth={2.5} fill="url(#inspS)" dot={false} name="Supply" />
                    <Area type="monotone" dataKey="consumption" stroke="#ef4444" strokeWidth={2.5} fill="url(#inspC)" dot={false} name="Consumption" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Graph stats */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-border-grid/50">
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Avg Supply</div>
                  <div className="text-grid-green font-bold font-chakra">{Math.round(tx.timeSeries.reduce((s, d) => s + d.supply, 0) / tx.timeSeries.length)} kWh</div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Avg Consumption</div>
                  <div className="text-grid-red font-bold font-chakra">{Math.round(tx.timeSeries.reduce((s, d) => s + d.consumption, 0) / tx.timeSeries.length)} kWh</div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Unaccounted Loss</div>
                  <div className="text-grid-amber font-bold font-chakra">
                    {Math.max(...tx.timeSeries.map(d => Math.abs(d.supply - d.consumption)))} kWh
                  </div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Deviation</div>
                  <div className={`font-bold font-chakra ${selected.deviation > 5 ? 'text-grid-red' : 'text-grid-amber'}`}>{selected.deviation}%</div>
                </div>
              </div>
            </div>

            {/* AI Explanation + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              {/* AI Forensic Analysis */}
              <div className={`glass-card border-l-4 rounded-xl p-5 ${
                selected.severity === 'critical'
                  ? 'border-grid-red/20 border-l-grid-red shadow-[inset_0_0_40px_rgba(239,68,68,0.05)]'
                  : 'border-grid-amber/20 border-l-grid-amber shadow-[inset_0_0_40px_rgba(245,158,11,0.05)]'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className={selected.severity === 'critical' ? 'text-grid-red' : 'text-grid-amber'} />
                  <SectionTitle label="AI Anomaly Explanation" className={selected.severity === 'critical' ? 'text-grid-red' : 'text-grid-amber'} />
                </div>
                <blockquote className="text-[14px] text-t1 font-medium leading-relaxed border-l-2 border-border-grid pl-4 py-1 italic bg-bg1/30 rounded-r-lg pr-3">
                  "{selected.message || selected.explanation}"
                </blockquote>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-bg0/60 border border-border-grid text-t2 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">
                    Loss: {selected.loss}%
                  </span>
                  <span className="text-[10px] bg-bg0/60 border border-border-grid text-t2 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">
                    Expected: {selected.expected}%
                  </span>
                  <span className="text-[10px] bg-grid-red/10 border border-grid-red/20 text-grid-red px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">
                    Impact: ₹{selected.financial_loss}
                  </span>
                </div>
              </div>

              {/* Action Panel */}
              <div className="glass-card border border-border-grid rounded-xl p-5 flex flex-col">
                <SectionTitle label="Field Actions" className="mb-4" />
                <div className="flex-1 space-y-2">
                  <ActionBtn
                    icon={<Eye size={14} />}
                    label="Mark In Progress"
                    colorClass="text-grid-cyan"
                    active={selected.actionStatus === "in_progress"}
                    onClick={() => handleStatusUpdate("in_progress")}
                  />
                  <ActionBtn
                    icon={<XCircle size={14} />}
                    label="Resolve (Confirm Fraud)"
                    colorClass="text-grid-red"
                    active={selected.actionStatus === "confirmed"}
                    onClick={() => handleStatusUpdate("confirmed")}
                  />
                  <ActionBtn
                    icon={<CheckCircle size={14} />}
                    label="Resolve (False Alarm)"
                    colorClass="text-grid-green"
                    active={selected.actionStatus === "false_alarm"}
                    onClick={() => handleStatusUpdate("false_alarm")}
                  />
                </div>
                {/* Current Status Display */}
                <div className={`mt-4 pt-3 border-t border-border-grid/50 rounded-lg px-3 py-2 transition-all duration-500 ${
                  actionStatusBg[selected.actionStatus || 'open']
                }`}>
                  <div className="text-[10px] text-t3 uppercase font-bold tracking-widest mb-1">Current Status</div>
                  <div className={`text-sm font-bold uppercase tracking-widest transition-all duration-300 ${actionStatusColor[selected.actionStatus || 'open']}`}>
                    ● {actionStatusLabel[selected.actionStatus || 'open']}
                  </div>
                </div>
              </div>
            </div>

            {/* Inspector Notes & Report */}
            <div className="bg-bg2 border border-border-grid rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-grid-blue" />
                <SectionTitle label="Inspector Report & Field Notes" />
              </div>

              {selected.notes && (
                <div className="mb-4 p-3 bg-bg3 border border-border-grid rounded-lg text-[12px] text-t2 italic border-l-4 border-l-grid-blue">
                  <span className="text-[9px] text-t3 not-italic uppercase font-bold tracking-widest block mb-1">Previous Record</span>
                  "{selected.notes}"
                </div>
              )}

              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Document your findings: bypass type observed, meter condition, consumer interaction details, evidence collected..."
                className="w-full bg-bg3 border border-border-grid rounded-lg p-4 text-[13px] text-t1 font-jetbrains min-h-[100px] focus:outline-none focus:border-grid-blue/50 transition-colors placeholder:text-t3/50 resize-none"
              />
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handleStatusUpdate(selected.actionStatus || "checked")}
                  disabled={isUpdating}
                  className="bg-grid-blue hover:bg-grid-cyan text-bg0 font-bold px-6 py-2.5 rounded-lg text-[13px] flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FileText size={14} /> {isUpdating ? "Saving..." : "Submit Report"}
                </button>
                <button
                  onClick={() => setNoteText("")}
                  className="px-5 py-2.5 rounded-lg text-[13px] text-t3 hover:text-t2 border border-border-grid hover:bg-bg3 transition-all cursor-pointer"
                >
                  Clear
                </button>
                {submitSuccess && (
                  <span className="text-grid-green text-[12px] font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle size={14} /> Report Saved Successfully
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-t3 bg-bg2/50 border border-dashed border-border-grid rounded-xl h-full">
            <Shield size={64} className="mb-6 opacity-20" />
            <h2 className="text-xl font-bold font-chakra opacity-40">Investigation Portal</h2>
            <p className="mt-2 text-sm max-w-[300px] text-center opacity-30">Select an active alert from the sidebar to begin field inspection and reporting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
