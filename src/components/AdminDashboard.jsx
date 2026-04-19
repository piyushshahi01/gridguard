import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  AlertTriangle, Database, Radio, Shield, RefreshCw, Play, RotateCcw, Clock, ChevronRight, MapPin, CheckCircle
} from "lucide-react";
import { 
  MetricCard, SectionTitle, LegendDot, StatPill, Badge, CtrlBtn, statusColor 
} from "./common/UI";
import { CustomTooltip } from "./common/CustomTooltip";
import { GeospatialMap } from "./GeospatialMap";

export function AdminDashboard({ data, onSelect, onGenerate, onSimulate, onReset }) {
  const { transformers, alerts, analytics = {} } = data;
  const [filterTabs, setFilterTabs] = useState("active");
  const [chartTab, setChartTab] = useState("region");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const byRegion = analytics.byRegion || [];
  const byZone = analytics.byZone || [];
  const lossDistribution = analytics.lossDistribution || [];
  
  const activeAlerts = alerts.filter(a => a.actionStatus === "open" || a.actionStatus === "assigned");
  const resolvedAlerts = alerts.filter(a => a.actionStatus === "confirmed" || a.actionStatus === "false_alarm" || a.actionStatus === "checked");
  
  const displayedAlerts = filterTabs === "active" ? activeAlerts : resolvedAlerts;
  
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;
  const totalSupply = transformers.reduce((s, t) => s + t.supply, 0);
  const totalConsumption = transformers.reduce((s, t) => s + t.consumption, 0);
  const highRisk = transformers.filter((t) => t.risk >= 60).length;

  const aggSeries = transformers[0]?.timeSeries.map((_, hi) => ({
    time: transformers[0].timeSeries[hi].time,
    supply: transformers.reduce((s, t) => s + t.timeSeries[hi].supply, 0),
    consumption: transformers.reduce((s, t) => s + t.timeSeries[hi].consumption, 0),
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      {/* controls */}
      <div className="flex gap-2.5 items-center justify-between flex-wrap">
        <div className="flex gap-2">
          <CtrlBtn icon={<RefreshCw size={14} />} label="Generate Data" onClick={onGenerate} colorClass="text-grid-blue" />
          <CtrlBtn icon={<Play size={14} />} label="Simulate Theft" onClick={onSimulate} colorClass="text-grid-red" />
          <CtrlBtn icon={<RotateCcw size={14} />} label="Refresh" onClick={onReset} colorClass="text-t2" />
        </div>
        <div className="text-[12px] text-t3 flex items-center gap-1.5 bg-bg1 px-3 py-1.5 rounded-lg border border-border-grid/50">
          <Clock size={12} /> 
          <span>Auto-refresh: 30s</span>
          <span className="mx-1 opacity-30">|</span>
          <span>Last sync: just now</span>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Database, label: "Transformers", value: transformers.length, sub: `${transformers.filter(t => t.status === "safe").length} operational`, colorClass: "text-grid-blue" },
          { icon: Radio, label: "Active Meters", value: transformers.reduce((s, t) => s + t.meters.length, 0), sub: "Across all zones", colorClass: "text-grid-cyan" },
          { icon: AlertTriangle, label: "Open Alerts", value: activeAlerts.length, sub: `${criticalCount} critical, ${warningCount} warning`, colorClass: "text-grid-red", pulse: criticalCount > 0 },
          { icon: Shield, label: "High-Risk Zones", value: highRisk, sub: `${Math.round((totalConsumption - totalSupply) / totalSupply * 100)}% avg excess`, colorClass: highRisk > 0 ? "text-grid-amber" : "text-grid-green" }
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <MetricCard {...m} />
          </motion.div>
        ))}
      </div>

      {/* chart + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
        {/* tabbed analytics chart */}
        <div className="glass-card border border-border-grid rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <SectionTitle label="Grid Analytics" />
            <div className="flex gap-1 bg-bg1 p-1 rounded-lg border border-border-grid/50">
              {[
                { id: "region", label: "By Region" },
                { id: "zone", label: "By Zone Type" },
                { id: "loss", label: "Loss Distribution" },
              ].map(tab => (
                <button key={tab.id}
                  onClick={() => setChartTab(tab.id)}
                  className={`py-1 px-3 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${chartTab === tab.id ? "bg-bg3 text-t1 shadow-sm" : "text-t3 hover:text-t2"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === "region" ? (
                <BarChart data={byRegion} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="region" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0d1b2a", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`${val.toLocaleString()} kWh`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="supply" name="Supply (kWh)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumption" name="Consumption (kWh)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartTab === "zone" ? (
                <BarChart data={byZone} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="zone" tick={{ fontSize: 9, fill: "#4b6080" }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ background: "#0d1b2a", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`${val.toLocaleString()} kWh`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="supply" name="Supply (kWh)" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="consumption" name="Consumption (kWh)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <BarChart data={lossDistribution} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0d1b2a", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [val, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="count" name="Total Transformers" radius={[4, 4, 0, 0]}>
                    {lossDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`}
                        fill={entry.range === "30-50%" || entry.range === "50%+" ? "#ef4444" : entry.range === "20-30%" || entry.range === "15-20%" ? "#f59e0b" : "#10b981"}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="anomalies" name="ML Anomalies" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <StatPill label="Total Supply" value={`${(totalSupply / 1000).toFixed(1)} MWh`} colorClass="text-grid-green" />
            <StatPill label="Total Consumption" value={`${(totalConsumption / 1000).toFixed(1)} MWh`} colorClass="text-grid-red" />
            <StatPill label="Grid Loss" value={`${Math.round(Math.abs(totalConsumption - totalSupply) / totalSupply * 100)}%`}
              colorClass={totalConsumption > totalSupply ? "text-grid-red" : "text-grid-green"} />
          </div>
        </div>

        {/* alerts panel */}
        <div className="glass-card border border-border-grid rounded-xl p-5 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <SectionTitle label={filterTabs === "active" ? "Active Alerts" : "Resolved Alerts"} />
            <div className="flex gap-1.5 bg-bg1 p-1 rounded-lg border border-border-grid/50">
              <button
                onClick={() => setFilterTabs("active")}
                className={`py-1 px-3 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${filterTabs === "active" ? "bg-bg3 text-t1 shadow-sm" : "text-t3 hover:text-t2"}`}>
                Active ({activeAlerts.length})
              </button>
              <button
                onClick={() => setFilterTabs("resolved")}
                className={`py-1 px-3 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${filterTabs === "resolved" ? "bg-bg3 text-t1 shadow-sm" : "text-t3 hover:text-t2"}`}>
                Resolved ({resolvedAlerts.length})
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-1">
            {displayedAlerts.length === 0 && (
              <div className="text-t3 text-[13px] text-center p-10">
                <CheckCircle size={24} className={filterTabs === "active" ? "text-grid-green mx-auto mb-2" : "text-t3 mx-auto mb-2"} />
                {filterTabs === "active" ? "No active alerts" : "No resolved cases"}
              </div>
            )}
            <AnimatePresence>
              {displayedAlerts.map((a, i) => (
                <motion.div 
                  key={a.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => onSelect(transformers.find(t => t.id === a.transformer))}
                  className={`
                    bg-bg0/60 backdrop-blur-md border rounded-lg p-3 cursor-pointer transition-all hover:bg-bg3 hover:border-opacity-60
                    ${a.severity === 'critical' ? 'border-grid-red/20 border-l-grid-red border-l-4' : 'border-grid-amber/20 border-l-grid-amber border-l-4'}
                  `}>
                  <div className="flex justify-between mb-1.5">
                    <span className={`text-[11px] font-bold tracking-widest ${statusColor(a.severity)} uppercase`}>
                      {a.id} — {a.transformer}
                    </span>
                    <span className="text-[10px] text-t3 uppercase font-medium">{a.time}</span>
                  </div>
                  <div className="text-[12px] text-t2 leading-normal mb-2 line-clamp-2">{a.message}</div>
                  <div className="text-[11px] text-t3 flex items-center gap-1">
                    <MapPin size={10} /> {a.location}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* transformer table + grid map */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-4">
        {/* table */}
        <div className="glass-card border border-border-grid rounded-xl overflow-hidden flex flex-col">
          <div className="p-4.5 border-b border-border-grid">
            <SectionTitle label="Transformer Registry" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-bg3/50 text-t3 uppercase tracking-wider font-semibold border-b border-border-grid">
                  <th className="p-3.5 pl-5">ID</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Supply (kWh)</th>
                  <th className="p-3.5">Consume (kWh)</th>
                  <th className="p-3.5">Loss %</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5"></th>
                </tr>
              </thead>
              <tbody>
                {transformers.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((t, i) => (
                  <tr key={t.id}
                    onClick={() => onSelect(t)}
                    className="border-b border-border-grid/30 hover:bg-bg3/40 transition-colors cursor-pointer group">
                    <td className="p-3.5 pl-5 font-bold text-grid-blue">{t.id}</td>
                    <td className="p-3.5 text-t1 font-medium">{t.location}</td>
                    <td className="p-3.5 text-t2">{t.supply}</td>
                    <td className={`p-3.5 ${t.consumption > t.supply ? "text-grid-red font-semibold" : "text-t2"}`}>
                      {t.consumption}
                    </td>
                    <td className={`p-3.5 font-medium ${Math.abs(t.loss) > 15 ? "text-grid-red" : Math.abs(t.loss) > 8 ? "text-grid-amber" : "text-grid-green"}`}>
                      {t.loss > 0 ? "+" : ""}{t.loss}%
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1 w-12 bg-border-grid rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${t.status === 'critical' ? 'bg-grid-red' : t.status === 'warning' ? 'bg-grid-amber' : 'bg-grid-green'}`} 
                               style={{ width: `${t.risk}%` }} />
                        </div>
                        <span className={`font-bold ${statusColor(t.status)}`}>{t.risk}%</span>
                      </div>
                    </td>
                    <td className="p-3.5"><Badge status={t.status} /></td>
                    <td className="p-3.5 pr-5">
                      <ChevronRight size={14} className="text-t3 group-hover:text-t1 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center p-4 border-t border-border-grid text-[12px]">
             <div className="text-t3">Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, transformers.length)} of {transformers.length}</div>
             <div className="flex gap-2">
               <button 
                 disabled={page === 1} 
                 onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                 className="px-3 py-1.5 bg-bg3 text-t2 border border-border-grid rounded-md hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                 Previous
               </button>
               <button 
                 disabled={page >= Math.ceil(transformers.length / itemsPerPage)} 
                 onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(Math.ceil(transformers.length / itemsPerPage), p + 1)); }}
                 className="px-3 py-1.5 bg-bg3 text-t2 border border-border-grid rounded-md hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                 Next
               </button>
             </div>
          </div>
        </div>
        {/* ml geo map */}
        <GeospatialMap transformers={transformers} />
      </div>
    </motion.div>
  );
}
