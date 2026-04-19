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
    critical: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444' },
    warning:  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
    safe:     { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
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
      className={cn("relative overflow-hidden rounded-xl p-4 transition-all", className)}
      style={{
        background: 'linear-gradient(135deg, rgba(17,24,39,0.85) 0%, rgba(11,17,32,0.7) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hex}18`,
      }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle at top right, ${hex}, transparent)` }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${hex}14` }}>
          <Icon size={15} style={{ color: hex }} />
        </div>
        <span className="text-[11px] text-t3 uppercase tracking-wider font-semibold">{label}</span>
        {pulse && (
          <span className="w-1.5 h-1.5 rounded-full ml-auto animate-gg-pulse"
            style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
        )}
      </div>
      <div className="text-[26px] font-bold leading-none font-chakra text-t1">{value}</div>
      {sub && <div className="text-[11px] text-t2 mt-1.5">{sub}</div>}
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
    <div className="rounded-lg px-3 py-2"
      style={{ background: 'rgba(22,32,50,0.8)', border: '1px solid rgba(30,45,69,0.6)' }}>
      <div className="text-[9px] text-t3 uppercase font-bold tracking-widest">{label}</div>
      <div className="text-[13px] font-bold font-chakra mt-0.5" style={{ color: hex }}>{value}</div>
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
        ? { background: `${hex}12`, border: `1px solid ${hex}38`, color: hex, boxShadow: `0 0 12px ${hex}18` }
        : { background: 'rgba(22,32,50,0.6)', border: '1px solid rgba(30,45,69,0.6)', color: '#94a3b8' }
      }
    >
      {icon} {label}
    </motion.button>
  );
}
