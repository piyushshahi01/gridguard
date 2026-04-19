import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, ShieldCheck } from 'lucide-react';

const API_URL = 'http://localhost:3000/auth';

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('admin');  // 'admin' | 'inspector'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/login' : '/signup';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      // Save token and user data
      localStorage.setItem('gridguard_token', data.token);
      localStorage.setItem('gridguard_user', JSON.stringify(data));
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg0 flex overflow-hidden relative font-jetbrains">
      {/* Animated grid background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2d4520_1px,transparent_1px),linear-gradient(to_bottom,#1e2d4520_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(16,185,129,0.08),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_40%_at_80%_20%,rgba(56,189,248,0.05),transparent)]" />
      </div>

      {/* Left Panel — Auth Form */}
      <div className="relative z-10 w-full lg:w-[55%] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-grid-green to-grid-cyan flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Zap size={24} className="text-bg0 fill-bg0" />
            </div>
            <div>
              <div className="text-[18px] font-bold text-t1 font-chakra tracking-tight uppercase leading-none">GRIDGUARD</div>
              <div className="text-[10px] text-grid-green font-bold tracking-[0.2em] uppercase">AI Security Platform</div>
            </div>
          </div>

          {/* Role Toggle */}
          <div className="flex mb-8 bg-bg1 rounded-xl border border-border-grid p-1 gap-1">
            <button
              onClick={() => setRole('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-grid-green/20 to-grid-cyan/10 text-grid-green border border-grid-green/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'text-t3 hover:text-t2'
              }`}
            >
              <Shield size={16} /> Admin
            </button>
            <button
              onClick={() => setRole('inspector')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                role === 'inspector'
                  ? 'bg-gradient-to-r from-grid-blue/20 to-grid-cyan/10 text-grid-blue border border-grid-blue/30 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                  : 'text-t3 hover:text-t2'
              }`}
            >
              <ShieldCheck size={16} /> Inspector
            </button>
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold font-chakra text-t1 mb-2">
                <span className={role === 'admin' ? 'text-grid-green' : 'text-grid-blue'}>
                  {role === 'admin' ? 'Admin' : 'Inspector'}
                </span>{' '}
                {mode === 'login' ? 'Login' : 'Sign Up'}
              </h1>
              <p className="text-[14px] text-t3 mb-8">
                {mode === 'login'
                  ? 'Please enter your credentials to proceed.'
                  : 'Create your account to access the platform.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-grid-red/10 border border-grid-red/30 rounded-lg text-grid-red text-[13px] font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name (signup only) */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="text-[12px] text-t2 font-bold uppercase tracking-widest mb-2 block">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-t3" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full bg-bg1 border border-border-grid rounded-xl pl-12 pr-4 py-3.5 text-[14px] text-t1 placeholder:text-t3/50 focus:outline-none focus:border-grid-green/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all duration-300"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="text-[12px] text-t2 font-bold uppercase tracking-widest mb-2 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-t3" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-bg1 border border-border-grid rounded-xl pl-12 pr-4 py-3.5 text-[14px] text-t1 placeholder:text-t3/50 focus:outline-none focus:border-grid-green/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] text-t2 font-bold uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-t3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full bg-bg1 border border-border-grid rounded-xl pl-12 pr-12 py-3.5 text-[14px] text-t1 placeholder:text-t3/50 focus:outline-none focus:border-grid-green/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all duration-300"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me / Forgot */}
            {mode === 'login' && (
              <div className="flex justify-between items-center text-[12px]">
                <label className="flex items-center gap-2 text-t3 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-border-grid bg-bg1 accent-grid-green" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-grid-green/70 hover:text-grid-green transition-colors font-medium cursor-pointer">
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl text-[14px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl cursor-pointer disabled:opacity-50 ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-grid-green to-emerald-500 text-bg0 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-grid-blue to-cyan-400 text-bg0 shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.4)]'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-bg0/30 border-t-bg0 rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle mode */}
          <div className="mt-8 text-center text-[13px] text-t3">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} className="text-grid-green font-bold hover:underline cursor-pointer">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-grid-green font-bold hover:underline cursor-pointer">
                  Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Dashboard Preview (hidden on mobile) */}
      <div className="hidden lg:flex relative z-10 w-[45%] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg relative"
          style={{ perspective: '1000px' }}
        >
          {/* Glow effect behind card */}
          <div className={`absolute inset-0 rounded-3xl blur-3xl opacity-20 ${
            role === 'admin' ? 'bg-grid-green' : 'bg-grid-blue'
          }`} />

          {/* Mock Dashboard Card */}
          <div className="relative bg-bg1/80 backdrop-blur-xl border border-border-grid rounded-2xl overflow-hidden shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-grid bg-bg2/50">
              <div className="flex items-center gap-2">
                <Zap size={14} className={role === 'admin' ? 'text-grid-green' : 'text-grid-blue'} />
                <span className="text-[12px] font-chakra font-bold text-t2 uppercase">GridGuard</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-grid-red/60" />
                <span className="w-3 h-3 rounded-full bg-grid-amber/60" />
                <span className="w-3 h-3 rounded-full bg-grid-green/60" />
              </div>
            </div>

            {/* Dashboard preview title */}
            <div className="px-5 pt-4 pb-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${role === 'admin' ? 'text-grid-green' : 'text-grid-blue'}`}>
                {role === 'admin' ? 'Admin' : 'Inspector'} Dashboard
              </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 px-5 py-3">
              {[
                { label: 'Transformers', value: '8', color: 'text-grid-cyan' },
                { label: 'Active Alerts', value: '3', color: 'text-grid-red' },
                { label: 'Risk Score', value: '72%', color: 'text-grid-amber' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="bg-bg2 border border-border-grid rounded-lg p-3"
                >
                  <div className="text-[9px] text-t3 font-bold uppercase tracking-widest">{s.label}</div>
                  <div className={`text-xl font-bold font-chakra ${s.color} mt-1`}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Fake graph */}
            <div className="px-5 py-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-bg2 border border-border-grid rounded-lg p-4 h-[140px] relative overflow-hidden"
              >
                <div className="text-[9px] text-t3 font-bold uppercase tracking-widest mb-3">Supply vs. Consumption</div>
                <svg viewBox="0 0 400 80" className="w-full h-[80px]">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="#1e2d4540" strokeWidth="1" />
                  <line x1="0" y1="40" x2="400" y2="40" stroke="#1e2d4540" strokeWidth="1" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#1e2d4540" strokeWidth="1" />
                  {/* Supply (green) */}
                  <motion.path
                    d="M 0 60 Q 50 55, 100 45 Q 150 35, 200 25 Q 250 20, 300 30 Q 350 35, 400 40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 1 }}
                  />
                  {/* Consumption (red with anomaly spike) */}
                  <motion.path
                    d="M 0 65 Q 50 60, 100 50 Q 150 42, 200 35 Q 230 75, 260 30 Q 300 40, 350 45 Q 375 48, 400 50"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  />
                  {/* Anomaly highlight zone */}
                  <motion.rect
                    x="215" y="5" width="55" height="70" rx="4"
                    fill="#ef444410"
                    stroke="#ef444430"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.5, 1] }}
                    transition={{ duration: 2, delay: 2, repeat: Infinity }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Fake table rows */}
            <div className="px-5 pb-5 space-y-2">
              {[
                { id: 'TX-006', loc: 'Old City', risk: '95%', status: 'critical' },
                { id: 'TX-003', loc: 'Industrial C', risk: '42%', status: 'warning' },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.2 }}
                  className="flex items-center justify-between bg-bg2 border border-border-grid rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.status === 'critical' ? 'bg-grid-red animate-pulse' : 'bg-grid-amber'}`} />
                    <span className="text-[11px] font-bold text-t1 font-chakra">{row.id}</span>
                    <span className="text-[10px] text-t3">{row.loc}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${row.status === 'critical' ? 'text-grid-red' : 'text-grid-amber'}`}>{row.risk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Floating accent elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute -top-6 -right-6 bg-bg2/90 border border-border-grid p-3 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="text-[9px] text-t3 font-bold uppercase tracking-widest">System Status</div>
            <div className="text-grid-green font-bold font-chakra text-lg flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-grid-green animate-pulse" /> Online
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-4 -left-6 bg-bg2/90 border border-border-grid p-3 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="text-[9px] text-t3 font-bold uppercase tracking-widest">Threats Blocked</div>
            <div className="text-grid-red font-bold font-chakra text-lg mt-0.5">147</div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
