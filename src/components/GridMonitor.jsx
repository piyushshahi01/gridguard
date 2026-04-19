import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Zap, AlertTriangle, TrendingDown, Activity, RefreshCw,
  Play, RotateCcw, Cpu, MapPin, Clock, Shield, Flame,
  DollarSign, ChevronRight, Radio
} from "lucide-react";
import { SectionTitle, LegendDot, Badge, statusColor, CtrlBtn } from "./common/UI";

// ─── Mini Sparkline in header cards ──────────────────────────────
function Spark({ data, color }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={40} minWidth={0} minHeight={0}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Pulsing dot ─────────────────────────────────────────────────
function LiveDot({ color = "#10b981" }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
        style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

// ─── Region status card ───────────────────────────────────────────
function RegionCard({ name, supply, consumption, anomalies, count }) {
  const loss = supply > 0 ? ((supply - consumption) / supply * 100).toFixed(1) : 0;
  const severity = anomalies > 5 ? "critical" : anomalies > 0 ? "warning" : "safe";
  const color = severity === "critical" ? "#ef4444" : severity === "warning" ? "#f59e0b" : "#10b981";
  return (
    <div className={`bg-bg2 border rounded-xl p-4 flex flex-col gap-2 hover:border-opacity-60 transition-all group
      ${severity === "critical" ? "border-grid-red/30" : severity === "warning" ? "border-grid-amber/30" : "border-border-grid"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LiveDot color={color} />
          <span className="text-[13px] font-bold text-t1">{name}</span>
        </div>
        <Badge status={severity} />
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div>
          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Supply</div>
          <div className="text-[12px] font-bold text-grid-green font-chakra">{(supply / 1000).toFixed(1)} MWh</div>
        </div>
        <div>
          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Theft %</div>
          <div className={`text-[12px] font-bold font-chakra ${parseFloat(loss) > 15 ? "text-grid-red" : "text-grid-amber"}`}>{loss}%</div>
        </div>
        <div>
          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">Anomalies</div>
          <div className={`text-[12px] font-bold font-chakra ${anomalies > 0 ? "text-grid-red" : "text-grid-green"}`}>{anomalies}</div>
        </div>
      </div>
      <div className="h-1 w-full bg-border-grid rounded-full overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(parseFloat(loss) * 3, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export function GridMonitor({ data, onGenerate, onSimulate, onReset }) {
  const { transformers = [], alerts = [], analytics = {} } = data;

  // ─── Live loss trend history (rolling 20 ticks) ──────────────
  const trendRef = useRef([]);
  const [trend, setTrend] = useState([]);
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(0);

  // Compute live totals from real ML data
  const totalSupply      = transformers.reduce((s, t) => s + t.supply, 0);
  const totalConsumption = transformers.reduce((s, t) => s + t.consumption, 0);
  const totalTheftKwh    = transformers.reduce((s, t) => s + (t.theft_kwh || 0), 0);
  const totalTheftValue  = transformers.reduce((s, t) => s + (t.financial_loss || 0), 0);
  
  const lossKwh          = totalSupply - totalConsumption;
  const theftPct         = totalSupply > 0 ? ((totalTheftKwh / totalSupply) * 100).toFixed(1) : 0;
  
  const revenuePerKwh    = 8.5; // Rs per kWh (Punjab tariff approx)
  const theftRevenue     = totalTheftValue.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const criticalTx       = transformers.filter(t => t.status === "critical").length;
  const warningTx        = transformers.filter(t => t.status === "warning").length;
  const activeAlerts     = alerts.filter(a => a.actionStatus === "open" || a.actionStatus === "assigned");

  // Build region cards from analytics
  const byRegion = analytics.byRegion || [];

  // Update rolling trend on each data change
  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const next = [...trendRef.current, { time: now, theft: parseFloat(theftPct), supply: Math.round(totalSupply), consumption: Math.round(totalConsumption), v: parseFloat(theftPct) }];
    trendRef.current = next.slice(-20);
    setTrend([...trendRef.current]);
    setLastUpdated(0);
  }, [data]);

  // Tick counter
  useEffect(() => {
    const t = setInterval(() => setLastUpdated(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">

      {/* ─── Header Controls ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-t1 font-chakra tracking-tight flex items-center gap-2">
            <Radio size={18} className="text-grid-blue" /> Grid Monitor
            <span className="text-[10px] text-t3 font-normal ml-2 normal-case">Live Control Room</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            <CtrlBtn icon={<RefreshCw size={14} />} label="Generate Data" onClick={onGenerate} colorClass="text-grid-blue" />
            <CtrlBtn icon={<Play size={14} />} label="Simulate Theft" onClick={onSimulate} colorClass="text-grid-red" />
            <CtrlBtn icon={<RotateCcw size={14} />} label="Refresh" onClick={onReset} colorClass="text-t2" />
          </div>
          <div className="flex items-center gap-2 bg-bg2 border border-border-grid rounded-lg px-3 py-2">
            <LiveDot />
            <span className="text-[10px] text-t3 font-bold tracking-widest uppercase">System Live</span>
            <span className="text-[10px] text-t3 ml-2 flex items-center gap-1">
              <Clock size={9} /> {lastUpdated}s ago
            </span>
          </div>
        </div>
      </div>

      {/* ─── Top KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Zap, label: "Total Supply", value: `${(totalSupply / 1000).toFixed(1)} MWh`, sub: "Grid output", color: "text-grid-green", spark: trend.map(d => ({ v: d.supply })), sparkColor: "#10b981" },
          { icon: Activity, label: "Consumption", value: `${(totalConsumption / 1000).toFixed(1)} MWh`, sub: "Metered demand", color: "text-grid-blue", spark: trend.map(d => ({ v: d.consumption })), sparkColor: "#38bdf8" },
          { icon: Shield, label: "Theft Detected", value: `${theftPct}%`, sub: `${(totalTheftKwh / 1000).toFixed(2)} MWh theft`, color: parseFloat(theftPct) > 8 ? "text-grid-red" : "text-grid-amber", spark: trend.map(d => ({ v: d.theft })), sparkColor: parseFloat(theftPct) > 8 ? "#ef4444" : "#f59e0b" },
          { icon: DollarSign, label: "Theft Impact", value: `₹${theftRevenue}`, sub: "Recovery potential", color: "text-grid-red", spark: null, sparkColor: "#ef4444" },
          { icon: Flame, label: "Active Theft", value: criticalTx, sub: "High-risk nodes", color: "text-grid-red", spark: null, sparkColor: "#ef4444" },
          { icon: AlertTriangle, label: "Investigations", value: activeAlerts.length, sub: "Ongoing cases", color: activeAlerts.length > 0 ? "text-grid-amber" : "text-grid-green", spark: null, sparkColor: "#f59e0b" },
        ].map((card, i) => (
          <div key={i} className="bg-bg2 border border-border-grid rounded-xl p-4 flex flex-col gap-1 hover:border-border-hov transition-all">
            <div className="flex items-center gap-2">
              <card.icon size={14} className={card.color} />
              <span className="text-[9px] text-t3 font-bold uppercase tracking-widest">{card.label}</span>
            </div>
            <div className={`text-[20px] font-bold font-chakra ${card.color} leading-none mt-1`}>{card.value}</div>
            <div className="text-[9px] text-t3">{card.sub}</div>
            {card.spark && card.spark.length > 1 && <div className="mt-1 -mx-1"><Spark data={card.spark} color={card.sparkColor} /></div>}
          </div>
        ))}
      </div>

      {/* ─── Main Grid: Trend Chart + Alerts Feed ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">

        {/* Loss Trend Chart */}
        <div className="bg-bg2 border border-border-grid rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle label="Live Loss Trend — Rolling 20 Ticks" />
            {parseFloat(theftPct) > 15 && (
              <div className="flex items-center gap-1.5 bg-grid-red/10 border border-grid-red/20 px-2.5 py-1 rounded-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-grid-red" />
                <span className="text-[9px] text-grid-red font-bold uppercase tracking-widest">Spike Detected</span>
              </div>
            )}
          </div>
          <div className="flex gap-4 mb-4">
            <LegendDot color="#10b981" label="Total Supply" />
            <LegendDot color="#38bdf8" label="Consumption" />
            <LegendDot color="#ef4444" label="Theft Variance %" />
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gmc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4b6080" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="kwh" tick={{ fontSize: 9, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 9, fill: "#4b6080" }} tickLine={false} axisLine={false} domain={[0, 30]} />
                <Tooltip
                  contentStyle={{ background: "#0d1b2a", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 11 }}
                  formatter={(val, name) => [name === "Theft %" ? `${val}%` : `${val} kWh`, name]}
                />
                <Area yAxisId="kwh" type="monotone" dataKey="supply" stroke="#10b981" strokeWidth={2} fill="url(#gms)" name="Supply (kWh)" dot={false} />
                <Area yAxisId="kwh" type="monotone" dataKey="consumption" stroke="#38bdf8" strokeWidth={2} fill="url(#gmc)" name="Consumption (kWh)" dot={false} />
                <Line yAxisId="pct" type="monotone" dataKey="theft" stroke="#ef4444" strokeWidth={2} dot={false} name="Theft %" />
                <ReferenceLine yAxisId="pct" y={15} stroke="#f59e0b" strokeDasharray="5 5"
                  label={{ value: "15% threshold", fill: "#f59e0b", fontSize: 9, position: "right" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-Time Alerts Feed */}
        <div className="bg-bg2 border border-border-grid rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle label="Real-Time Alerts Feed" />
            <div className="flex items-center gap-1.5">
              <LiveDot color={activeAlerts.length > 0 ? "#ef4444" : "#10b981"} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${activeAlerts.length > 0 ? "text-grid-red" : "text-grid-green"}`}>
                {activeAlerts.length > 0 ? `${activeAlerts.length} Active` : "All Clear"}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px] pr-1">
            {activeAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-28 text-t3 text-[12px] gap-2">
                <Shield size={22} className="text-grid-green" />
                No active anomalies detected
              </div>
            )}
            {activeAlerts
              .sort((a, b) => (b.theft_loss || 0) - (a.theft_loss || 0))
              .slice(0, 15).map((a, i) => (
              <div key={a.id || i}
                className={`flex items-start gap-3 p-3 rounded-lg border border-l-4 transition-all
                  ${a.severity === "critical"
                    ? "bg-grid-red/5 border-border-grid border-l-grid-red"
                    : "bg-grid-amber/5 border-border-grid border-l-grid-amber"}`}>
                <AlertTriangle size={13} className={a.severity === "critical" ? "text-grid-red mt-0.5 shrink-0" : "text-grid-amber mt-0.5 shrink-0"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${a.severity === "critical" ? "text-grid-red" : "text-grid-amber"}`}>
                      {a.transformer || a.id}
                    </span>
                    <span className="text-[9px] text-t3 shrink-0">{a.time || "Just Now"}</span>
                  </div>
                  <div className="text-[11px] text-t2 mt-0.5 truncate">{a.location}</div>
                  <div className="text-[10px] text-t3 mt-0.5">Theft: <span className="text-grid-red font-bold">{a.theft_loss}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Region Status Grid ───────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle label="Region-wise Grid Health" />
          <span className="text-[10px] text-t3">{byRegion.length} regions monitored</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {byRegion.map((r, i) => (
            <RegionCard key={i}
              name={r.region}
              supply={r.supply}
              consumption={r.consumption}
              anomalies={r.anomalies}
              count={r.count}
            />
          ))}
        </div>
      </div>

      {/* ─── Zone Type Bar Chart ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-bg2 border border-border-grid rounded-xl p-5">
          <SectionTitle label="Zone-wise Loss Analysis" />
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byZone || []} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#4b6080" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="zone" tick={{ fontSize: 9, fill: "#8ba3c7" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 11 }}
                  formatter={(val, name) => [`${val.toFixed(1)}%`, name]} />
                <Bar dataKey="loss" name="Avg Loss %" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine summary */}
        <div className="bg-bg2 border border-border-grid rounded-xl p-5 flex flex-col gap-4">
          <SectionTitle label="ML Model Summary" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Algorithm", value: "Isolation Forest", icon: Cpu, color: "text-grid-blue" },
              { label: "Training Rows", value: "1,200", icon: Activity, color: "text-grid-cyan" },
              { label: "Features", value: "3 (supply, meter, loss)", icon: Zap, color: "text-grid-green" },
              { label: "Anomaly Rate", value: "10% contam.", icon: TrendingDown, color: "text-grid-amber" },
              { label: "Model Accuracy", value: "95%", icon: Shield, color: "text-grid-green" },
              { label: "F1-Score (Anomaly)", value: "0.74", icon: Flame, color: "text-grid-red" },
            ].map((item, i) => (
              <div key={i} className="bg-bg3 rounded-lg p-3 flex items-start gap-2.5">
                <item.icon size={14} className={`${item.color} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">{item.label}</div>
                  <div className={`text-[12px] font-bold font-chakra ${item.color}`}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
