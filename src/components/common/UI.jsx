import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const statusColor = (s) =>
  s === "critical" ? "text-grid-red" : s === "warning" ? "text-grid-amber" : "text-grid-green";

export const statusBg = (s) =>
  s === "critical" ? "bg-grid-red-bg" : s === "warning" ? "bg-grid-amber-bg" : "bg-grid-green-bg";

export const statusBorder = (s) =>
  s === "critical" ? "border-grid-red/20" : s === "warning" ? "border-grid-amber/20" : "border-grid-green/20";

const HEX = {
  blue: "#38bdf8", red: "#ef4444", amber: "#f59e0b",
  green: "#10b981", purple: "#a78bfa", cyan: "#22d3ee",
};
const getHex = (colorClass) => {
  for (const [k, v] of Object.entries(HEX)) if (colorClass?.includes(k)) return v;
  return "#38bdf8";
};

export function Badge({ status, label, className }) {
  const colors = {
    critical: { bg: '#fef2f2', border: '#fee2e2', text: '#dc2626' },
    warning:  { bg: '#fffbeb', border: '#fef3c7', text: '#d97706' },
    safe:     { bg: '#f0fdf4', border: '#dcfce7', text: '#16a34a' },
  };
  const c = colors[status] || colors.safe;
  return (
    <span
      className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", className)}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {label || status}
    </span>
  );
}

export function MetricCard({ icon: Icon, label, value, sub, colorClass = "text-grid-blue", pulse, className }) {
  const hex = getHex(colorClass);
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn("relative overflow-hidden rounded-2xl p-5 transition-all glass-card", className)}
      style={{
        border: `1px solid ${hex}30`,
        boxShadow: `0 4px 20px -5px ${hex}15, 0 0 3px rgba(15,23,42,0.03)`
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.05]"
        style={{ background: `radial-gradient(circle at top right, ${hex}, transparent)` }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl" style={{ background: `${hex}08`, border: `1px solid ${hex}15` }}>
          <Icon size={18} style={{ color: hex }} />
        </div>
        <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold font-jetbrains">{label}</span>
        {pulse && (
          <span className="w-2 h-2 rounded-full ml-auto animate-gg-pulse shadow-sm"
            style={{ background: hex }} />
        )}
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-tight text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 font-medium mt-2">{sub}</div>}
    </motion.div>
  );
}

export function SectionTitle({ label, className }) {
  return (
    <div className={cn("text-[11px] font-bold text-t2 tracking-[0.15em] uppercase flex items-center gap-2", className)}>
      <span className="w-0.5 h-3 rounded-full inline-block"
        style={{ background: 'linear-gradient(180deg, #38bdf8, #6366f1)' }} />
      {label}
    </div>
  );
}

export function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-t2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
      {label}
    </span>
  );
}

export function StatPill({ label, value, colorClass }) {
  const hex = getHex(colorClass);
  return (
    <div className="rounded-xl px-4 py-2.5 bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
      <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{label}</div>
      <div className="text-[14px] font-extrabold tracking-tight mt-0.5" style={{ color: hex }}>{value}</div>
    </div>
  );
}

export function Tag({ label, colorClass, className }) {
  const hex = getHex(colorClass);
  return (
    <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", className)}
      style={{ background: `${hex}12`, border: `1px solid ${hex}25`, color: hex }}>
      {label}
    </span>
  );
}

export function CtrlBtn({ icon, label, onClick, colorClass = "text-t2" }) {
  const hex = getHex(colorClass);
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
      style={{ background: `${hex}08`, border: `1px solid ${hex}22`, color: hex }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${hex}15`;
        e.currentTarget.style.borderColor = `${hex}45`;
        e.currentTarget.style.boxShadow = `0 0 15px ${hex}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${hex}08`;
        e.currentTarget.style.borderColor = `${hex}22`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {icon} {label}
    </motion.button>
  );
}

export function ActionBtn({ icon, label, colorClass, active, onClick }) {
  const hex = getHex(colorClass);
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-[12px] font-semibold transition-all cursor-pointer text-left"
      style={active
        ? { background: 'white', border: `1px solid ${hex}`, color: hex, boxShadow: `0 8px 16px -4px ${hex}20` }
        : { background: 'white', border: '1px solid #f1f5f9', color: '#64748b' }
      }
    >
      {icon} {label}
    </motion.button>
  );
}
