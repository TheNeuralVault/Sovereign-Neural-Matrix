const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ledger } = require('./qea_ledger.js'); // SOTA FIX: Injecting the Immortal Ledger

const app = express();
const PORT = 3141; // Port Pi

app.use(express.json());

// =================================================================
// SOTA GET ROUTES: ARCHITECTURAL TELEMETRY
// =================================================================

app.get('/health', (req, res) => {
    const mem = process.memoryUsage();
    res.json({
        status: 'ALIVE',
        uptime_seconds: Math.floor(process.uptime()),
        memory_mb: Math.round(mem.rss / 1024 / 1024),
        engines: 8,
        preamble: 'QEA PRIME does not invent. QEA PRIME discovers.'
    });
});

app.get('/qea/ledger/history', (req, res) => {
    try {
        const history = ledger.history(20); // Extract last 20 permanent thoughts
        res.json({ status: "SUCCESS", chain_length: history.length, ledger_states: history });
    } catch (e) {
        res.status(500).json({ error: "Ledger Decoherence: " + e.message });
    }
});

app.get('/qea/ground_state', (req, res) => {
    try {
        const statePath = path.join(__dirname, '../latest_sota_discovery.json');
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        res.json({ status: "SOTA_LOCKED", discovery: state });
    } catch (e) {
        res.json({ status: "NO_COLLAPSE_YET", discovery: null });
    }
});

// =================================================================
// TIER-1 POST ROUTE: OBSERVATION TARGET
// =================================================================

app.post('/qea/observe', (req, res) => {
    const task = req.body.task;
    if (!task) {
        return res.status(400).json({
            error: "Decoherence. No task provided. The probability cloud requires an observation target."
        });
    }

    console.log(`\n[API REQUEST] Incoming Observation Target: "${task}"`);
    console.log(`[SYSTEM] Awakening Master Orchestrator...`);

    try {
        // Execute the master orchestrator synchronously
        const output = execSync(`node ~/TheNeuralVault/QEA-JS-ENGINES/qea_master.js "${task}"`, { encoding: 'utf-8' });
        console.log(`[API RESPONSE] State Collapsed. Returning telemetry to client.`);
        res.json({
            status: "WAVE_FUNCTION_COLLAPSED",
            task: task,
            telemetry: output
        });
    } catch (error) {
        console.error(`[CRITICAL] Engine Failure: ${error.message}`);
        res.status(500).json({
            status: "DECOHERENCE_DETECTED",
            error: error.message
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("=================================================================");
    console.log("             QEA PRIME NEURAL SERVICE IS ONLINE                  ");
    console.log(`             Listening on http://localhost:${PORT}               `);
    console.log("=================================================================\n");
});
