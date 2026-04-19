import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, LayoutDashboard, Bell, Radio, Shield, FileText, Database, Users, Activity, AlertTriangle, LogOut } from "lucide-react";

export function Layout({ children, role, setRole, sideTab, setSideTab, criticalCount, setSelectedTx, user, onLogout }) {
  const ADMIN_TABS = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "alerts",    icon: Bell,            label: "Alerts" },
    { id: "grid",      icon: Radio,           label: "Grid Monitor" },
  ];
  const INSP_TABS = [
    { id: "dashboard", icon: Shield,    label: "My Alerts" },
    { id: "reports",   icon: FileText,  label: "Reports" },
  ];
  const tabs = role === "admin" ? ADMIN_TABS : INSP_TABS;

  const handleTabClick = (tabId) => {
    setSideTab(tabId);
    if (setSelectedTx) setSelectedTx(null);
  };

  return (
    <div className="min-h-screen bg-bg0 text-t1 flex flex-col" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* ── Header ─────────────────────────────────── */}
      <header className="h-[54px] flex items-center px-5 gap-4 shrink-0 sticky top-0 z-50 glass"
        style={{
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              boxShadow: '0 0 16px rgba(56,189,248,0.4)',
            }}>
            <Zap size={17} className="text-white fill-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-t1 font-chakra tracking-tight leading-none uppercase">GRIDGUARD</div>
            <div className="text-[8px] text-grid-blue tracking-[0.2em] font-semibold uppercase mt-0.5">AI Grid Intelligence</div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full ml-4"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-grid-green animate-gg-blink"
            style={{ boxShadow: '0 0 6px #10b981' }} />
          <span className="text-[10px] text-grid-green font-bold tracking-widest uppercase">SYSTEM LIVE</span>
        </div>

        {/* Critical badge */}
        <AnimatePresence>
          {criticalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <AlertTriangle size={12} className="text-grid-red animate-gg-pulse" />
              <span className="text-[11px] text-grid-red font-bold">
                {criticalCount} Critical Event{criticalCount > 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ml-auto flex items-center gap-3">
          {/* Role switcher */}
          <div className="hidden md:flex rounded-xl p-1 gap-1"
            style={{ background: 'rgba(5,8,15,0.6)', border: '1px solid rgba(30,45,69,0.8)' }}>
            {[
              { id: "admin",     icon: <Database size={13} />, label: "Admin" },
              { id: "inspector", icon: <Users size={13} />,    label: "Inspector" },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); handleTabClick("dashboard"); }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-300 cursor-pointer"
                style={role === r.id
                  ? { background: 'linear-gradient(135deg,#38bdf8,#6366f1)', color: 'white', boxShadow: '0 0 16px rgba(56,189,248,0.3)' }
                  : { color: '#4b6080' }
                }
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid rgba(30,45,69,0.6)' }}>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-bold text-t1 leading-none">{user?.name || 'User'}</div>
              <div className="text-[9px] text-t3 uppercase tracking-tighter mt-1">{role} Access</div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={role === "admin"
                ? { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }
                : { background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-t3 transition-all cursor-pointer hover:text-grid-red"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────── */}
        <nav className="w-[60px] flex flex-col items-center py-4 gap-2 shrink-0 bg-bg2"
          style={{
            borderRight: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '10px 0 20px -10px rgba(0,0,0,0.02)'
          }}>
          {tabs.map(t => (
            <motion.button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              title={t.label}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative"
              style={sideTab === t.id
                ? { background: 'rgba(37,99,235,0.1)', color: '#2563eb', boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.1)' }
                : { color: '#94a3b8' }
              }
            >
              <t.icon size={18} strokeWidth={sideTab === t.id ? 2.5 : 1.8} />
              {sideTab === t.id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-0.5 h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #38bdf8, #6366f1)' }}
                />
              )}
              {/* Tooltip */}
              <div className="absolute left-[52px] px-2.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-semibold"
                style={{
                  background: 'rgba(11,17,32,0.95)',
                  border: '1px solid rgba(56,189,248,0.15)',
                  backdropFilter: 'blur(10px)',
                  color: '#e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                {t.label}
              </div>
            </motion.button>
          ))}

          <div className="flex-1" />
          <div className="w-6 h-px my-2" style={{ background: 'rgba(30,45,69,0.6)' }} />
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-t3 hover:text-t2 transition-all cursor-pointer">
            <Activity size={17} />
          </button>
        </nav>

        {/* ── Main content ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5 scroll-smooth">
          <motion.div
            key={sideTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
