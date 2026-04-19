import Case from '../models/Case.js';
import User from '../models/User.js';

const rng = (a, b) => Math.round(a + Math.random() * (b - a));
const rngFloat = (a, b) => a + Math.random() * (b - a);

export const TX_META = [
  { id: "TX-001", location: "Sector 4, Block B",     zone: "North Grid", type: 'Residential' },
  { id: "TX-002", location: "Sector 7, Main Road",   zone: "North Grid", type: 'Commercial' },
  { id: "TX-003", location: "Industrial Area C",     zone: "East Grid",  type: 'Industrial'  },
  { id: "TX-004", location: "Residential Block 12",  zone: "East Grid",  type: 'Residential'  },
  { id: "TX-005", location: "Commercial Hub D",      zone: "South Grid", type: 'Commercial' },
  { id: "TX-006", location: "Old City, Sector 2",    zone: "South Grid", type: 'Residential' },
  { id: "TX-007", location: "New Extension E",       zone: "West Grid",  type: 'Residential'  },
  { id: "TX-008", location: "Market Area F",         zone: "West Grid",  type: 'Commercial'  },
];

// In-memory application state
export const state = {
  simTimeHour: new Date().getHours(),
  transformers: [],
  activeAnomalies: {}, // txId -> anomaly configuration
  alerts: [],
  assignments: {} // Fallback in-memory map
};

// Configurable constants
const TICKS_PER_HOUR = 60; // Just for logical tracking
const BASE_SUPPLY = 500;

// Initialize data
function initializeEngine() {
  state.transformers = TX_META.map(meta => {
    // 20-50 meters
    const numMeters = rng(20, 50);
    const meters = Array.from({ length: numMeters }, (_, i) => ({
      id: `MTR-${meta.id.split('-')[1]}-${String(i + 1).padStart(3, "0")}`,
      type: meta.type,
      consumer: `Consumer ${i + 1}`,
      baseUsage: rng(5, 30),
      currentUsage: 0,
      anomaly: false
    }));

    // Build historical empty time series (last 24 periods)
    const timeSeries = Array.from({ length: 24 }).map((_, i) => ({
      time: `${String((state.simTimeHour - 24 + i + 24) % 24).padStart(2, '0')}:00`,
      supply: 0,
      consumption: 0
    }));

    return {
      ...meta,
      meters,
      timeSeries,
      supply: 0,
      consumption: 0,
      loss: 0,
      risk: 0,
      status: 'safe',
      explanation: "Normal operation",
      updatedAt: new Date().toISOString(),
    };
  });
}

// Get expected multiplier based on time and zone type
function getProfileMultiplier(hour, type) {
  // Morning increase, afternoon peak, night low
  let mult = 0.5; // night
  if (hour >= 6 && hour < 9) mult = 0.8; // morning ramp
  if (hour >= 9 && hour <= 17) mult = 1.0; // peak
  if (hour > 17 && hour <= 22) mult = 0.9; // evening
  
  if (type === 'Industrial') {
    if (hour >= 8 && hour <= 18) mult = 1.2; // heavy daytime
    else mult = 0.4;
  }
  return mult;
}

// ─── ANOMALY PATTERNS ──────────────────────────────────────────────────────────

/**
 * Apply 6 different anomaly types:
 * A) sudden_drop
 * B) mismatch
 * C) flatline
 * D) spike
 * E) night_time
 * F) drift
 */
function applyAnomalyProfile(tx, anomalyMeta, totalExpectedSupply, totalReportedConsumption) {
  let supply = totalExpectedSupply;
  let consumption = totalReportedConsumption;
  const type = anomalyMeta.type;
  const tickCount = anomalyMeta.ticksActive;
  let explanation = "";

  if (type === 'sudden_drop') {
    // Consumption drops >50% instantly
    consumption = consumption * 0.4;
    explanation = `Sudden Drop: Consumption dropped ${Math.round(100 - (consumption/supply)*100)}% below expected baseline.`;
    
  } else if (type === 'mismatch') {
    // Supply >> meter sum
    supply = supply * 1.6; 
    explanation = `Major Mismatch: Supply exceeds aggregated meter reporting by ${Math.round(((supply-consumption)/supply)*100)}%. Suspected direct tapping.`;
    
  } else if (type === 'flatline') {
    // Same value over long period (override consumption)
    if (!anomalyMeta.flatValue) anomalyMeta.flatValue = consumption * 0.5;
    consumption = anomalyMeta.flatValue;
    explanation = `Flatline Pattern: Meter behavior shows zero variance over time. Suspected sensor bypass or tampering.`;
    
  } else if (type === 'spike') {
    // Sudden abnormal spike
    if (tickCount < 3) {
      consumption = consumption * 2.5; 
      supply = supply * 2.0; 
    }
    explanation = `Surge Attack: Abnormal localized spike detected exceeding grid limits. Requires immediate check.`;
    
  } else if (type === 'night_time') {
    // Unusual usage at night (if it's night)
    supply = supply * Math.max(1, (24 - state.simTimeHour) * 0.2);
    consumption = supply * 0.5; // Stealing the rest
    explanation = `Night-time Theft: Irregular off-hours extraction pattern matching cryptomining or industrial bypass.`;
    
  } else if (type === 'drift') {
    // Gradual decrease over time
    const factor = Math.max(0.3, 1.0 - (tickCount * 0.05));
    consumption = consumption * factor;
    explanation = `Gradual Drift: Slow but continuous divergence from baseline. Meter degradation or engineered bypass.`;
  }

  // Update specific meters to show anomaly flags
  if (!anomalyMeta.markedMeters) {
    anomalyMeta.markedMeters = true;
    for(let i=0; i < rng(3, 8); i++) {
      tx.meters[rng(0, tx.meters.length-1)].anomaly = true;
    }
  }

  anomalyMeta.ticksActive++;
  return { s: Math.round(supply), c: Math.round(consumption), explanation };
}

// ─── TICK ENGINE ───────────────────────────────────────────────────────────────

export async function engineTick() {
  state.simTimeHour = new Date().getHours();
  // We'll rotate array using the current minute in real time as the 'fast time' for demo, 
  // or just advance simulated time if we wanted. For now, represent real time.
  const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

  for (const tx of state.transformers) {
    const mult = getProfileMultiplier(state.simTimeHour, tx.type);
    
    // Calculate raw normal stats
    let rawSupply = 0;
    let rawConsumption = 0;

    tx.meters.forEach(m => {
      // Normal usage variance
      const usage = Math.round(m.baseUsage * mult * rngFloat(0.85, 1.15));
      m.currentUsage = usage;
      rawConsumption += usage;
      m.anomaly = false; // Reset unless actively anomalous
    });
    
    // Normal grid losses (approx 5-10%)
    rawSupply = Math.round(rawConsumption * rngFloat(1.05, 1.12));

    // CHECK FOR INJECTED ANOMALY
    let finalSupply = rawSupply;
    let finalConsumption = rawConsumption;
    let explanation = "Normal operation within physical parameters.";

    const anomaly = state.activeAnomalies[tx.id];
    if (anomaly) {
      const res = applyAnomalyProfile(tx, anomaly, rawSupply, rawConsumption);
      finalSupply = res.s;
      finalConsumption = res.c;
      explanation = res.explanation;
    }

    // ─── ADVANCED ANOMALY DETECTION & RISK SCORING ────────────────────────────
    const diff = finalSupply - finalConsumption;
    const diff_percentage = Math.max(0, (diff / finalSupply) * 100);
    
    let risk_score = 0;
    
    if (anomaly) {
      // risk_score = (diff_percentage * 0.4) + (drop_severity * 0.2) + (frequency_of_anomaly * 0.2) + (time_duration * 0.1) + (pattern_severity * 0.1)
      const drop_severity = anomaly.type === 'sudden_drop' || anomaly.type === 'spike' ? 100 : 50;
      const freq = 80; // High for recurrent
      const dur = Math.min(100, anomaly.ticksActive * 5); 
      const severity = anomaly.type === 'mismatch' ? 100 : 70;
      
      risk_score = (diff_percentage * 0.4) + (drop_severity * 0.2) + (freq * 0.2) + (dur * 0.1) + (severity * 0.1);
    } else {
      // Normal minor loss risk
      risk_score = (diff_percentage * 0.4);
    }
    
    risk_score = Math.floor(Math.min(100, Math.max(0, risk_score)));

    const status = risk_score >= 60 ? "critical" : risk_score >= 30 ? "warning" : "safe";

    // Update Transformer object
    tx.supply = finalSupply;
    tx.consumption = finalConsumption;
    tx.loss = Math.round(diff_percentage);
    tx.risk = risk_score;
    tx.status = status;
    tx.explanation = explanation;
    tx.updatedAt = new Date().toISOString();

    // Push to time-series
    tx.timeSeries.shift();
    tx.timeSeries.push({ time: timeStr, supply: finalSupply, consumption: finalConsumption });

    // ─── ALERT EVENT GENERATOR ──────────────────────────────────────────────
    if (status !== 'safe') {
      await generatePersistentCase(tx, anomaly ? anomaly.type : 'drift');
    }
  }

  // Update in-memory alerts state for fast dashboard fetches
  await syncActiveAlerts();
}

async function generatePersistentCase(tx, anomalyType) {
  // Check if case exists for this transformer that is NOT resolved
  let currentCase = await Case.findOne({ transformer: tx.id, actionStatus: { $nin: ['confirmed', 'false_alarm'] } });

  if (!currentCase) {
    const alertId = `ALT-${Date.now().toString().slice(-6)}-${tx.id.split('-')[1]}`;
    
    currentCase = new Case({
      alertId,
      transformer: tx.id,
      location: tx.location,
      anomalyType,
      severity: tx.status,
      riskScore: tx.risk,
      explanation: tx.explanation,
      actionStatus: 'open'
    });

    // Auto-assignment
    try {
      // Find least-active inspector
      const inspectors = await User.find({ role: 'inspector' });
      if (inspectors.length > 0) {
        // Simple round-robin / random for demo if workload is hard to gauge, or fetch active cases
        const target = inspectors[rng(0, inspectors.length - 1)];
        currentCase.assignedTo = target.name;
        currentCase.actionStatus = 'assigned';
      }
    } catch (err) {
      console.warn("Could not auto-assign inspector: ", err.message);
    }

    await currentCase.save();
  } else {
    // Update existing case severity if it worsened
    if (tx.status === 'critical' && currentCase.severity === 'warning') {
      currentCase.severity = 'critical';
    }
    // Update live risk score and explanation
    currentCase.riskScore = tx.risk;
    currentCase.explanation = tx.explanation;
    await currentCase.save();
  }
}

async function syncActiveAlerts() {
  try {
    const activeCases = await Case.find().sort({ createdAt: -1 }).limit(100);
    // Map to memory structure expected by frontend
    state.alerts = activeCases.map(c => ({
      id: c.alertId,
      transformer: c.transformer,
      location: c.location,
      severity: c.severity,
      risk: c.riskScore,
      message: `${c.severity.toUpperCase()} — ${c.explanation.slice(0, 50)}...`,
      time: c.updatedAt,
      explanation: c.explanation,
      actionStatus: c.actionStatus,
      assignedTo: c.assignedTo,
      notes: c.notes,
      anomalyType: c.anomalyType
    }));
  } catch (err) {
    // DB not ready or err
    // fall back to empty alerts
  }
}

// ─── EXPORTED CONTROL METHODS ──────────────────────────────────────────────────

export function triggerAnomaly(txId = null, type = 'sudden_drop') {
  if (state.transformers.length === 0) return;
  
  let target = txId;
  if (!target) {
    const t = state.transformers[rng(0, state.transformers.length - 1)];
    target = t.id;
  }

  // Define anomaly metadata
  state.activeAnomalies[target] = {
    type,
    ticksActive: 0
  };
}

export async function resetAnomalies() {
  state.activeAnomalies = {};
  // Simply clear the mutations so grid goes back to normal
  await syncActiveAlerts();
}

export function getState() {
  return {
    transformers: state.transformers,
    alerts: state.alerts
  };
}

export async function updateCaseStatus(alertId, status, notes) {
  const c = await Case.findOne({ alertId });
  if (c) {
    c.actionStatus = status;
    if (notes) c.notes = notes;
    c.history.push({ status, notes, updatedAt: new Date() });
    await c.save();
  }
  await syncActiveAlerts();
}

export async function assignCaseInspector(alertId, inspectorName) {
  const c = await Case.findOne({ alertId });
  if (c) {
    c.assignedTo = inspectorName;
    c.actionStatus = 'assigned';
    c.history.push({ status: 'assigned', notes: `Auto-assigned/Reassigned to ${inspectorName}`, updatedAt: new Date() });
    await c.save();
  }
  await syncActiveAlerts();
}

// Initialize on boot
initializeEngine();

// Tick loop: Every 5 seconds
setInterval(engineTick, 5000);
