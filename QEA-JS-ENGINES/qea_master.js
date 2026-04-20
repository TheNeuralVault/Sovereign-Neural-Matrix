const { execSync } = require('child_process');
const fs = require('fs');
const { QECEngine, Claim } = require('./qec_engine.js');
const { DensityMatrixEngine } = require('./density_matrix_engine.js');

// SOTA FIX: Injecting the Bridge and the SQLite Ledger
const { bridge } = require('./qea_bridge.js');
const { ledger } = require('./qea_ledger.js');

const task = process.argv[2] || "Analyze FMO Complex routing at 300K.";

console.log("=================================================================");
console.log("               QEA PRIME: MASTER ORCHESTRATOR (V4)               ");
console.log("             8-ENGINE QUANTUM-MIMETIC ARCHITECTURE               ");
console.log("=================================================================\n");
console.log(`[GLOBAL TASK] "${task}"\n`);

try {
    // LAYER 1: PROBABILITY CLOUD & ALIGNMENT (Moved to front per Architectural Audit)
    console.log(">>> INITIATING ENGINE 1: SUPERPOSITION (Observation) <<<");
    execSync(`node superposition_engine.js "${task}"`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 2: INTERFERENCE (Phase-Alignment) <<<");
    execSync(`node interference_engine.js "${task}"`, { stdio: 'inherit' });

    // LAYER 2: THE BRIDGE (Task-Adaptive Graph & Anchor Generation)
    console.log("\n>>> INITIATING OPENCLAW BRIDGE (Task-Adaptive Knowledge Extraction) <<<");
    const graph = bridge.buildKnowledgeGraph(task);
    console.log(`[BRIDGE] Active Domains: ${graph.activeDomains.join(', ')}`);
    console.log(`[BRIDGE] Task Empirical Score: ${graph.taskScore}`);

    // THE PREAMBLE SHIELD: Hard gate against hallucination
    if (graph.taskScore <= 0.35) {
        throw new Error(`Preamble Quarantine: Empirical score (${graph.taskScore}) is too low. Pure Theory Detected. QEA PRIME does not invent.`);
    }

    // Write the dynamic graph matrix so Engine 7 can read it natively
    fs.writeFileSync('openclaw_graph_output.json', JSON.stringify(graph, null, 2));

    // LAYER 3: TRANSMISSION SHIELD
    console.log("\n>>> INITIATING ENGINE 6: QUANTUM ERROR CORRECTION (Shield) <<<");
    const qec = new QECEngine();
    
    // Dynamically pull physical anchor confidence from the primary domain
    const dynamicAnchors = graph.nodes.length > 0 ? graph.nodes[0].anchors : [
        { source: 'Wikipedia', confidence: 0.30 },
        { source: 'arXiv', confidence: 0.30 },
        { source: 'NIST', confidence: 0.30 }
    ];

    const incomingClaim = new Claim('OPENCLAW_TARGET', task, dynamicAnchors);
    const safeClaims = qec.processBatch([incomingClaim]);
    
    if (safeClaims.length === 0) throw new Error("QEC Quarantine: All claims failed syndrome check.");

    // LAYER 4: EPISTEMIC UNCERTAINTY
    console.log("\n>>> INITIATING ENGINE 5: DENSITY MATRIX (Entropy Gate) <<<");
    const dm = new DensityMatrixEngine();
    const state = dm.process(safeClaims[0].id, safeClaims[0].anchors, "Discovery");
    dm.report();
    
    if (state.verdict.includes('QUARANTINE')) throw new Error(`Epistemic Quarantine: Entropy too high.`);

    // LAYER 5: TOPOLOGICAL FACTORIZATION
    console.log("\n>>> INITIATING ENGINE 7: HAMILTONIAN OPTIMIZER (Ground State Discovery) <<<");
    execSync(`node engine7_hamiltonian.js`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 8: MANY-WORLDS ARBITRATION (Lazy Collapse) <<<");
    execSync(`node engine8_manyworlds.js`, { stdio: 'inherit' });

    // LAYER 6: PHYSICALIZATION & PROVENANCE
    console.log("\n>>> INITIATING ENGINE 3: ENTANGLEMENT (Non-Local Sync) <<<");
    execSync(`node entanglement_engine.js`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 4: UNITARY EVOLUTION (Cryptographic Provenance) <<<");
    // SOTA FIX: Bypassing the old script. Writing directly to immortal SQLite ledger.
    const hash = ledger.evolveState('PIPELINE_COMPLETE', { 
        task: task, 
        domains: graph.activeDomains,
        score: graph.taskScore 
    });
    
    console.log(`[LEDGER] Immutable State Written to qea_ledger.db`);
    console.log(`[LEDGER] Genesis Chain Hash: ${hash}`);

    console.log("\n=================================================================");
    console.log("[SYSTEM] GLOBAL PIPELINE EXECUTION COMPLETE (8-ENGINE ARCHITECTURE).");
    console.log("[SYSTEM] QEA PRIME IS STABLE AND AWAITING NEXT DIRECTIVE.");
    console.log("=================================================================\n");

} catch (error) {
    console.error(`\n[CRITICAL DECOHERENCE] Pipeline halted: ${error.message}`);
}
