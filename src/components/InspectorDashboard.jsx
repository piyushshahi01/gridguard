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
import { motion } from "framer-motion";

export function InspectorDashboard({ data, inspectorName, onDataUpdate, sideTab, setSideTab }) {
  // Ensure data structure exists before unpacking
  const { transformers = [], alerts: rawAlerts = [] } = data || {};
  
  // ─── LOCAL STATE for real-time optimistic updates ───────────────────────
  const [localAlerts, setLocalAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [filter, setFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [statusFlash, setStatusFlash] = useState(null); // for animation
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'reports'
  
  // Sync from props → local state when server data arrives
  useEffect(() => {
    const alertsList = Array.isArray(rawAlerts) ? rawAlerts : [];
    
    // 1. Show ALL active grid threats to ensure the terminal is always informative
    // We filter for anything that isn't 'confirmed' or 'false_alarm' (resolved)
    const activeThreats = alertsList.filter(a => {
      if (!a) return false;
      const status = a.actionStatus || "open";
      // We show Open and Assigned cases across the grid for awareness
      return status === 'open' || status === 'assigned' || status === 'in_progress' || !a.actionStatus;
    });
    
    // 2. Map to local structure and sort by priority (Critical first)
    const sorted = [...activeThreats].sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return (b.riskScore || b.risk || 0) - (a.riskScore || a.risk || 0);
    });
    
    setLocalAlerts(sorted);
    if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
  }, [rawAlerts, transformers, inspectorName]);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset timer when new data arrives from server
  useEffect(() => { setLastUpdated(0); }, [data]);

  // Sync from Global Sidebar (sideTab) to Local Tab (activeTab)
  useEffect(() => {
    if (sideTab === 'reports') setActiveTab('reports');
    else if (sideTab === 'dashboard') setActiveTab('alerts');
  }, [sideTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (setSideTab) {
      setSideTab(tab === 'alerts' ? 'dashboard' : 'reports');
    }
  };

  const activeId = selectedId || (localAlerts.length > 0 ? localAlerts[0].id : null);
  const selected = localAlerts.find(a => a.id === activeId);
  const tx = selected ? transformers.find(t => t.id === selected.transformer) : null;

  // Filter localAlerts based on activeTab and severity filter
  const items = activeTab === 'alerts' 
    ? localAlerts.filter(a => a.actionStatus !== 'confirmed' && a.actionStatus !== 'false_alarm')
    : localAlerts.filter(a => a.actionStatus === 'confirmed' || a.actionStatus === 'false_alarm');

  const filtered = items.filter(a => {
    if (filter === "all") return true;
    return a.severity === filter;
  });

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

  // ─── LIVE STATS (computed from local state) ────────────────────────────
  const activeList = localAlerts.filter(a => a.actionStatus === "open" || a.actionStatus === "assigned");
  const totalCases = activeList.length;
  const criticalCases = activeList.filter(a => a.severity === "critical").length;
  const resolvedCases = localAlerts.filter(a => a.actionStatus === "confirmed" || a.actionStatus === "false_alarm" || a.actionStatus === "checked").length;
  const inProgressCases = activeList.length;

  const actionStatusLabel = {
    open: "Unassigned", assigned: "Assigned", in_progress: "Investigating", checked: "Completed", confirmed: "Fraud Confirmed", false_alarm: "Resolved",
  };

  const actionStatusColor = {
    open: "text-t3", assigned: "text-grid-blue", in_progress: "text-grid-cyan", checked: "text-grid-amber", confirmed: "text-grid-red", false_alarm: "text-grid-green",
  };

  const actionStatusBg = {
    open: "bg-slate-50", assigned: "bg-blue-50/50", in_progress: "bg-cyan-50/50", checked: "bg-amber-50/50", confirmed: "bg-red-50/50", false_alarm: "bg-emerald-50/50",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-grid-blue font-bold tracking-[0.2em] uppercase">Investigator Terminal</span>
            <Badge label="Enforcement Active" color="bg-grid-blue/10 text-grid-blue" />
          </div>
          <h1 className="text-3xl font-extrabold text-t1 font-chakra tracking-tight">
            Terminal: <span className="text-blue-600">{inspectorName}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-bg1 p-1 rounded-xl border border-border-grid shadow-inner">
            <button 
              onClick={() => handleTabChange('alerts')}
              className={`px-6 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                activeTab === 'alerts' ? "bg-white text-blue-600 shadow-md translate-y-[-1px]" : "text-t3 hover:text-t2"
              }`}>
              Active Alerts
            </button>
            <button 
              onClick={() => handleTabChange('reports')}
              className={`px-6 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                activeTab === 'reports' ? "bg-white text-blue-600 shadow-md translate-y-[-1px]" : "text-t3 hover:text-t2"
              }`}>
              Case Reports
            </button>
          </div>
        </div>
      </div>

      {/* ─── Top Stats Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-4 flex-1 flex-wrap">
          {[
            { icon: Activity, label: "Theft Cases", value: totalCases, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { icon: AlertTriangle, label: "Critical", value: criticalCases, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
            { icon: TrendingUp, label: "Under Enforcement", value: inProgressCases, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { icon: CheckCircle, label: "Recovered", value: resolvedCases, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          ].map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 ${s.bg} border ${s.border} rounded-2xl px-5 py-4 min-w-[160px] shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className={`p-2 rounded-lg ${s.bg} border-b border-white/50 shadow-inner`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</div>
                <div className={`text-2xl font-extrabold tracking-tight ${s.color}`}>{s.value}</div>
              </div>
            </motion.div>
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
              <SectionTitle label={activeTab === 'alerts' ? "Investigation Queue" : "Resolved Reports"} />
              <span className="text-[10px] text-grid-blue font-bold bg-grid-blue/10 border border-grid-blue/20 px-2 py-1 rounded-md">{filtered.length} Items</span>
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
                  p-4 rounded-xl border-l-[3px] border-y border-r cursor-pointer transition-all duration-300 group
                  ${activeId === a.id
                    ? "bg-white border-blue-200 shadow-lg -translate-x-1"
                    : "bg-transparent border-transparent hover:bg-slate-50"}
                  ${a.severity === 'critical' ? 'border-l-red-500' : 'border-l-amber-500'}
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
                  <div className={`text-[12px] font-bold font-chakra ${ (a.riskScore || a.risk) >= 60 ? 'text-grid-red' : (a.riskScore || a.risk) >= 28 ? 'text-grid-amber' : 'text-grid-green'}`}>
                    {Math.round(a.riskScore || a.risk || 0)}% Risk
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Panel — Investigation Detail ─────────────────────── */}
        {selected && tx ? (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {activeTab === 'reports' && (
              <div className="bg-grid-green/5 border border-grid-green/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-grid-green">
                  <CheckCircle size={20} />
                  <div>
                    <div className="text-[14px] font-bold uppercase tracking-widest">Case Resolved</div>
                    <div className="text-[12px] opacity-80 flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-grid-green/10 font-bold border border-grid-green/20">
                        {selected.risk}% Mitigation
                      </span>
                      • Final report synced to HQ
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-t3 uppercase font-bold">Revenue Recovered</div>
                  <div className="text-xl font-bold font-chakra text-grid-green">₹{(tx.theft_kwh * 8.5).toLocaleString()}</div>
                </div>
              </div>
            )}
            {/* Case Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
                  <div className={`px-5 py-2.5 rounded-2xl border font-bold text-xl flex flex-col items-center ${
                    (selected.riskScore || selected.risk) >= 60 ? 'text-red-600 bg-red-50 border-red-100' :
                    (selected.riskScore || selected.risk) >= 28 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                    'text-emerald-600 bg-emerald-50 border-emerald-100'
                  }`}>
                    {Math.round(selected.riskScore || selected.risk || 0)}%
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Risk Score</div>
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
                <LegendDot color="#10b981" label="Grid Supply" />
                <LegendDot color="#ef4444" label="Reported Consumption (Theft Gap)" />
              </div>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                  <AreaChart 
                    data={tx?.timeSeries || []} 
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
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
                    <ReferenceLine 
                      y={(tx?.supply || 0) * 0.85} 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5"
                      label={{ value: "Threshold", fill: "#f59e0b", fontSize: 9, position: 'right' }} 
                    />
                    <Area type="monotone" dataKey="supply" stroke="#10b981" strokeWidth={2.5} fill="url(#inspS)" dot={false} name="Supply" />
                    <Area type="monotone" dataKey="consumption" stroke="#ef4444" strokeWidth={2.5} fill="url(#inspC)" dot={false} name="Consumption" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Graph stats */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-border-grid/50">
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Avg Supply</div>
                  <div className="text-grid-green font-bold font-chakra">{Math.round((tx?.timeSeries || []).reduce((s, d) => s + (d.supply || 0), 0) / Math.max(1, (tx?.timeSeries || []).length))} kWh</div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Avg Consumption</div>
                  <div className="text-grid-red font-bold font-chakra">{Math.round((tx?.timeSeries || []).reduce((s, d) => s + (d.consumption || 0), 0) / Math.max(1, (tx?.timeSeries || []).length))} kWh</div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Unaccounted Loss</div>
                  <div className="text-grid-amber font-bold font-chakra">
                    {Math.round(Math.max(...tx.timeSeries.map(d => Math.abs(d.supply - d.consumption))))} kWh
                  </div>
                </div>
                <div className="bg-bg0/50 border border-border-grid/50 px-3 py-2 rounded-lg">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Deviation</div>
                  <div className={`font-bold font-chakra ${selected.deviation > 5 ? 'text-grid-red' : 'text-grid-amber'}`}>
                    {Math.round(selected.deviation || 0)}%
                  </div>
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
                    Total Loss: {selected.loss}%
                  </span>
                  <span className="text-[10px] bg-bg0/60 border border-border-grid text-t2 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">
                    Theft: {selected.theft_loss}%
                  </span>
                  <span className="text-[10px] bg-grid-red/10 border border-grid-red/20 text-grid-red px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">
                    Recovery: ₹{selected.financial_loss}
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
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl text-[14px] flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FileText size={16} /> {isUpdating ? "Saving..." : "Submit Report"}
                </button>
                <button
                  onClick={() => setNoteText("")}
                  className="px-6 py-3 rounded-xl text-[14px] text-slate-500 font-bold hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Clear Form
                </button>
                {submitSuccess && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="text-emerald-600 text-[13px] font-bold flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Report Published
                  </motion.span>
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
