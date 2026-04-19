import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { 
  getState, 
  triggerAnomaly, 
  resetAnomalies, 
  assignCaseInspector, 
  updateCaseStatus,
  engineTick
} from '../engine/simulator.js';
import Case from '../models/Case.js';
import User from '../models/User.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper: run ML model and return parsed result
function runMLModel(simulateTheft = false) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'ml_model.py');
        const cmd = `python "${scriptPath}" ${simulateTheft ? '--theft' : ''}`;
        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err);
            try {
                const data = JSON.parse(stdout);
                if (data.error) throw new Error(data.error);
                resolve(data);
            } catch (e) {
                reject(e);
            }
        });
    });
}

// ─── In-memory cache so polling never blocks ───────────────────────────────
let mlCache = null;
let mlCacheStale = true;
let lastRunTime = 0;
const CACHE_TTL_MS = 5_000; // refresh every 5s

// Function to bridge Python output with MongoDB Case persistence
async function syncAndMergeAlerts(data) {
    if (!data || !data.alerts) return data;

    try {
        // 1. Get all relevant cases from DB to merge statuses
        const dbCases = await Case.find({ 
            alertId: { $in: data.alerts.map(a => a.id) } 
        });
        const caseMap = dbCases.reduce((acc, c) => {
            acc[c.alertId] = c;
            return acc;
        }, {});

        // 2. Iterate and sync
        for (let alert of data.alerts) {
            const dbCase = caseMap[alert.id];

            if (dbCase) {
                // Merge status and assignment FROM Database TO Python Output
                alert.actionStatus = dbCase.actionStatus;
                alert.assignedTo = dbCase.assignedTo;
                alert.notes = dbCase.notes;
            } else if (alert.severity === 'critical') {
                // If it's critical but doesn't exist, CREATE it in DB for persistence
                try {
                    await Case.create({
                        alertId: alert.id,
                        transformer: alert.transformer,
                        location: alert.location,
                        anomalyType: alert.type || 'theft',
                        severity: alert.severity,
                        riskScore: alert.risk || 80,
                        explanation: alert.message,
                        actionStatus: 'open'
                    });
                } catch (e) {
                    // Ignore duplicate key errors if background workers race
                }
            }
        }
    } catch (err) {
        console.error("Alert Sync Error:", err);
    }
    return data;
}

async function getMLData() {
    const now = Date.now();
    if (mlCache && (now - lastRunTime) < CACHE_TTL_MS) {
        return mlCache; // instant
    }
    // Run the model, sync with DB, and cache result
    let data = await runMLModel();
    data = await syncAndMergeAlerts(data);
    
    mlCache = data;
    lastRunTime = Date.now();
    mlCacheStale = false;
    return data;
}

// Warm up the cache immediately on server start
runMLModel()
    .then(d => syncAndMergeAlerts(d))
    .then(d => { mlCache = d; lastRunTime = Date.now(); console.log('ML cache warmed.'); })
    .catch(() => {});

// Background refresh every 5s so data always appears live
setInterval(() => {
    runMLModel()
        .then(d => syncAndMergeAlerts(d))
        .then(d => { mlCache = d; lastRunTime = Date.now(); })
        .catch(() => {});
}, CACHE_TTL_MS);

// GET /data - Returns predictions from the Python Isolation Forest model for the entire dashboard
router.get('/data', async (req, res) => {
    try {
        const data = await getMLData();
        res.json(data);
    } catch (e) {
        console.error("ML Model Error:", e);
        res.status(500).json({ error: "Failed to generate ML data" });
    }
});

// POST /simulate - Re-runs the ML model with fresh cache
router.post('/simulate', async (req, res) => {
    try {
        lastRunTime = 0; // bust cache
        const data = await runMLModel(true); // Forced theft mode
        mlCache = data;
        lastRunTime = Date.now();
        res.json({ message: 'ML model re-run. Active theft anomalies injected.', data });
    } catch (e) {
        res.status(500).json({ error: 'ML model failed' });
    }
});

// POST /reset - Refreshes data by re-running the ML model with fresh cache
router.post('/reset', async (req, res) => {
    try {
        lastRunTime = 0; // bust cache
        const data = await runMLModel(false); // Force normal mode
        mlCache = data;
        lastRunTime = Date.now();
        res.json({ message: 'Grid data refreshed. Simulation cleared.', data });
    } catch (e) {
        res.status(500).json({ error: 'ML model failed' });
    }
});

// --- NEW ENDPOINTS based on the prompt ---

// GET /anomalies - Return active anomalies
router.get('/anomalies', async (req, res) => {
    const cases = await Case.find({ actionStatus: { $nin: ['confirmed', 'false_alarm'] } });
    res.json(cases);
});

// GET /risk - Return list of transformers sorted by risk score
router.get('/risk', (req, res) => {
    const sorted = [...getState().transformers].sort((a,b) => b.risk - a.risk);
    res.json(sorted.map(t => ({ id: t.id, risk: t.risk, status: t.status })));
});

// GET /cases - Return all historical and active cases
router.get('/cases', async (req, res) => {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
});

// GET /assigned-cases - Specific to inspectors
router.get('/assigned-cases', async (req, res) => {
    const { inspector } = req.query;
    let query = { actionStatus: { $ne: 'open' } };
    if (inspector) {
        query.assignedTo = inspector;
    }
    const cases = await Case.find(query).sort({ updatedAt: -1 });
    res.json(cases);
});

// POST /assign-inspector 
router.post('/assign-inspector', async (req, res) => {
    const { alertId, inspectorName } = req.body;
    if (!alertId || !inspectorName) {
        return res.status(400).json({ error: "Missing alertId or inspectorName" });
    }
    await assignCaseInspector(alertId, inspectorName);
    res.json({ message: `Assigned ${inspectorName} to alert ${alertId}` });
});

// POST /update-status
router.post('/update-status', async (req, res) => {
    const { alertId, status, notes } = req.body;
    if (!alertId || !status) {
        return res.status(400).json({ error: "Missing alertId or status" });
    }
    await updateCaseStatus(alertId, status, notes || "");
    res.json({ message: `Status updated to ${status}` });
});

// GET /inspector/:id
router.get('/inspector/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Inspector not found" });
    // Count their workload
    const workload = await Case.countDocuments({ assignedTo: user.name, actionStatus: { $nin: ['confirmed', 'false_alarm'] } });
    res.json({ name: user.name, email: user.email, activeCases: workload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
