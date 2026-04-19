import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const INSPECTORS = ["J. Rajan", "A. Sharma", "K. Patel", "M. Khan"];

export async function fetchData() {
    const res = await axios.get(`${API_URL}/data`);
    return res.data;
}

export async function simulateTheft() {
    const res = await axios.post(`${API_URL}/simulate`);
    // Backend returns { message, data: { transformers, alerts, analytics } }
    return res.data.data || res.data;
}

export async function resetSimulation() {
    const res = await axios.post(`${API_URL}/reset`);
    // Backend returns { message, data: { transformers, alerts, analytics } }
    return res.data.data || res.data;
}

export async function assignInspector(alertId, inspectorName) {
    const res = await axios.post(`${API_URL}/assign-inspector`, { alertId, inspectorName });
    return res.data;
}

export async function updateActionStatus(alertId, status, notes) {
    const res = await axios.post(`${API_URL}/update-status`, { alertId, status, notes });
    return res.data;
}

export async function fetchAssignedCases(inspector) {
    // Optionally filter by inspector in backend if we want, or just get all and filter
    const res = await axios.get(`${API_URL}/assigned-cases`, {
        params: { inspector }
    });
    return res.data;
}
