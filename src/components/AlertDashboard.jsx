import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, MapPin, CheckCircle, Shield, Filter, Search } from "lucide-react";
import { SectionTitle, Badge, statusColor } from "./common/UI";

export function AlertDashboard({ data, onSelect }) {
  const { alerts = [], transformers = [] } = data;
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'resolved'
  const [search, setSearch] = useState("");

  const activeAlerts = alerts.filter(a => a.actionStatus === "open" || a.actionStatus === "assigned");
  const resolvedAlerts = alerts.filter(a => a.actionStatus === "confirmed" || a.actionStatus === "false_alarm" || a.actionStatus === "checked");

  let displayed = alerts;
  if (filter === "active") displayed = activeAlerts;
  if (filter === "resolved") displayed = resolvedAlerts;

  if (search) {
    const q = search.toLowerCase();
    displayed = displayed.filter(a => 
      a.id?.toLowerCase().includes(q) || 
      a.transformer?.toLowerCase().includes(q) || 
      a.location?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-bold text-t1 font-chakra tracking-tight flex items-center gap-2">
            <Shield size={18} className="text-grid-red" /> Global Alert Command
            <span className="text-[10px] text-t3 font-normal ml-2 normal-case">All identified incidents</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input 
              type="text" 
              placeholder="Search ID or Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg2 border border-border-grid rounded-lg py-1.5 pl-9 pr-3 text-[12px] text-t1 outline-none focus:border-grid-blue focus:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex bg-bg2 border border-border-grid rounded-lg p-1">
            {["all", "active", "resolved"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider transition-all
                  ${filter === f ? "bg-grid-blue text-bg0 shadow-[0_0_10px_rgba(56,189,248,0.3)]" : "text-t3 hover:text-t2"}
                `}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Alerts", value: alerts.length, color: "#38bdf8" },
          { label: "Action Required", value: activeAlerts.length, color: "#ef4444" },
          { label: "Resolved", value: resolvedAlerts.length, color: "#10b981" }
        ].map((s, i) => (
          <div key={i} className="glass-card border border-border-grid rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] text-t3 uppercase font-bold tracking-widest mb-1">{s.label}</div>
            <div className="text-[28px] font-bold font-chakra" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main list */}
      <div className="glass-card border border-border-grid rounded-xl flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border-grid flex justify-between items-center bg-bg1/40">
          <SectionTitle label={`Showing ${displayed.length} incident${displayed.length !== 1 ? 's' : ''}`} />
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[600px]">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-t3 text-[13px] gap-2">
              <CheckCircle size={28} className={filter === "active" ? "text-grid-green" : "text-t3"} />
              No alerts found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayed.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: (i % 15) * 0.03 }}
                    onClick={() => {
                        const tx = transformers.find(t => t.id === a.transformer);
                        if(tx) onSelect(tx);
                    }}
                    className={`
                      glass border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg
                      ${a.severity === 'critical' ? 'border-grid-red/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-grid-amber/30'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className={statusColor(a.severity)} />
                        <span className={`text-[13px] font-bold tracking-widest ${statusColor(a.severity)} uppercase`}>
                          {a.id}
                        </span>
                      </div>
                      <Badge status={a.severity} />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-[11px] text-t2">
                        <span className="w-16 text-t3 font-mono">TX_UNIT:</span>
                        <span className="font-bold text-t1">{a.transformer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-t2">
                        <span className="w-16 text-t3 font-mono">LOCATION:</span>
                        <span className="flex items-center gap-1"><MapPin size={10} className="text-grid-blue"/> {a.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-t2">
                        <span className="w-16 text-t3 font-mono">DATETIME:</span>
                        <span className="flex items-center gap-1"><Clock size={10} className="text-grid-cyan"/> {a.time}</span>
                      </div>
                      {a.loss && (
                        <div className="flex items-center gap-2 text-[11px] text-t2">
                          <span className="w-16 text-t3 font-mono">EST_LOSS:</span>
                          <span className="font-bold text-grid-red">{a.loss}%</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[12px] text-t2 leading-normal p-3 bg-bg0/50 rounded-lg border border-border-grid/50 font-medium">
                      {a.message}
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center border-t border-border-grid/50 pt-2 text-[10px] font-mono font-bold uppercase">
                       <span className="text-t3 tracking-widest">Status:</span>
                       <span className={a.actionStatus === "open" ? "text-grid-red" : a.actionStatus === "assigned" ? "text-grid-amber" : "text-grid-green"}>
                          {a.actionStatus.replace("_", " ")}
                       </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
