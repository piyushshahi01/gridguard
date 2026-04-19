import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Layout } from "./components/Layout";
import { AdminDashboard } from "./components/AdminDashboard";
import { InspectorDashboard } from "./components/InspectorDashboard";
import { DetailPanel } from "./components/DetailPanel";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { GridMonitor } from "./components/GridMonitor";
import { AlertDashboard } from "./components/AlertDashboard";
import { fetchData, simulateTheft, resetSimulation } from "./services/dataService";

function App() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [data, setData] = useState({ transformers: [], alerts: [] });
  const [selectedTx, setSelectedTx] = useState(null);
  const [sideTab, setSideTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('gridguard_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setShowLanding(false);
      } catch (e) {
        localStorage.removeItem('gridguard_user');
        localStorage.removeItem('gridguard_token');
      }
    }
  }, []);

  const role = user?.role || 'inspector';

  const handleAuth = (userData) => {
    setUser(userData);
    setShowLanding(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowLanding(true);
    localStorage.removeItem('gridguard_user');
    localStorage.removeItem('gridguard_token');
  };

  const loadData = useCallback(async () => {
    try {
      const result = await fetchData();
      setData(result);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(() => { loadData(); }, 5000);
      return () => clearInterval(interval);
    }
  }, [loadData, user]);

  const handleGenerate = useCallback(async () => {
    const result = await resetSimulation();
    setData(result);
    setSelectedTx(null);
  }, []);

  const handleSimulate = useCallback(async () => {
    const result = await simulateTheft();
    setData(result);
    setSelectedTx(null);
  }, []);

  const handleReset = useCallback(async () => {
    const result = await resetSimulation();
    setData(result);
    setSelectedTx(null);
  }, []);

  const criticalCount = useMemo(() =>
    data.alerts.filter(a => a.severity === "critical" && (a.actionStatus === "open" || a.actionStatus === "assigned")).length,
  [data.alerts]);

  // Show landing page first
  if (showLanding && !user) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  // Show auth if not logged in
  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-grid-green/30 border-t-grid-green rounded-full animate-spin" />
          <span className="text-t2 font-chakra text-sm uppercase tracking-widest">Reaching GridGuard Servers...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout
      role={role}
      sideTab={sideTab}
      setSideTab={setSideTab}
      criticalCount={criticalCount}
      setSelectedTx={setSelectedTx}
      user={user}
      onLogout={handleLogout}
    >
      {role === "admin" ? (
        selectedTx ? (
          <DetailPanel transformer={selectedTx} onBack={() => setSelectedTx(null)} onDataUpdate={loadData} alerts={data.alerts} />
        ) : sideTab === "grid" ? (
          <GridMonitor
            data={data}
            onGenerate={handleGenerate}
            onSimulate={handleSimulate}
            onReset={handleReset}
          />
        ) : sideTab === "alerts" ? (
          <AlertDashboard data={data} onSelect={setSelectedTx} />
        ) : (
          <AdminDashboard
            data={data}
            onSelect={setSelectedTx}
            onGenerate={handleGenerate}
            onSimulate={handleSimulate}
            onReset={handleReset}
            onDataUpdate={loadData}
          />
        )
      ) : (
        <InspectorDashboard 
          data={data} 
          inspectorName={user?.name || "J. Rajan"} 
          onDataUpdate={loadData} 
          sideTab={sideTab}
          setSideTab={setSideTab}
        />
      )}
    </Layout>
  );
}

export default App;
