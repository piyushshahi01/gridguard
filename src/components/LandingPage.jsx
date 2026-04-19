import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { 
  Zap, ShieldAlert, Map, Activity, AlertTriangle, ArrowRight, 
  Cpu, Eye, Radio, TrendingDown, CheckCircle, ChevronRight
} from 'lucide-react';

/* ── Animated counter ─────────────────────────────── */
function Counter({ to, suffix = "", duration = 2 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, to, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Animated grid background ────────────────────── */
function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-bg0">
      {/* Moving grid */}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
        }}
      />
      {/* Radial gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56,189,248,0.1) 0%, transparent 70%)',
      }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64"
        style={{ background: 'linear-gradient(to top, #f8fafc, transparent)' }} />
      {/* Soft Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.1]"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.1]"
        style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', filter: 'blur(60px)' }} />
    </div>
  );
}

/* ── Feature card ─────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    className="glass-card rounded-2xl p-6 group cursor-default"
    style={{ borderColor: `${color}18` }}
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
      style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <h3 className="text-[15px] font-bold text-t1 mb-2">{title}</h3>
    <p className="text-[13px] text-t2 leading-relaxed">{desc}</p>
  </motion.div>
);

/* ── Step card ────────────────────────────────────── */
const StepCard = ({ n, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex gap-5 items-start"
  >
    <div className="w-10 h-10 rounded-full bg-grid-blue/10 border border-grid-blue/30 flex items-center justify-center text-grid-blue font-bold font-chakra shrink-0 text-[13px]">
      {n}
    </div>
    <div>
      <div className="text-[15px] font-bold text-t1 mb-1">{title}</div>
      <div className="text-[13px] text-t2 leading-relaxed">{desc}</div>
    </div>
  </motion.div>
);

/* ── Main export ──────────────────────────────────── */
export function LandingPage({ onLaunch }) {
  return (
    <div className="min-h-screen bg-bg0 text-t1 overflow-x-hidden selection:bg-grid-blue/30">
      <GridBg />

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-grid-blue to-grid-purple flex items-center justify-center glow-blue">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-t1 font-chakra tracking-tight leading-none uppercase">GRIDGUARD</div>
            <div className="text-[9px] text-grid-blue font-bold tracking-[0.2em] uppercase mt-0.5">AI Grid Intelligence</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <button onClick={onLaunch} className="hidden sm:block text-[12px] text-t2 hover:text-t1 font-semibold transition-colors uppercase tracking-widest">
            Sign In
          </button>
          <button onClick={onLaunch} className="btn-ghost text-[12px] flex items-center gap-2">
            Launch App <ArrowRight size={14} />
          </button>
        </motion.div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative z-10 min-h-[88vh] flex flex-col items-center justify-center text-center px-6 pt-10 pb-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8 glass px-4 py-2 rounded-full border border-grid-blue/20"
        >
          <span className="w-2 h-2 rounded-full bg-grid-green animate-gg-blink" />
          <span className="text-[11px] font-bold text-grid-green uppercase tracking-[0.2em]">System Live</span>
          <span className="text-[11px] text-t3 mx-1">|</span>
          <span className="text-[11px] text-t2 font-semibold">1,200 Transformers Monitored Across Punjab</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold leading-[1.08] mb-6 max-w-5xl font-chakra"
        >
          <span className="text-gradient-hero">AI-Powered Grid</span>
          <br />
          <span className="text-t1">Intelligence &amp; Fraud</span>
          <br />
          <span className="text-gradient-blue">Detection</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-[15px] md:text-[17px] text-t2 max-w-2xl leading-relaxed mb-10"
        >
          Real-time electricity theft detection using Isolation Forest ML. Monitor
          every transformer, spot anomalies, and dispatch field inspectors — all
          from one control room.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2"
          >
            <Zap size={16} className="fill-white" /> View Dashboard
          </motion.button>
          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost flex items-center gap-2"
          >
            Live Demo <ChevronRight size={16} />
          </motion.button>
        </motion.div>

        {/* Hero Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-3xl glass-card rounded-2xl p-6 border border-border-grid box-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-grid-red/70" />
              <div className="w-3 h-3 rounded-full bg-grid-amber/70" />
              <div className="w-3 h-3 rounded-full bg-grid-green/70" />
            </div>
            <div className="flex-1 text-center text-[11px] text-t3 font-mono">gridguard.ai/admin</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Transformers", val: "1,200", color: "#38bdf8" },
              { label: "Active Alerts", val: "120", color: "#ef4444" },
              { label: "Grid Loss", val: "14%", color: "#f59e0b" },
              { label: "ML Accuracy", val: "95%", color: "#10b981" },
            ].map((s, i) => (
              <div key={i} className="bg-bg0/60 rounded-xl p-3 text-center border border-border-grid/50">
                <div className="text-[11px] text-t3 uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-[22px] font-bold font-chakra" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats ──────────────────────────────────── */}
      <section className="relative z-10 py-16 border-y border-border-grid/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Transformers Monitored", to: 1200, color: "#38bdf8" },
            { label: "Anomalies Detected", to: 120, color: "#ef4444" },
            { label: "ML Model Accuracy", to: 95, suffix: "%", color: "#10b981" },
            { label: "Regions Covered", to: 6, color: "#a78bfa" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold font-chakra mb-1" style={{ color: s.color }}>
                <Counter to={s.to} suffix={s.suffix || ""} />
              </div>
              <div className="text-[12px] text-t3 uppercase tracking-widest font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="text-[11px] font-bold text-grid-blue uppercase tracking-[0.3em] mb-3">Core Capabilities</div>
          <h2 className="text-4xl font-bold font-chakra text-t1">Everything You Need to Secure the Grid</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Cpu, title: "Isolation Forest ML", desc: "Trains on 1,200 real transformer readings. Detects anomalies with 95% accuracy using unsupervised machine learning.", color: "#38bdf8", delay: 0 },
            { icon: Map, title: "Geospatial Visualization", desc: "Interactive Leaflet map with 1,200 color-coded sensors across Punjab — green, amber, and red by risk level.", color: "#10b981", delay: 0.1 },
            { icon: AlertTriangle, title: "Real-Time Alert System", desc: "Auto-generated critical alerts with severity classification, location tagging, and inspector assignment workflow.", color: "#ef4444", delay: 0.2 },
            { icon: Radio, title: "Live Grid Monitor", desc: "Control room interface showing live supply, consumption, region-wise health, and a rolling 20-tick loss trend.", color: "#a78bfa", delay: 0.3 },
            { icon: Eye, title: "Inspector Dispatch", desc: "Field responders see assigned cases with AI forensic explanation, 24H load profile chart, and action controls.", color: "#f59e0b", delay: 0.4 },
            { icon: TrendingDown, title: "Revenue Loss Tracking", desc: "Calculates estimated revenue lost in real-time using Punjab tariff of ₹8.5/kWh on the detected energy mismatch.", color: "#f472b6", delay: 0.5 },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="text-[11px] font-bold text-grid-purple uppercase tracking-[0.3em] mb-3">Architecture</div>
              <h2 className="text-4xl font-bold font-chakra text-t1 leading-tight">How GridGuard Works</h2>
            </motion.div>
            <div className="flex flex-col gap-8">
              <StepCard n="01" title="CSV → Python ML Pipeline" desc="1,200 transformer readings are fed into an Isolation Forest model. It trains, predicts anomalies, and returns structured JSON with risk scores." delay={0.1} />
              <StepCard n="02" title="Node.js API with Smart Cache" desc="Express serves ML predictions instantly via a 30-second in-memory cache. Poling never blocks — background refresh keeps data live." delay={0.2} />
              <StepCard n="03" title="React Dashboard + Inspector" desc="Admin sees the full control room, maps, and analytics. Inspectors get a task-focused view with AI forensic explanation for each anomaly." delay={0.3} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-card rounded-2xl p-6 border border-grid-purple/15 glow-purple"
          >
            <div className="text-[11px] text-t3 font-mono uppercase tracking-widest mb-4">ML Training Report</div>
            {[
              { label: "Algorithm", val: "IsolationForest", col: "#38bdf8" },
              { label: "Training Rows", val: "1,200", col: "#10b981" },
              { label: "Estimators (trees)", val: "100", col: "#a78bfa" },
              { label: "Contamination", val: "10% (Punjab T&D benchmark)", col: "#f59e0b" },
              { label: "Accuracy", val: "95%", col: "#10b981" },
              { label: "Anomaly Recall", val: "76% (87/114 caught)", col: "#ef4444" },
              { label: "F1-Score", val: "0.74 (anomaly class)", col: "#f59e0b" },
            ].map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between py-2 border-b border-border-grid/30 last:border-0"
              >
                <span className="text-[12px] text-t3 font-mono">{row.label}</span>
                <span className="text-[12px] font-bold font-mono" style={{ color: row.col }}>{row.val}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto glass-card rounded-3xl p-12 border border-grid-blue/15 grad-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-grid-blue/20 to-grid-purple/20 border border-grid-blue/30 flex items-center justify-center mx-auto mb-6 glow-blue">
              <Zap size={30} className="text-grid-blue fill-grid-blue/30" />
            </div>
            <h2 className="text-4xl font-bold font-chakra text-gradient-hero mb-4">Ready to Secure Your Grid?</h2>
            <p className="text-t2 text-[15px] mb-8 leading-relaxed">
              GridGuard detects electricity theft in real-time using AI. <br />
              1,200 sensors. 6 regions. 120 anomalies caught.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <motion.button
                onClick={onLaunch}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary flex items-center gap-2"
              >
                <Zap size={16} className="fill-white" /> Launch Control Room
              </motion.button>
              <button onClick={onLaunch} className="btn-ghost flex items-center gap-2">
                Inspector View <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="relative z-10 text-center py-8 border-t border-border-grid/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-grid-blue/20 flex items-center justify-center">
            <Zap size={12} className="text-grid-blue fill-grid-blue/30" />
          </div>
          <span className="text-[12px] font-bold font-chakra text-t2 uppercase tracking-widest">GridGuard</span>
        </div>
        <p className="text-[11px] text-t3">AI-Powered Electricity Fraud Detection · Punjab, India</p>
      </footer>
    </div>
  );
}
