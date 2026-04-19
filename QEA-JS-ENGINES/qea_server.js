const express = require('express');
const { execSync } = require('child_process');

const app = express();
const PORT = 3141; // Port Pi

app.use(express.json());

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
    console.log(`             Listening on http://localhost:${PORT}/qea/observe   `);
    console.log("=================================================================\n");
});
